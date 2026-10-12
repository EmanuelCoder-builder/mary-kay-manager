import { createClient } from './client';
import { Cliente, Venda, Parcela } from '@/types/database';
import { User, Session } from '@supabase/supabase-js';

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
// SERVIÇOS DE AUTENTICAÇÃO
// ============================================================================

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    throw error;
  }
  return data;
}

export async function signUpWithEmail(email: string, password: string, consultantName?: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: consultantName || 'Consultora Mary Kay',
      },
    },
  });
  if (error) {
    throw error;
  }
  return data;
}

export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

// ============================================================================
// OPERAÇÕES DO BANCO DE DADOS (SUPABASE POSTGRESQL + RLS)
// ============================================================================

export async function fetchUserData(userId: string): Promise<{
  clients: Cliente[];
  sales: Venda[];
  installments: Parcela[];
}> {
  const supabase = getSupabase();

  // 1. Clientes da consultora
  const { data: clientsData, error: clientsError } = await supabase
    .from('cliente')
    .select('*')
    .eq('user_id', userId)
    .order('nome', { ascending: true });

  if (clientsError) {
    console.error('Erro ao buscar clientes no Supabase:', clientsError);
    throw clientsError;
  }

  // 2. Vendas da consultora
  const { data: salesData, error: salesError } = await supabase
    .from('venda')
    .select('*')
    .eq('user_id', userId)
    .order('data_venda', { ascending: false });

  if (salesError) {
    console.error('Erro ao buscar vendas no Supabase:', salesError);
    throw salesError;
  }

  const salesList = (salesData || []) as Venda[];
  const clientsList = (clientsData || []) as Cliente[];

  // 3. Parcelas vinculadas a essas vendas
  let installmentsData: Parcela[] = [];
  if (salesList.length > 0) {
    const saleIds = salesList.map((s) => s.id_venda);
    const { data: instData, error: instError } = await supabase
      .from('parcela')
      .select('*')
      .in('id_venda', saleIds)
      .order('numero_da_parcela', { ascending: true });

    if (instError) {
      console.error('Erro ao buscar parcelas no Supabase:', instError);
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
export async function createClientCloud(client: Cliente, userId: string): Promise<Cliente> {
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
    console.error('Erro ao criar cliente no Supabase:', error);
    throw error;
  }
  return data as Cliente;
}

export async function updateClientCloud(
  id_cliente: string,
  nome: string,
  telefone: string
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('cliente')
    .update({ nome, telefone } as never)
    .eq('id_cliente', id_cliente);

  if (error) {
    console.error('Erro ao atualizar cliente no Supabase:', error);
    throw error;
  }
}

export async function deleteClientCloud(id_cliente: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('cliente')
    .delete()
    .eq('id_cliente', id_cliente);

  if (error) {
    console.error('Erro ao remover cliente no Supabase:', error);
    throw error;
  }
}

// VENDAS E PARCELAS
export async function createSaleCloud(
  sale: Venda,
  installments: Parcela[],
  userId: string
): Promise<void> {
  const supabase = getSupabase();

  // 1. Inserir a venda primeiro
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
    console.error('Erro ao cadastrar venda no Supabase:', saleError);
    throw saleError;
  }

  // 2. Inserir as parcelas da venda
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
    console.error('Erro ao cadastrar parcelas no Supabase:', instError);
    throw instError;
  }
}

export async function updateSaleCloud(
  sale: Venda,
  installments: Parcela[]
): Promise<void> {
  const supabase = getSupabase();

  // 1. Atualizar dados da venda
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
    console.error('Erro ao atualizar venda no Supabase:', saleError);
    throw saleError;
  }

  // 2. Remove parcelas antigas e recria as atualizadas
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
    console.error('Erro ao atualizar parcelas no Supabase:', instError);
    throw instError;
  }
}

export async function deleteSaleCloud(id_venda: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('venda')
    .delete()
    .eq('id_venda', id_venda);

  if (error) {
    console.error('Erro ao deletar venda no Supabase:', error);
    throw error;
  }
}

// STATUS DE PARCELA (CHECKOFF RÁPIDO)
export async function updateInstallmentPaidStatusCloud(
  id_parcela: string,
  status_pago: boolean,
  data_pagamento: string | null
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('parcela')
    .update({
      status_pago,
      data_pagamento,
    } as never)
    .eq('id_parcela', id_parcela);

  if (error) {
    console.error('Erro ao atualizar status de pagamento no Supabase:', error);
    throw error;
  }
}
