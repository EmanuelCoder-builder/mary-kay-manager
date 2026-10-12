'use client';

import React, { useState, useMemo } from 'react';
import { 
  ReceiptText, 
  Check, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  Trash2,
  Edit2,
  X,
  Calendar,
  Save,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Venda, Parcela, Cliente } from '@/types/database';
import { formatDateBR, normalizeDateISO } from '@/lib/date-utils';
import { generateWhatsAppChargeLink } from '@/lib/whatsapp';
import { ConsultantSettings } from '@/lib/store';

interface SalesViewProps {
  sales: Venda[];
  installments: Parcela[];
  clients: Cliente[];
  settings: ConsultantSettings;
  onMarkPaid: (id_parcela: string, newStatus: boolean) => void;
  onDeleteSale: (id_venda: string) => void;
  onUpdateSale: (updatedSale: Venda, updatedInstallments: Parcela[]) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  sales,
  installments,
  clients,
  settings,
  onMarkPaid,
  onDeleteSale,
  onUpdateSale,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  // Estados do Modal de Edição da Venda
  const [editingSale, setEditingSale] = useState<Venda | null>(null);
  const [editClientId, setEditClientId] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editDataVenda, setEditDataVenda] = useState('');
  const [editValorTotalStr, setEditValorTotalStr] = useState('');
  const [editInstallments, setEditInstallments] = useState<Parcela[]>([]);
  const [editError, setEditError] = useState('');

  const clientMap = useMemo(() => {
    const map = new Map<string, Cliente>();
    clients.forEach((c) => map.set(c.id_cliente, c));
    return map;
  }, [clients]);

  const installmentsBySale = useMemo(() => {
    const map = new Map<string, Parcela[]>();
    installments.forEach((p) => {
      const list = map.get(p.id_venda) || [];
      list.push(p);
      map.set(p.id_venda, list);
    });
    return map;
  }, [installments]);

  const filteredSales = useMemo(() => {
    if (filter === 'all') return sales;

    return sales.filter((sale) => {
      const list = installmentsBySale.get(sale.id_venda) || [];
      const hasPending = list.some((p) => !p.status_pago);
      if (filter === 'pending') return hasPending;
      if (filter === 'paid') return !hasPending && list.length > 0;
      return true;
    });
  }, [sales, filter, installmentsBySale]);

  const toggleExpand = (id_venda: string) => {
    setExpandedSaleId((prev) => (prev === id_venda ? null : id_venda));
  };

  const handleOpenEditModal = (sale: Venda) => {
    const saleInsts = (installmentsBySale.get(sale.id_venda) || [])
      .map((p) => ({ ...p }))
      .sort((a, b) => a.numero_da_parcela - b.numero_da_parcela);

    setEditingSale(sale);
    setEditClientId(sale.id_cliente);
    setEditDescricao(sale.descricao_produtos);
    setEditDataVenda(normalizeDateISO(sale.data_venda));
    setEditValorTotalStr(String(sale.valor_total));
    setEditInstallments(saleInsts);
    setEditError('');
  };

  const handleUpdateInstallmentDate = (index: number, newDate: string) => {
    setEditInstallments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], data_vencimento: normalizeDateISO(newDate) };
      return copy;
    });
  };

  const handleUpdateInstallmentValue = (index: number, newVal: string) => {
    const numeric = parseFloat(newVal.replace(',', '.')) || 0;
    setEditInstallments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], valor_parcela: numeric };
      return copy;
    });
  };

  const handleToggleInstallmentPaid = (index: number) => {
    setEditInstallments((prev) => {
      const copy = [...prev];
      const current = copy[index].status_pago;
      copy[index] = {
        ...copy[index],
        status_pago: !current,
        data_pagamento: !current ? normalizeDateISO(editDataVenda) : null,
      };
      return copy;
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    if (!editClientId) {
      setEditError('Selecione uma cliente.');
      return;
    }
    if (!editDescricao.trim()) {
      setEditError('Informe os produtos vendidos.');
      return;
    }
    const numTotal = parseFloat(editValorTotalStr.replace(',', '.')) || 0;
    if (numTotal <= 0) {
      setEditError('O valor total deve ser maior que zero.');
      return;
    }

    const updatedSale: Venda = {
      ...editingSale,
      id_cliente: editClientId,
      descricao_produtos: editDescricao.trim(),
      data_venda: normalizeDateISO(editDataVenda),
      valor_total: numTotal,
    };

    onUpdateSale(updatedSale, editInstallments);
    setEditingSale(null);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-4 pb-28">
      {/* TÍTULO */}
      <div className="px-1">
        <h2 className="text-2xl font-bold tracking-tight text-[#1C1C1E]">
          Extrato
        </h2>
        <p className="text-xs text-[#8E8E93]">
          Histórico de compras e pagamentos
        </p>
      </div>

      {/* SEGMENTED CONTROL ESTILO IOS */}
      <div className="flex rounded-xl bg-[#E5E5EA]/70 p-1 text-xs font-semibold">
        <button
          onClick={() => setFilter('all')}
          className={`tap-target flex-1 py-1.5 rounded-lg transition-all ${
            filter === 'all'
              ? 'bg-white text-[#1C1C1E] shadow-xs'
              : 'text-[#8E8E93]'
          }`}
        >
          Todas ({sales.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`tap-target flex-1 py-1.5 rounded-lg transition-all ${
            filter === 'pending'
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-[#8E8E93]'
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`tap-target flex-1 py-1.5 rounded-lg transition-all ${
            filter === 'paid'
              ? 'bg-white text-emerald-600 shadow-xs'
              : 'text-[#8E8E93]'
          }`}
        >
          Quitadas
        </button>
      </div>

      {/* LISTA DE VENDAS */}
      {filteredSales.length === 0 ? (
        <div className="bg-white rounded-[24px] p-8 text-center border border-[#E5E5EA]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-2">
          <ReceiptText className="w-10 h-10 mx-auto text-[#8E8E93] stroke-[1.8]" />
          <p className="text-sm font-bold text-[#1C1C1E]">
            Nenhuma venda neste filtro.
          </p>
          <p className="text-xs text-[#8E8E93]">
            Alterne o filtro ou registre novas vendas.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSales.map((sale) => {
            const client = clientMap.get(sale.id_cliente);
            const saleInstallments = (
              installmentsBySale.get(sale.id_venda) || []
            ).sort((a, b) => a.numero_da_parcela - b.numero_da_parcela);
            const isExpanded = expandedSaleId === sale.id_venda;

            const paidCount = saleInstallments.filter((p) => p.status_pago).length;
            const isAllPaid = paidCount === saleInstallments.length && saleInstallments.length > 0;

            return (
              <div
                key={sale.id_venda}
                className="bg-white rounded-[22px] border border-[#E5E5EA]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden transition-all"
              >
                {/* CABEÇALHO DO ITEM */}
                <div
                  onClick={() => toggleExpand(sale.id_venda)}
                  className="p-4 cursor-pointer hover:bg-[#F2F2F7]/50 flex items-start justify-between gap-3 select-none"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#1C1C1E]">
                        {client?.nome || 'Cliente não identificada'}
                      </span>
                      {isAllPaid ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          Quitada
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                          {paidCount} de {sale.total_de_parcelas} pagas
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8E8E93] line-clamp-1">
                      {sale.descricao_produtos}
                    </p>
                    <span className="text-[11px] text-[#8E8E93] block">
                      {formatDateBR(sale.data_venda)} • {sale.total_de_parcelas}x
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-extrabold text-[#1C1C1E]">
                      {formatCurrency(sale.valor_total)}
                    </span>
                    <div className="mt-1 flex items-center justify-end text-[#8E8E93]">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-rose-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* PARCELAS QUANDO EXPANDIDO */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 bg-[#F2F2F7]/50 border-t border-[#E5E5EA]/60 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                      <span>Parcelas</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(sale);
                          }}
                          className="text-rose-600 hover:text-rose-700 flex items-center gap-1 normal-case font-semibold"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar Venda</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                'Deseja excluir esta venda e todas as parcelas?'
                              )
                            ) {
                              onDeleteSale(sale.id_venda);
                            }
                          }}
                          className="text-[#8E8E93] hover:text-rose-600 flex items-center gap-1 normal-case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Apagar</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {saleInstallments.map((p) => {
                        const waLink = client
                          ? generateWhatsAppChargeLink({
                              telefone: client.telefone,
                              nomeCliente: client.nome,
                              valorParcela: p.valor_parcela,
                              numeroParcela: p.numero_da_parcela,
                              totalParcelas: sale.total_de_parcelas,
                              dataVencimento: p.data_vencimento,
                              descricaoProdutos: sale.descricao_produtos,
                              chavePix: settings.chavePix,
                              nomeConsultora: settings.nome,
                            })
                          : '#';

                        return (
                          <div
                            key={p.id_parcela}
                            className="bg-white rounded-xl p-3 flex items-center justify-between gap-2 border border-[#E5E5EA]/60 shadow-2xs"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-[#1C1C1E]">
                                  Parcela {p.numero_da_parcela}
                                </span>
                                {p.status_pago ? (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                                    Pago
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-md">
                                    Pendente
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#8E8E93]">
                                Venc: {formatDateBR(p.data_vencimento)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#1C1C1E]">
                                {formatCurrency(p.valor_parcela)}
                              </span>

                              {!p.status_pago && client && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="tap-target p-1.5 rounded-lg bg-[#25D366] text-white"
                                  title="Cobrar no WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                                </a>
                              )}

                              <button
                                onClick={() => onMarkPaid(p.id_parcela, !p.status_pago)}
                                className={`tap-target px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                  p.status_pago
                                    ? 'bg-[#F2F2F7] text-[#8E8E93]'
                                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}
                              >
                                {p.status_pago ? 'Desmarcar' : 'Dar Baixa'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL SHEET ESTILO IOS PARA EDITAR VENDA COMPLETA */}
      {editingSale && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[28px] p-6 shadow-2xl space-y-4 border border-[#E5E5EA] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2F2F7]">
              <div>
                <h3 className="text-base font-bold text-[#1C1C1E]">
                  Editar Venda
                </h3>
                <p className="text-xs text-[#8E8E93]">
                  Ajuste os dados ou as datas de vencimento
                </p>
              </div>
              <button
                onClick={() => setEditingSale(null)}
                className="tap-target w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-700">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-1">
                  Cliente
                </label>
                <select
                  value={editClientId}
                  onChange={(e) => setEditClientId(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-[#F2F2F7] text-sm font-semibold text-[#1C1C1E] focus:outline-none focus:bg-white border border-transparent focus:border-rose-500"
                  required
                >
                  {clients.map((c) => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.nome} ({c.telefone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-1">
                  Produtos
                </label>
                <input
                  type="text"
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] text-sm text-[#1C1C1E] focus:outline-none focus:bg-white border border-transparent focus:border-rose-500"
                  required
                />
              </div>

              {/* Valor Total e Data da Venda */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-1">
                    Valor Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editValorTotalStr}
                    onChange={(e) => setEditValorTotalStr(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] text-sm font-bold text-[#1C1C1E] focus:outline-none focus:bg-white border border-transparent focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-1">
                    Data da Venda
                  </label>
                  <input
                    type="date"
                    value={editDataVenda}
                    onChange={(e) => setEditDataVenda(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-[#F2F2F7] text-xs font-semibold text-[#1C1C1E] focus:outline-none focus:bg-white border border-transparent focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              {/* Edição Detalhada das Parcelas */}
              <div className="space-y-2 pt-2 border-t border-[#F2F2F7]">
                <label className="block text-xs font-bold text-[#1C1C1E] uppercase tracking-wider">
                  Datas e Valores das Parcelas
                </label>
                <div className="space-y-2">
                  {editInstallments.map((p, idx) => (
                    <div
                      key={p.id_parcela}
                      className="bg-[#F2F2F7]/70 rounded-xl p-3 border border-[#E5E5EA]/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1C1C1E]">
                          Parcela {p.numero_da_parcela}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleInstallmentPaid(idx)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            p.status_pago
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.status_pago ? '✓ Paga' : '⏳ Pendente'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-[#8E8E93] block mb-0.5">
                            Data de Vencimento:
                          </span>
                          <input
                            type="date"
                            value={normalizeDateISO(p.data_vencimento)}
                            onChange={(e) =>
                              handleUpdateInstallmentDate(idx, e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#D1D1D6] text-xs font-semibold text-[#1C1C1E] focus:outline-none focus:border-rose-500"
                            required
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-[#8E8E93] block mb-0.5">
                            Valor (R$):
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={p.valor_parcela}
                            onChange={(e) =>
                              handleUpdateInstallmentValue(idx, e.target.value)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#D1D1D6] text-xs font-semibold text-[#1C1C1E] focus:outline-none focus:border-rose-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 pt-3 border-t border-[#F2F2F7]">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="tap-target flex-1 py-3 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] text-xs font-semibold hover:bg-[#E5E5EA]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="tap-target flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-transform flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
