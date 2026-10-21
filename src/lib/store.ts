'use client';

import { Cliente, Venda, Parcela, CobrancaComCliente } from '@/types/database';
import { getTodayRecife, addDaysToDate } from './date-utils';

export interface ConsultantSettings {
  nome: string;
  chavePix: string;
}

const STORAGE_KEYS = {
  INITIALIZED: 'mk_initialized_v1',
  CLIENTS: 'mk_clients_v1',
  SALES: 'mk_sales_v1',
  INSTALLMENTS: 'mk_installments_v1',
  SETTINGS: 'mk_settings_v1',
};

export const DEFAULT_SETTINGS: ConsultantSettings = {
  nome: 'Consultora Emanuelly',
  chavePix: 'emanuelly.marykay@gmail.com',
};

// Seed de dados realistas com UUIDs válidos para compatibilidade total com PostgreSQL
export function getInitialSeedData() {
  const today = getTodayRecife();
  const past3Days = addDaysToDate(today, -3);
  const future15Days = addDaysToDate(today, 15);
  const future30Days = addDaysToDate(today, 30);
  const past30Days = addDaysToDate(today, -30);

  const c1 = '11111111-1111-4111-8111-111111111101';
  const c2 = '11111111-1111-4111-8111-111111111102';
  const c3 = '11111111-1111-4111-8111-111111111103';
  const c4 = '11111111-1111-4111-8111-111111111104';

  const v1 = '22222222-2222-4222-8222-222222222201';
  const v2 = '22222222-2222-4222-8222-222222222202';
  const v3 = '22222222-2222-4222-8222-222222222203';
  const v4 = '22222222-2222-4222-8222-222222222204';

  const clients: Cliente[] = [
    {
      id_cliente: c1,
      nome: 'Camila Albuquerque',
      telefone: '81998765432',
      data_cadastro: past30Days,
    },
    {
      id_cliente: c2,
      nome: 'Juliana Medeiros',
      telefone: '81987654321',
      data_cadastro: past30Days,
    },
    {
      id_cliente: c3,
      nome: 'Mariana Santos',
      telefone: '81991234567',
      data_cadastro: past30Days,
    },
    {
      id_cliente: c4,
      nome: 'Beatriz Lima',
      telefone: '81994567890',
      data_cadastro: past30Days,
    },
  ];

  const sales: Venda[] = [
    {
      id_venda: v1,
      id_cliente: c1,
      descricao_produtos: 'Kit TimeWise 3D Completo + Base Matte At Play',
      valor_total: 349.9,
      data_venda: past30Days,
      total_de_parcelas: 3,
      created_at: past30Days,
    },
    {
      id_venda: v2,
      id_cliente: c2,
      descricao_produtos: 'Perfume Live Fearlessly + Batom Líquido Matte Red',
      valor_total: 219.0,
      data_venda: past3Days,
      total_de_parcelas: 2,
      created_at: past3Days,
    },
    {
      id_venda: v3,
      id_cliente: c3,
      descricao_produtos: 'Kit Microdermoabrasão TimeWise',
      valor_total: 198.0,
      data_venda: today,
      total_de_parcelas: 2,
      created_at: today,
    },
    {
      id_venda: v4,
      id_cliente: c4,
      descricao_produtos: 'Delineador em Gel + Máscara Lash Intensity',
      valor_total: 120.0,
      data_venda: past30Days,
      total_de_parcelas: 1,
      created_at: past30Days,
    },
  ];

  const installments: Parcela[] = [
    {
      id_parcela: '33333333-3333-4333-8333-333333333101',
      id_venda: v1,
      numero_da_parcela: 1,
      valor_parcela: 116.63,
      data_vencimento: past30Days,
      status_pago: true,
      data_pagamento: past30Days,
      created_at: past30Days,
    },
    {
      id_parcela: '33333333-3333-4333-8333-333333333102',
      id_venda: v1,
      numero_da_parcela: 2,
      valor_parcela: 116.63,
      data_vencimento: today,
      status_pago: false,
      data_pagamento: null,
      created_at: past30Days,
    },
    {
      id_parcela: '33333333-3333-4333-8333-333333333103',
      id_venda: v1,
      numero_da_parcela: 3,
      valor_parcela: 116.64,
      data_vencimento: future30Days,
      status_pago: false,
      data_pagamento: null,
      created_at: past30Days,
    },
    {
      id_parcela: '33333333-3333-4333-8333-333333333201',
      id_venda: v2,
      numero_da_parcela: 1,
      valor_parcela: 109.5,
      data_vencimento: past3Days,
      status_pago: false,
      data_pagamento: null,
      created_at: past3Days,
    },
    {
      id_parcela: '33333333-3333-4333-8333-333333333202',
      id_venda: v2,
      numero_da_parcela: 2,
      valor_parcela: 109.5,
      data_vencimento: future15Days,
      status_pago: false,
      data_pagamento: null,
      created_at: past3Days,
    },
    {
      id_parcela: '33333333-3333-4333-8333-333333333301',
      id_venda: v3,
      numero_da_parcela: 1,
      valor_parcela: 99.0,
      data_vencimento: today,
      status_pago: false,
      data_pagamento: null,
      created_at: today,
    },
    {
      id_parcela: '33333333-3333-4333-8333-333333333302',
      id_venda: v3,
      numero_da_parcela: 2,
      valor_parcela: 99.0,
      data_vencimento: future30Days,
      status_pago: false,
      data_pagamento: null,
      created_at: today,
    },
    {
      id_parcela: '33333333-3333-4333-8333-333333333401',
      id_venda: v4,
      numero_da_parcela: 1,
      valor_parcela: 120.0,
      data_vencimento: past30Days,
      status_pago: true,
      data_pagamento: past30Days,
      created_at: past30Days,
    },
  ];

  return { clients, sales, installments };
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Falha ao salvar no localStorage:', err);
  }
}

export function initializeStore() {
  if (typeof window === 'undefined') return;
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  const existingClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);

  if (!initialized && existingClients === null) {
    const seed = getInitialSeedData();
    saveToStorage(STORAGE_KEYS.CLIENTS, seed.clients);
    saveToStorage(STORAGE_KEYS.SALES, seed.sales);
    saveToStorage(STORAGE_KEYS.INSTALLMENTS, seed.installments);
    saveToStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  } else if (!initialized) {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
}

export function getStoredClients(): Cliente[] {
  return loadFromStorage<Cliente[]>(STORAGE_KEYS.CLIENTS, []);
}

export function saveStoredClients(clients: Cliente[]) {
  saveToStorage(STORAGE_KEYS.CLIENTS, clients);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
}

export function getStoredSales(): Venda[] {
  return loadFromStorage<Venda[]>(STORAGE_KEYS.SALES, []);
}

export function saveStoredSales(sales: Venda[]) {
  saveToStorage(STORAGE_KEYS.SALES, sales);
}

export function getStoredInstallments(): Parcela[] {
  return loadFromStorage<Parcela[]>(STORAGE_KEYS.INSTALLMENTS, []);
}

export function saveStoredInstallments(installments: Parcela[]) {
  saveToStorage(STORAGE_KEYS.INSTALLMENTS, installments);
}

export function getStoredSettings(): ConsultantSettings {
  return loadFromStorage<ConsultantSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveStoredSettings(settings: ConsultantSettings) {
  saveToStorage(STORAGE_KEYS.SETTINGS, settings);
}

export function clearAllStoredData() {
  if (typeof window === 'undefined') return;
  saveToStorage(STORAGE_KEYS.CLIENTS, []);
  saveToStorage(STORAGE_KEYS.SALES, []);
  saveToStorage(STORAGE_KEYS.INSTALLMENTS, []);
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

export function getUnifiedCharges(): CobrancaComCliente[] {
  const clients = getStoredClients();
  const sales = getStoredSales();
  const installments = getStoredInstallments();

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
}
