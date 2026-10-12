'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Navigation, TabType } from '@/components/Navigation';
import { DashboardView } from '@/components/DashboardView';
import { ClientsView } from '@/components/ClientsView';
import { NewSaleView } from '@/components/NewSaleView';
import { SalesView } from '@/components/SalesView';
import { SettingsView } from '@/components/SettingsView';
import { AuthView } from '@/components/AuthView';
import { 
  Cliente, 
  Venda, 
  Parcela, 
  CobrancaComCliente 
} from '@/types/database';
import { 
  initializeStore, 
  getStoredClients, 
  saveStoredClients, 
  getStoredSales, 
  saveStoredSales, 
  getStoredInstallments, 
  saveStoredInstallments, 
  getStoredSettings, 
  saveStoredSettings, 
  ConsultantSettings, 
  getInitialSeedData,
  DEFAULT_SETTINGS
} from '@/lib/store';
import { 
  getSupabase, 
  getCurrentSession, 
  signOut as supabaseSignOut,
  fetchUserData,
  createClientCloud,
  updateClientCloud,
  deleteClientCloud,
  createSaleCloud,
  updateSaleCloud,
  deleteSaleCloud,
  updateInstallmentPaidStatusCloud,
  generateUUID
} from '@/lib/supabase/service';
import { getTodayRecife, formatDateBR, getCurrentMonthRangeRecife, normalizeDateISO } from '@/lib/date-utils';
import { CalculatedInstallment } from '@/lib/calculations';
import { Check } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  // Data state
  const [clients, setClients] = useState<Cliente[]>([]);
  const [sales, setSales] = useState<Venda[]>([]);
  const [installments, setInstallments] = useState<Parcela[]>([]);
  const [settings, setSettings] = useState<ConsultantSettings>(DEFAULT_SETTINGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [today, setToday] = useState<string>('');
  const [todayFormatted, setTodayFormatted] = useState<string>('');
  const [monthRange, setMonthRange] = useState<{ startOfMonth: string; endOfMonth: string }>({
    startOfMonth: '',
    endOfMonth: '',
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Carrega dados locais (modo demonstração/cache)
  const loadLocalData = useCallback(() => {
    initializeStore();
    setClients(getStoredClients());
    setSales(getStoredSales());
    setInstallments(getStoredInstallments());
    setSettings(getStoredSettings());
  }, []);

  // Carrega dados da nuvem Supabase
  const loadCloudData = useCallback(async (userId: string) => {
    try {
      const data = await fetchUserData(userId);
      setClients(data.clients);
      setSales(data.sales);
      setInstallments(data.installments);
      
      // Carrega ajustes locais ou iniciais
      const savedSettings = getStoredSettings();
      setSettings(savedSettings);
    } catch (err) {
      console.error('Falha ao carregar dados do Supabase:', err);
      // Fallback para cache local se offline
      loadLocalData();
      showToast('Modo offline: usando dados salvos no aparelho.');
    }
  }, [loadLocalData, showToast]);

  // Inicialização de Auth e Datas no cliente
  useEffect(() => {
    async function initAuth() {
      const todayStr = getTodayRecife();
      setToday(todayStr);
      setTodayFormatted(formatDateBR(todayStr));
      setMonthRange(getCurrentMonthRangeRecife());
      try {
        const session = await getCurrentSession();
        if (session?.user) {
          setUser(session.user);
          setIsDemoMode(false);
          await loadCloudData(session.user.id);
        } else {
          // Se não há sessão, verifica se o usuário marcou para ficar em modo demo
          const savedDemo = localStorage.getItem('mk_demo_mode');
          if (savedDemo === 'true') {
            setIsDemoMode(true);
            loadLocalData();
          }
        }
      } catch (e) {
        console.error('Erro na checagem de sessão:', e);
        loadLocalData();
      } finally {
        setIsCheckingAuth(false);
        setMounted(true);
      }
    }

    initAuth();

    // Listener de mudanças na autenticação
    const supabase = getSupabase();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsDemoMode(false);
        localStorage.removeItem('mk_demo_mode');
        await loadCloudData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsDemoMode(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [loadCloudData, loadLocalData]);

  // Callbacks de Autenticação
  const handleAuthSuccess = async (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setIsDemoMode(false);
    localStorage.removeItem('mk_demo_mode');
    await loadCloudData(authenticatedUser.id);
    showToast('Login realizado com sucesso! Nuvem conectada.');
  };

  const handleContinueDemo = () => {
    setIsDemoMode(true);
    localStorage.setItem('mk_demo_mode', 'true');
    loadLocalData();
    showToast('Modo demonstração ativado.');
  };

  const handleSignOut = async () => {
    try {
      await supabaseSignOut();
      setUser(null);
      setIsDemoMode(false);
      localStorage.removeItem('mk_demo_mode');
      showToast('Sessão encerrada.');
    } catch (e) {
      console.error('Erro ao sair:', e);
    }
  };

  // União unificada de cobranças para o Dashboard
  const charges: CobrancaComCliente[] = useMemo(() => {
    const clientMap = new Map<string, Cliente>();
    clients.forEach((c) => clientMap.set(c.id_cliente, c));

    const saleMap = new Map<string, Venda>();
    sales.forEach((s) => saleMap.set(s.id_venda, s));

    return installments.map((p) => {
      const sale = saleMap.get(p.id_venda);
      const client = sale ? clientMap.get(sale.id_cliente) : undefined;

      return {
        id_parcela: p.id_parcela,
        numero_da_parcela: p.numero_da_parcela,
        valor_parcela: p.valor_parcela,
        data_vencimento: p.data_vencimento,
        status_pago: p.status_pago,
        data_pagamento: p.data_pagamento,
        id_venda: p.id_venda,
        descricao_produtos: sale?.descricao_produtos || 'Produtos diversos',
        total_de_parcelas: sale?.total_de_parcelas || 1,
        data_venda: sale?.data_venda || p.data_vencimento,
        id_cliente: client?.id_cliente || '',
        nome_cliente: client?.nome || 'Cliente não identificada',
        telefone_cliente: client?.telefone || '',
      };
    });
  }, [clients, sales, installments]);

  // Contagem de pendências de hoje para o badge da barra de navegação
  const pendingTodayCount = useMemo(() => {
    if (!today) return 0;
    return charges.filter((c) => c.data_vencimento === today && !c.status_pago).length;
  }, [charges, today]);

  // ============================================================================
  // AÇÕES: Marcar parcela como paga (RF08)
  // ============================================================================
  const handleMarkPaid = async (id_parcela: string, newStatus: boolean) => {
    const todayDate = today || getTodayRecife();
    const updated = installments.map((p) => {
      if (p.id_parcela === id_parcela) {
        return {
          ...p,
          status_pago: newStatus,
          data_pagamento: newStatus ? todayDate : null,
        };
      }
      return p;
    });

    setInstallments(updated);
    saveStoredInstallments(updated);
    showToast(newStatus ? 'Pagamento registrado com sucesso!' : 'Parcela marcada como pendente.');

    // Sincroniza com Supabase se logado
    if (user) {
      try {
        await updateInstallmentPaidStatusCloud(
          id_parcela,
          newStatus,
          newStatus ? todayDate : null
        );
      } catch (err) {
        console.error('Erro ao sincronizar parcela no Supabase:', err);
      }
    }
  };

  // ============================================================================
  // AÇÕES: Gestão de Clientes (RF02)
  // ============================================================================
  const handleAddClient = async (nome: string, telefone: string) => {
    const todayDate = today || getTodayRecife();
    const newClient: Cliente = {
      id_cliente: generateUUID(),
      nome,
      telefone,
      data_cadastro: todayDate,
    };
    const updated = [newClient, ...clients];
    setClients(updated);
    saveStoredClients(updated);
    showToast('Cliente cadastrada com sucesso!');

    if (user) {
      try {
        await createClientCloud(newClient, user.id);
      } catch (err) {
        console.error('Erro ao sincronizar cliente no Supabase:', err);
      }
    }
  };

  const handleUpdateClient = async (id_cliente: string, nome: string, telefone: string) => {
    const updated = clients.map((c) =>
      c.id_cliente === id_cliente ? { ...c, nome, telefone } : c
    );
    setClients(updated);
    saveStoredClients(updated);
    showToast('Cadastro atualizado!');

    if (user) {
      try {
        await updateClientCloud(id_cliente, nome, telefone);
      } catch (err) {
        console.error('Erro ao atualizar cliente no Supabase:', err);
      }
    }
  };

  const handleDeleteClient = async (id_cliente: string) => {
    const updatedClients = clients.filter((c) => c.id_cliente !== id_cliente);
    const salesToRemove = sales.filter((s) => s.id_cliente === id_cliente);
    const saleIdsToRemove = new Set(salesToRemove.map((s) => s.id_venda));

    const updatedSales = sales.filter((s) => !saleIdsToRemove.has(s.id_venda));
    const updatedInstallments = installments.filter((p) => !saleIdsToRemove.has(p.id_venda));

    setClients(updatedClients);
    setSales(updatedSales);
    setInstallments(updatedInstallments);

    saveStoredClients(updatedClients);
    saveStoredSales(updatedSales);
    saveStoredInstallments(updatedInstallments);

    showToast('Cliente e histórico removidos.');

    if (user) {
      try {
        await deleteClientCloud(id_cliente);
      } catch (err) {
        console.error('Erro ao deletar cliente no Supabase:', err);
      }
    }
  };

  // ============================================================================
  // AÇÕES: Registro de Venda (RF03, RF04)
  // ============================================================================
  const handleAddSale = async (
    id_cliente: string,
    descricao_produtos: string,
    valor_total: number,
    total_de_parcelas: number,
    data_venda: string,
    calculatedInstallments: CalculatedInstallment[]
  ) => {
    const saleId = generateUUID();
    const newSale: Venda = {
      id_venda: saleId,
      id_cliente,
      descricao_produtos,
      valor_total,
      data_venda: normalizeDateISO(data_venda),
      total_de_parcelas,
      created_at: normalizeDateISO(data_venda),
    };

    const newInstallmentsList: Parcela[] = calculatedInstallments.map((calc) => ({
      id_parcela: generateUUID(),
      id_venda: saleId,
      numero_da_parcela: calc.numero_da_parcela,
      valor_parcela: calc.valor_parcela,
      data_vencimento: normalizeDateISO(calc.data_vencimento),
      status_pago: false,
      data_pagamento: null,
      created_at: normalizeDateISO(data_venda),
    }));

    const updatedSales = [newSale, ...sales];
    const updatedInstallments = [...newInstallmentsList, ...installments];

    setSales(updatedSales);
    setInstallments(updatedInstallments);

    saveStoredSales(updatedSales);
    saveStoredInstallments(updatedInstallments);

    showToast('Venda registrada com sucesso!');

    if (user) {
      try {
        await createSaleCloud(newSale, newInstallmentsList, user.id);
      } catch (err) {
        console.error('Erro ao cadastrar venda no Supabase:', err);
      }
    }
  };

  const handleUpdateSale = async (updatedSale: Venda, updatedInstallments: Parcela[]) => {
    const normalizedSale: Venda = {
      ...updatedSale,
      data_venda: normalizeDateISO(updatedSale.data_venda),
    };

    const normalizedInstallments: Parcela[] = updatedInstallments.map((p) => ({
      ...p,
      data_vencimento: normalizeDateISO(p.data_vencimento),
      data_pagamento: p.data_pagamento ? normalizeDateISO(p.data_pagamento) : null,
    }));

    const updatedSales = sales.map((s) =>
      s.id_venda === normalizedSale.id_venda ? normalizedSale : s
    );

    const otherInstallments = installments.filter(
      (p) => p.id_venda !== normalizedSale.id_venda
    );
    const allUpdatedInstallments = [...normalizedInstallments, ...otherInstallments];

    setSales(updatedSales);
    setInstallments(allUpdatedInstallments);

    saveStoredSales(updatedSales);
    saveStoredInstallments(allUpdatedInstallments);

    showToast('Venda atualizada com sucesso!');

    if (user) {
      try {
        await updateSaleCloud(normalizedSale, normalizedInstallments);
      } catch (err) {
        console.error('Erro ao atualizar venda no Supabase:', err);
      }
    }
  };

  const handleDeleteSale = async (id_venda: string) => {
    const updatedSales = sales.filter((s) => s.id_venda !== id_venda);
    const updatedInstallments = installments.filter((p) => p.id_venda !== id_venda);

    setSales(updatedSales);
    setInstallments(updatedInstallments);

    saveStoredSales(updatedSales);
    saveStoredInstallments(updatedInstallments);

    showToast('Venda removida.');

    if (user) {
      try {
        await deleteSaleCloud(id_venda);
      } catch (err) {
        console.error('Erro ao deletar venda no Supabase:', err);
      }
    }
  };

  // Configurações
  const handleSaveSettings = (newSettings: ConsultantSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    showToast('Configurações atualizadas!');
  };

  const handleResetData = () => {
    const seed = getInitialSeedData();
    setClients(seed.clients);
    setSales(seed.sales);
    setInstallments(seed.installments);
    setSettings(DEFAULT_SETTINGS);

    saveStoredClients(seed.clients);
    saveStoredSales(seed.sales);
    saveStoredInstallments(seed.installments);
    saveStoredSettings(DEFAULT_SETTINGS);

    showToast('Dados de demonstração restaurados!');
    setActiveTab('dashboard');
  };

  // Loading inicial
  if (!mounted || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
        <div className="text-center space-y-2">
          <span className="font-serif tracking-[0.25em] text-xl font-bold text-[#1C1C1E] block">
            MARY KAY
          </span>
          <span className="text-xs text-rose-600 animate-pulse font-medium">
            Carregando aplicativo...
          </span>
        </div>
      </div>
    );
  }

  // Se não está logado e não optou por demonstração, exibe tela de login/cadastro
  if (!user && !isDemoMode) {
    return (
      <AuthView
        onAuthSuccess={handleAuthSuccess}
        onContinueDemo={handleContinueDemo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#E5E5EA]/40 flex flex-col justify-between">
      {/* Container Principal Mobile-First iOS */}
      <div className="w-full max-w-md mx-auto bg-[#F2F2F7] min-h-screen shadow-xl relative flex flex-col">
        {/* Header Superior estilo iOS */}
        <Header
          consultantName={settings.nome}
          todayFormatted={todayFormatted}
          isCloudSynced={!!user}
          onOpenSettings={() => setActiveTab('settings')}
        />

        {/* Notificação Cápsula estilo Dynamic Island do iOS */}
        {toastMessage && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C1E]/95 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold backdrop-blur-xl border border-white/10 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Conteúdo Dinâmico das Abas */}
        <main className="flex-1 px-4 pt-4">
          {activeTab === 'dashboard' && (
            <DashboardView
              charges={charges}
              settings={settings}
              today={today}
              startOfMonth={monthRange.startOfMonth}
              endOfMonth={monthRange.endOfMonth}
              onMarkPaid={handleMarkPaid}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView
              clients={clients}
              sales={sales}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
            />
          )}

          {activeTab === 'new-sale' && (
            <NewSaleView
              clients={clients}
              today={today}
              onAddSale={handleAddSale}
              onNavigateToClients={() => setActiveTab('clients')}
              onSaleCreatedSuccess={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'sales' && (
            <SalesView
              sales={sales}
              installments={installments}
              clients={clients}
              settings={settings}
              onMarkPaid={handleMarkPaid}
              onDeleteSale={handleDeleteSale}
              onUpdateSale={handleUpdateSale}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              user={user}
              isDemoMode={isDemoMode}
              onSaveSettings={handleSaveSettings}
              onResetData={handleResetData}
              onSignOut={handleSignOut}
              onOpenAuth={() => {
                setIsDemoMode(false);
                localStorage.removeItem('mk_demo_mode');
              }}
            />
          )}
        </main>

        {/* Barra de Navegação Inferior (Mobile Dock) */}
        <Navigation
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          pendingTodayCount={pendingTodayCount}
        />
      </div>
    </div>
  );
}
