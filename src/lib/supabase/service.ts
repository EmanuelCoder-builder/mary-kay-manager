import { createClient } from './client';
import { Cliente, Venda, Parcela } from '@/types/database';
import { User, Session } from '@supabase/supabase-js';

const PERSISTENT_USER_KEY = 'mk_persistent_user_v1';
const LOCAL_ACCOUNTS_KEY = 'mk_local_accounts_v1';
const EXPLICIT_LOGOUT_KEY = 'mk_explicit_logout_v1';

interface LocalAccount {
  id: string;
  email: string;
  password?: string;
  name: string;
  created_at: string;
}

// Utilitário para gerar UUID padrão RFC 4122 v4 compatível com PostgreSQL
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // continua para fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Instância única no cliente
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient();
  }
  return supabaseInstance;
}

// ============================================================================
// VERIFICAÇÃO RÁPIDA DE CONECTIVIDADE COM SUPABASE (EVITA ERROS QUANDO PAUSADO)
// ============================================================================

let reachabilityCache: { online: boolean; checkedAt: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minuto

export async function isSupabaseReachable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (
    reachabilityCache &&
    Date.now() - reachabilityCache.checkedAt < CACHE_TTL_MS
  ) {
    return reachabilityCache.online;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    reachabilityCache = { online: false, checkedAt: Date.now() };
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2200);

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey: supabaseAnonKey },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const online = res.ok || res.status === 401;
    reachabilityCache = { online, checkedAt: Date.now() };
    return online;
  } catch {
    clearTimeout(timeout);
    reachabilityCache = { online: false, checkedAt: Date.now() };
    return false;
  }
}

// ============================================================================
// GERENCIAMENTO DE SESSÃO LOCAL PERSISTENTE (NUNCA DESLOGA SOZINHO)
// ============================================================================

function buildMockUser(account: LocalAccount): User {
  return {
    id: account.id,
    app_metadata: { provider: 'email' },
    user_metadata: { name: account.name },
    aud: 'authenticated',
    created_at: account.created_at,
    email: account.email,
  } as User;
}

function getLocalAccounts(): LocalAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAccount(account: LocalAccount): void {
  if (typeof window === 'undefined') return;
  try {
    const accounts = getLocalAccounts();
    const idx = accounts.findIndex(
      (a) => a.email.toLowerCase() === account.email.toLowerCase()
    );
    if (idx >= 0) {
      accounts[idx] = { ...accounts[idx], ...account };
    } else {
      accounts.push(account);
    }
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // ignore storage errors
  }
}

export function getPersistentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    // 1. Verifica nossa sessão persistente
    const saved = localStorage.getItem(PERSISTENT_USER_KEY);
    if (saved) {
      return JSON.parse(saved) as User;
    }

    // 2. Tenta recuperar de qualquer token antigo do Supabase salvo no navegador
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const sbUser = parsed?.user || parsed?.currentSession?.user;
          if (sbUser && sbUser.id) {
            localStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(sbUser));
            return sbUser as User;
          }
        }
      }
    }

    // 3. Se a consultora nunca clicou explicitamente em "Sair", cria sessão padrão automática
    const explicitLogout = localStorage.getItem(EXPLICIT_LOGOUT_KEY);
    if (explicitLogout !== 'true') {
      const defaultAccount: LocalAccount = {
        id: '00000000-0000-4000-8000-000000000001',
        email: 'consultora@marykay.com',
        name: 'Consultora Emanuelly',
        created_at: new Date().toISOString(),
      };
      const defaultUser = buildMockUser(defaultAccount);
      localStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(defaultUser));
      return defaultUser;
    }
  } catch {
    // ignore
  }
  return null;
}

export function savePersistentUser(user: User): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(user));
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
  } catch {
    // ignore
  }
}

// ============================================================================
// SERVIÇOS DE AUTENTICAÇÃO HÍBRIDOS (ONLINE + OFFLINE FALLBACK)
// ============================================================================

export async function getCurrentSession(): Promise<Session | null> {
  const persistentUser = getPersistentUser();

  if (await isSupabaseReachable()) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.getSession();
      if (!error && data.session?.user) {
        savePersistentUser(data.session.user);
        return data.session;
      }
    } catch {
      // Continua para sessão persistente local
    }
  }

  if (persistentUser) {
    return {
      access_token: 'local-persistent-token',
      refresh_token: 'local-persistent-refresh',
      expires_in: 31536000,
      token_type: 'bearer',
      user: persistentUser,
    } as Session;
  }

  return null;
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export async function signInWithEmail(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Tenta autenticar no Supabase se estiver online
  if (await isSupabaseReachable()) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (!error && data.user) {
        savePersistentUser(data.user);
        saveLocalAccount({
          id: data.user.id,
          email: normalizedEmail,
          password,
          name: data.user.user_metadata?.name || 'Consultora Mary Kay',
          created_at: data.user.created_at || new Date().toISOString(),
        });
        return data;
      }
      if (error && error.message.includes('Invalid login credentials')) {
        // Verifica se a conta foi criada localmente enquanto o Supabase estava pausado
        const localMatch = getLocalAccounts().find(
          (a) => a.email.toLowerCase() === normalizedEmail
        );
        if (!localMatch) {
          throw error;
        }
      }
    } catch (err) {
      // Se for erro de credenciais inválidas no servidor e não existir localmente, repassa
      if (
        err instanceof Error &&
        err.message.includes('Invalid login credentials')
      ) {
        const localMatch = getLocalAccounts().find(
          (a) => a.email.toLowerCase() === normalizedEmail
        );
        if (!localMatch) {
          throw err;
        }
      }
      // Qualquer erro de rede / Failed to fetch cai no fallback local abaixo
    }
  }

  // 2. Fallback Local (funciona mesmo com Supabase pausado ou sem internet)
  const accounts = getLocalAccounts();
  const existing = accounts.find(
    (a) => a.email.toLowerCase() === normalizedEmail
  );

  if (existing && existing.password && existing.password !== password) {
    throw new Error('Invalid login credentials');
  }

  const account: LocalAccount = existing || {
    id: generateUUID(),
    email: normalizedEmail,
    password,
    name: normalizedEmail.split('@')[0] || 'Consultora Mary Kay',
    created_at: new Date().toISOString(),
  };

  saveLocalAccount(account);
  const user = buildMockUser(account);
  savePersistentUser(user);

  return {
    user,
    session: {
      access_token: 'local-persistent-token',
      refresh_token: 'local-persistent-refresh',
      expires_in: 31536000,
      token_type: 'bearer',
      user,
    } as Session,
  };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  consultantName?: string
) {
  const normalizedEmail = email.trim().toLowerCase();
  const displayName = consultantName?.trim() || 'Consultora Mary Kay';

  // 1. Tenta criar no Supabase se estiver online
  if (await isSupabaseReachable()) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: displayName,
          },
        },
      });

      if (!error && data.user) {
        savePersistentUser(data.user);
        saveLocalAccount({
          id: data.user.id,
          email: normalizedEmail,
          password,
          name: displayName,
          created_at: data.user.created_at || new Date().toISOString(),
        });
        return {
          user: data.user,
          session:
            data.session ||
            ({
              access_token: 'local-persistent-token',
              refresh_token: 'local-persistent-refresh',
              expires_in: 31536000,
              token_type: 'bearer',
              user: data.user,
            } as Session),
        };
      }
    } catch {
      // Continua para criação local caso o Supabase esteja pausado ou inacessível
    }
  }

  // 2. Fallback Local Imediato
  const account: LocalAccount = {
    id: generateUUID(),
    email: normalizedEmail,
    password,
    name: displayName,
    created_at: new Date().toISOString(),
  };

  saveLocalAccount(account);
  const user = buildMockUser(account);
  savePersistentUser(user);

  return {
    user,
    session: {
      access_token: 'local-persistent-token',
      refresh_token: 'local-persistent-refresh',
      expires_in: 31536000,
      token_type: 'bearer',
      user,
    } as Session,
  };
}

export async function signOut() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PERSISTENT_USER_KEY);
    localStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');
  }
  if (await isSupabaseReachable()) {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch {
      // ignora erro se servidor estiver offline
    }
  }
}

// ============================================================================
// OPERAÇÕES DO BANCO DE DADOS (COM PROTEÇÃO CONTRA PROJETO PAUSADO)
// ============================================================================

export async function fetchUserData(userId: string): Promise<{
  clients: Cliente[];
  sales: Venda[];
  installments: Parcela[];
}> {
  if (!(await isSupabaseReachable())) {
    throw new Error('Supabase offline ou pausado');
  }

  const supabase = getSupabase();

  const { data: clientsData, error: clientsError } = await supabase
    .from('cliente')
    .select('*')
    .eq('user_id', userId)
    .order('nome', { ascending: true });

  if (clientsError) {
    throw clientsError;
  }

  const { data: salesData, error: salesError } = await supabase
    .from('venda')
    .select('*')
    .eq('user_id', userId)
    .order('data_venda', { ascending: false });

  if (salesError) {
    throw salesError;
  }

  const salesList = (salesData || []) as Venda[];
  const clientsList = (clientsData || []) as Cliente[];

  let installmentsData: Parcela[] = [];
  if (salesList.length > 0) {
    const saleIds = salesList.map((s) => s.id_venda);
    const { data: instData, error: instError } = await supabase
      .from('parcela')
      .select('*')
      .in('id_venda', saleIds)
      .order('numero_da_parcela', { ascending: true });

    if (instError) {
      throw instError;
    }
    installmentsData = (instData || []) as Parcela[];
  }

  return {
    clients: clientsList,
    sales: salesList,
    installments: installmentsData,
  };
}

// CLIENTES
export async function createClientCloud(
  client: Cliente,
  userId: string
): Promise<Cliente | null> {
  if (!(await isSupabaseReachable())) return null;
  const supabase = getSupabase();
  const payload = {
    id_cliente: client.id_cliente,
    nome: client.nome,
    telefone: client.telefone,
    data_cadastro: client.data_cadastro,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('cliente')
    .insert(payload as never)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as Cliente;
}

export async function updateClientCloud(
  id_cliente: string,
  nome: string,
  telefone: string
): Promise<void> {
  if (!(await isSupabaseReachable())) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from('cliente')
    .update({ nome, telefone } as never)
    .eq('id_cliente', id_cliente);

  if (error) {
    throw error;
  }
}

export async function deleteClientCloud(id_cliente: string): Promise<void> {
  if (!(await isSupabaseReachable())) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from('cliente')
    .delete()
    .eq('id_cliente', id_cliente);

  if (error) {
    throw error;
  }
}

// VENDAS E PARCELAS
export async function createSaleCloud(
  sale: Venda,
  installments: Parcela[],
  userId: string
): Promise<void> {
  if (!(await isSupabaseReachable())) return;
  const supabase = getSupabase();

  const salePayload = {
    id_venda: sale.id_venda,
    id_cliente: sale.id_cliente,
    descricao_produtos: sale.descricao_produtos,
    valor_total: sale.valor_total,
    data_venda: sale.data_venda,
    total_de_parcelas: sale.total_de_parcelas,
    user_id: userId,
  };

  const { error: saleError } = await supabase
    .from('venda')
    .insert(salePayload as never);

  if (saleError) {
    throw saleError;
  }

  const installmentsPayload = installments.map((p) => ({
    id_parcela: p.id_parcela,
    id_venda: sale.id_venda,
    numero_da_parcela: p.numero_da_parcela,
    valor_parcela: p.valor_parcela,
    data_vencimento: p.data_vencimento,
    status_pago: p.status_pago,
    data_pagamento: p.data_pagamento,
  }));

  const { error: instError } = await supabase
    .from('parcela')
    .insert(installmentsPayload as never);

  if (instError) {
    throw instError;
  }
}

export async function updateSaleCloud(
  sale: Venda,
  installments: Parcela[]
): Promise<void> {
  if (!(await isSupabaseReachable())) return;
  const supabase = getSupabase();

  const { error: saleError } = await supabase
    .from('venda')
    .update({
      id_cliente: sale.id_cliente,
      descricao_produtos: sale.descricao_produtos,
      valor_total: sale.valor_total,
      data_venda: sale.data_venda,
      total_de_parcelas: sale.total_de_parcelas,
    } as never)
    .eq('id_venda', sale.id_venda);

  if (saleError) {
    throw saleError;
  }

  await supabase.from('parcela').delete().eq('id_venda', sale.id_venda);

  const installmentsPayload = installments.map((p) => ({
    id_parcela: p.id_parcela,
    id_venda: sale.id_venda,
    numero_da_parcela: p.numero_da_parcela,
    valor_parcela: p.valor_parcela,
    data_vencimento: p.data_vencimento,
    status_pago: p.status_pago,
    data_pagamento: p.data_pagamento,
  }));

  const { error: instError } = await supabase
    .from('parcela')
    .insert(installmentsPayload as never);

  if (instError) {
    throw instError;
  }
}

export async function deleteSaleCloud(id_venda: string): Promise<void> {
  if (!(await isSupabaseReachable())) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from('venda')
    .delete()
    .eq('id_venda', id_venda);

  if (error) {
    throw error;
  }
}

export async function updateInstallmentPaidStatusCloud(
  id_parcela: string,
  status_pago: boolean,
  data_pagamento: string | null
): Promise<void> {
  if (!(await isSupabaseReachable())) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from('parcela')
    .update({
      status_pago,
      data_pagamento,
    } as never)
    .eq('id_parcela', id_parcela);

  if (error) {
    throw error;
  }
}
