'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Navigation, TabType } from '@/components/Navigation';
import { DashboardView } from '@/components/DashboardView';
import { ClientsView } from '@/components/ClientsView';
import { NewSaleView } from '@/components/NewSaleView';
import { SalesView } from '@/components/SalesView';
import { SettingsView } from '@/components/SettingsView';
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
import { getTodayRecife, formatDateBR, getCurrentMonthRangeRecife } from '@/lib/date-utils';
import { CalculatedInstallment } from '@/lib/calculations';
import { Check } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
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

  // Inicializa o Store local e datas no mount
  useEffect(() => {
    initializeStore();
    const todayStr = getTodayRecife();
    setToday(todayStr);
    setTodayFormatted(formatDateBR(todayStr));
    setMonthRange(getCurrentMonthRangeRecife());

    setClients(getStoredClients());
    setSales(getStoredSales());
    setInstallments(getStoredInstallments());
    setSettings(getStoredSettings());
    setMounted(true);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // União unificada de cobranças
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

  // AÇÕES: Marcar parcela como paga (RF08)
  const handleMarkPaid = (id_parcela: string, newStatus: boolean) => {
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
  };

  // AÇÕES: Gestão de Clientes (RF02)
  const handleAddClient = (nome: string, telefone: string) => {
    const todayDate = today || getTodayRecife();
    const newClient: Cliente = {
      id_cliente: `c_${Date.now()}`,
      nome,
      telefone,
      data_cadastro: todayDate,
    };
    const updated = [newClient, ...clients];
    setClients(updated);
    saveStoredClients(updated);
    showToast('Cliente cadastrada com sucesso!');
  };

  const handleUpdateClient = (id_cliente: string, nome: string, telefone: string) => {
    const updated = clients.map((c) =>
      c.id_cliente === id_cliente ? { ...c, nome, telefone } : c
    );
    setClients(updated);
    saveStoredClients(updated);
    showToast('Cadastro atualizado!');
  };

  const handleDeleteClient = (id_cliente: string) => {
    // Remove cliente, vendas e parcelas vinculadas
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
  };

  // AÇÕES: Registro de Venda (RF03, RF04)
  const handleAddSale = (
    id_cliente: string,
    descricao_produtos: string,
    valor_total: number,
    total_de_parcelas: number,
    data_venda: string,
    calculatedInstallments: CalculatedInstallment[]
  ) => {
    const saleId = `v_${Date.now()}`;
    const newSale: Venda = {
      id_venda: saleId,
      id_cliente,
      descricao_produtos,
      valor_total,
      data_venda,
      total_de_parcelas,
      created_at: data_venda,
    };

    const newInstallmentsList: Parcela[] = calculatedInstallments.map((calc, idx) => ({
      id_parcela: `p_${saleId}_${idx + 1}`,
      id_venda: saleId,
      numero_da_parcela: calc.numero_da_parcela,
      valor_parcela: calc.valor_parcela,
      data_vencimento: calc.data_vencimento,
      status_pago: false,
      data_pagamento: null,
      created_at: data_venda,
    }));

    const updatedSales = [newSale, ...sales];
    const updatedInstallments = [...newInstallmentsList, ...installments];

    setSales(updatedSales);
    setInstallments(updatedInstallments);

    saveStoredSales(updatedSales);
    saveStoredInstallments(updatedInstallments);

    showToast('Venda registrada e parcelas geradas!');
  };

  const handleDeleteSale = (id_venda: string) => {
    const updatedSales = sales.filter((s) => s.id_venda !== id_venda);
    const updatedInstallments = installments.filter((p) => p.id_venda !== id_venda);

    setSales(updatedSales);
    setInstallments(updatedInstallments);

    saveStoredSales(updatedSales);
    saveStoredInstallments(updatedInstallments);

    showToast('Venda removida.');
  };

  // AÇÕES: Configurações
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

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center space-y-2">
          <span className="font-serif tracking-[0.2em] text-lg font-bold text-zinc-950 block">
            MARY KAY
          </span>
          <span className="text-xs text-rose-600 animate-pulse font-medium">
            Carregando sua plataforma...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/60 flex flex-col justify-between">
      {/* Container Principal Mobile-First */}
      <div className="w-full max-w-md mx-auto bg-stone-50 min-h-screen shadow-2xl relative flex flex-col">
        {/* Header Superior com Identidade Mary Kay */}
        <Header
          consultantName={settings.nome}
          todayFormatted={todayFormatted}
          onOpenSettings={() => setActiveTab('settings')}
        />

        {/* Notificação Toast Flutuante */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/90 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold backdrop-blur-md border border-zinc-700 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <Check className="w-3 h-3" />
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
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetData={handleResetData}
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
