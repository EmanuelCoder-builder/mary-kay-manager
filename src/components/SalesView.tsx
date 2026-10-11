'use client';

import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  Trash2,
  Calendar
} from 'lucide-react';
import { Venda, Parcela, Cliente } from '@/types/database';
import { formatDateBR } from '@/lib/date-utils';
import { generateWhatsAppChargeLink } from '@/lib/whatsapp';
import { ConsultantSettings } from '@/lib/store';

interface SalesViewProps {
  sales: Venda[];
  installments: Parcela[];
  clients: Cliente[];
  settings: ConsultantSettings;
  onMarkPaid: (id_parcela: string, newStatus: boolean) => void;
  onDeleteSale: (id_venda: string) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  sales,
  installments,
  clients,
  settings,
  onMarkPaid,
  onDeleteSale,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

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

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-950">
            Extrato de Vendas
          </h2>
          <p className="text-xs text-zinc-500">
            Histórico completo de compras e parcelas
          </p>
        </div>
      </div>

      {/* Filtros em Abas */}
      <div className="flex rounded-xl bg-zinc-100 p-1 text-xs font-semibold">
        <button
          onClick={() => setFilter('all')}
          className={`tap-target flex-1 py-1.5 rounded-lg transition-all ${
            filter === 'all'
              ? 'bg-white text-zinc-950 shadow-2xs'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Todas ({sales.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`tap-target flex-1 py-1.5 rounded-lg transition-all ${
            filter === 'pending'
              ? 'bg-white text-rose-600 shadow-2xs'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`tap-target flex-1 py-1.5 rounded-lg transition-all ${
            filter === 'paid'
              ? 'bg-white text-emerald-600 shadow-2xs'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Quitadas
        </button>
      </div>

      {/* Lista de Vendas */}
      {filteredSales.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-rose-100 shadow-2xs space-y-2">
          <Receipt className="w-10 h-10 mx-auto text-zinc-300" />
          <p className="text-sm font-semibold text-zinc-800">
            Nenhuma venda neste filtro.
          </p>
          <p className="text-xs text-zinc-500">
            Alterne o filtro ou registre novas vendas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
                className="bg-white rounded-2xl border border-rose-100/90 shadow-2xs overflow-hidden transition-all"
              >
                {/* Cabeçalho do Card da Venda */}
                <div
                  onClick={() => toggleExpand(sale.id_venda)}
                  className="p-4 cursor-pointer hover:bg-rose-50/20 flex items-start justify-between gap-3 select-none"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-900">
                        {client?.nome || 'Cliente não encontrada'}
                      </span>
                      {isAllPaid ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Quitada
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                          {paidCount}/{sale.total_de_parcelas} pagas
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 line-clamp-1">
                      {sale.descricao_produtos}
                    </p>
                    <span className="text-[11px] text-zinc-400 block">
                      Venda em {formatDateBR(sale.data_venda)} • {sale.total_de_parcelas}x
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-zinc-950 font-serif">
                      {formatCurrency(sale.valor_total)}
                    </span>
                    <div className="mt-1 flex items-center justify-end text-zinc-400">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-rose-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Detalhamento das Parcelas (quando expandido) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 bg-rose-50/30 border-t border-rose-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <span>Parcelas</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              'Deseja excluir esta venda e todas as suas parcelas?'
                            )
                          ) {
                            onDeleteSale(sale.id_venda);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-700 flex items-center gap-1 normal-case"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Excluir Venda</span>
                      </button>
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
                            className="bg-white rounded-xl p-2.5 border border-rose-100 flex items-center justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-zinc-800">
                                  Parcela {p.numero_da_parcela}
                                </span>
                                {p.status_pago ? (
                                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" /> Pago
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" /> Pendente
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-500">
                                Venc: {formatDateBR(p.data_vencimento)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-900 font-serif">
                                {formatCurrency(p.valor_parcela)}
                              </span>

                              {!p.status_pago && client && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="tap-target p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  title="Cobrar via WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 fill-emerald-600" />
                                </a>
                              )}

                              <button
                                onClick={() => onMarkPaid(p.id_parcela, !p.status_pago)}
                                className={`tap-target px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  p.status_pago
                                    ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
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
    </div>
  );
};
