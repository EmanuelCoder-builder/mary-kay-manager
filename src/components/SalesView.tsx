'use client';

import React, { useState, useMemo } from 'react';
import { 
  ReceiptText, 
  Check, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  Trash2
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
                        className="text-rose-600 hover:text-rose-700 flex items-center gap-1 normal-case"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Apagar Venda</span>
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
    </div>
  );
};
