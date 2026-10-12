'use client';

import React, { useMemo } from 'react';
import { 
  MessageCircle, 
  Check, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  Plus,
  Users
} from 'lucide-react';
import { CobrancaComCliente } from '@/types/database';
import { ConsultantSettings } from '@/lib/store';
import { formatDateBR, normalizeDateISO } from '@/lib/date-utils';
import { generateWhatsAppChargeLink } from '@/lib/whatsapp';

interface DashboardViewProps {
  charges: CobrancaComCliente[];
  settings: ConsultantSettings;
  today: string;
  startOfMonth: string;
  endOfMonth: string;
  onMarkPaid: (id_parcela: string, newStatus: boolean) => void;
  onNavigateToTab: (tab: 'clients' | 'new-sale' | 'sales') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  charges,
  settings,
  today,
  startOfMonth,
  endOfMonth,
  onMarkPaid,
  onNavigateToTab,
}) => {
  const todayNorm = normalizeDateISO(today);

  // 1. Cobranças do Dia (RF06): vencimento == today e status_pago == false
  const cobrancasHoje = useMemo(() => {
    if (!todayNorm) return [];
    return charges.filter(
      (c) => normalizeDateISO(c.data_vencimento) === todayNorm && !c.status_pago
    );
  }, [charges, todayNorm]);

  // 2. Cobranças Atrasadas: vencimento estritamente anterior a hoje e pendente
  const cobrancasAtrasadas = useMemo(() => {
    if (!todayNorm) return [];
    return charges.filter(
      (c) => normalizeDateISO(c.data_vencimento) < todayNorm && !c.status_pago
    );
  }, [charges, todayNorm]);

  // 3. Métricas do Mês (RF05)
  const metricasMes = useMemo(() => {
    let totalAReceberMes = 0;
    let totalRecebidoMes = 0;
    const startNorm = normalizeDateISO(startOfMonth);
    const endNorm = normalizeDateISO(endOfMonth);

    charges.forEach((c) => {
      const vencNorm = normalizeDateISO(c.data_vencimento);
      if (vencNorm >= startNorm && vencNorm <= endNorm) {
        if (!c.status_pago) {
          totalAReceberMes += c.valor_parcela;
        }
      }
      if (c.status_pago) {
        const dataPag = normalizeDateISO(c.data_pagamento || c.data_vencimento);
        if (dataPag >= startNorm && dataPag <= endNorm) {
          totalRecebidoMes += c.valor_parcela;
        }
      }
    });

    return { totalAReceberMes, totalRecebidoMes };
  }, [charges, startOfMonth, endOfMonth]);

  const valorTotalHoje = useMemo(() => {
    return cobrancasHoje.reduce((acc, c) => acc + c.valor_parcela, 0);
  }, [cobrancasHoje]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6 pb-28">
      {/* CARTÃO RESUMO FINANCEIRO ESTILO APPLE CARTEIRA */}
      <section className="bg-white rounded-[24px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#E5E5EA]/80 space-y-4">
        <div>
          <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
            Previsão do Mês
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold text-[#1C1C1E] tracking-tight">
              {formatCurrency(metricasMes.totalAReceberMes)}
            </span>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
              a receber
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F2F2F7]">
          <div className="bg-[#F2F2F7]/70 rounded-[18px] p-3">
            <span className="text-[11px] text-[#8E8E93] font-medium block">
              ✓ Já Recebido
            </span>
            <p className="text-base font-bold text-emerald-600 mt-0.5">
              {formatCurrency(metricasMes.totalRecebidoMes)}
            </p>
          </div>

          <div className="bg-[#F2F2F7]/70 rounded-[18px] p-3">
            <span className="text-[11px] text-[#8E8E93] font-medium block">
              📅 Para Hoje
            </span>
            <p className="text-base font-bold text-rose-600 mt-0.5">
              {formatCurrency(valorTotalHoje)}
            </p>
          </div>
        </div>
      </section>

      {/* COBRANÇAS DE HOJE (O FOCO DA MÃE) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-bold text-[#1C1C1E] tracking-tight">
              Cobranças de Hoje
            </h2>
            <p className="text-xs text-[#8E8E93]">
              Envie a mensagem no WhatsApp com 1 toque
            </p>
          </div>
          {cobrancasHoje.length > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
              {cobrancasHoje.length} {cobrancasHoje.length === 1 ? 'cliente' : 'clientes'}
            </span>
          )}
        </div>

        {cobrancasHoje.length === 0 ? (
          <div className="bg-white rounded-[24px] p-7 text-center border border-[#E5E5EA]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <p className="text-sm font-bold text-[#1C1C1E]">
              Tudo em dia por hoje! 🎉
            </p>
            <p className="text-xs text-[#8E8E93] max-w-xs mx-auto">
              Nenhuma parcela vence hoje. Todas as suas cobranças estão organizadas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cobrancasHoje.map((item) => {
              const waLink = generateWhatsAppChargeLink({
                telefone: item.telefone_cliente,
                nomeCliente: item.nome_cliente,
                valorParcela: item.valor_parcela,
                numeroParcela: item.numero_da_parcela,
                totalParcelas: item.total_de_parcelas,
                dataVencimento: item.data_vencimento,
                descricaoProdutos: item.descricao_produtos,
                chavePix: settings.chavePix,
                nomeConsultora: settings.nome,
              });

              return (
                <div
                  key={item.id_parcela}
                  className="bg-white rounded-[22px] p-4 border border-[#E5E5EA]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-bold text-[#1C1C1E]">
                        {item.nome_cliente}
                      </h3>
                      <p className="text-xs text-[#8E8E93] line-clamp-1">
                        {item.descricao_produtos}
                      </p>
                      <span className="inline-block text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                        Parcela {item.numero_da_parcela} de {item.total_de_parcelas}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-lg font-extrabold text-[#1C1C1E] block">
                        {formatCurrency(item.valor_parcela)}
                      </span>
                      <span className="text-[11px] font-semibold text-rose-500">
                        Vence hoje
                      </span>
                    </div>
                  </div>

                  {/* AÇÕES LIMPAS ESTILO IPHONE */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F2F2F7]">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-target flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-xs font-bold shadow-xs transition-transform"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Cobrar no Whats</span>
                    </a>

                    <button
                      onClick={() => onMarkPaid(item.id_parcela, true)}
                      className="tap-target flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] active:scale-95 text-[#1C1C1E] text-xs font-semibold transition-transform"
                    >
                      <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                      <span>Já Pagou</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* COBRANÇAS EM ATRASO (SE HOUVER) */}
      {cobrancasAtrasadas.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-[#1C1C1E]">
              Atrasadas ({cobrancasAtrasadas.length})
            </h3>
            <span className="text-xs text-amber-600 font-medium">
              Vencidas antes de hoje
            </span>
          </div>

          <div className="space-y-2">
            {cobrancasAtrasadas.map((item) => {
              const waLink = generateWhatsAppChargeLink({
                telefone: item.telefone_cliente,
                nomeCliente: item.nome_cliente,
                valorParcela: item.valor_parcela,
                numeroParcela: item.numero_da_parcela,
                totalParcelas: item.total_de_parcelas,
                dataVencimento: item.data_vencimento,
                descricaoProdutos: item.descricao_produtos,
                chavePix: settings.chavePix,
                nomeConsultora: settings.nome,
              });

              return (
                <div
                  key={item.id_parcela}
                  className="bg-white rounded-[20px] p-3.5 border border-[#E5E5EA]/80 shadow-xs flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#1C1C1E]">
                      {item.nome_cliente}
                    </h4>
                    <p className="text-[11px] text-[#8E8E93]">
                      Venceu em {formatDateBR(item.data_vencimento)} • {formatCurrency(item.valor_parcela)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-target px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-[11px] font-bold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>Lembrar</span>
                    </a>
                    <button
                      onClick={() => onMarkPaid(item.id_parcela, true)}
                      className="tap-target px-2.5 py-1.5 rounded-lg bg-[#F2F2F7] text-[#1C1C1E] text-[11px] font-medium"
                    >
                      Pago
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ATALHOS RÁPIDOS LIMPOS */}
      <section className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => onNavigateToTab('new-sale')}
          className="tap-target p-4 rounded-[22px] bg-white border border-[#E5E5EA]/80 text-left shadow-xs hover:border-rose-200 active:scale-98 transition-all flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1C1C1E]">Nova Venda</h4>
            <p className="text-xs text-[#8E8E93]">Registrar produtos</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateToTab('clients')}
          className="tap-target p-4 rounded-[22px] bg-white border border-[#E5E5EA]/80 text-left shadow-xs hover:border-rose-200 active:scale-98 transition-all flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1C1C1E]">Minhas Clientes</h4>
            <p className="text-xs text-[#8E8E93]">Ver lista de contatos</p>
          </div>
        </button>
      </section>
    </div>
  );
};
