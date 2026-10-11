'use client';

import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  MessageCircle, 
  Calendar, 
  Clock, 
  DollarSign, 
  ArrowUpRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { CobrancaComCliente } from '@/types/database';
import { ConsultantSettings } from '@/lib/store';
import { getTodayRecife, getCurrentMonthRangeRecife, formatDateBR } from '@/lib/date-utils';
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

  // 1. Cobranças do Dia (RF06): data_vencimento == today E status_pago == false
  const cobrancasHoje = useMemo(() => {
    return charges.filter(
      (c) => c.data_vencimento === today && !c.status_pago
    );
  }, [charges, today]);

  // 2. Cobranças Atrasadas: data_vencimento < today E status_pago == false
  const cobrancasAtrasadas = useMemo(() => {
    return charges.filter(
      (c) => c.data_vencimento < today && !c.status_pago
    );
  }, [charges, today]);

  // 3. Métricas Financeiras do Mês Corrente (RF05)
  const metricasMes = useMemo(() => {
    let totalAReceberMes = 0;
    let totalRecebidoMes = 0;

    charges.forEach((c) => {
      // Vencimentos neste mês
      if (c.data_vencimento >= startOfMonth && c.data_vencimento <= endOfMonth) {
        if (!c.status_pago) {
          totalAReceberMes += c.valor_parcela;
        }
      }
      // Pagamentos recebidos neste mês
      if (c.status_pago) {
        const dataPag = c.data_pagamento || c.data_vencimento;
        if (dataPag >= startOfMonth && dataPag <= endOfMonth) {
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
    <div className="space-y-6 pb-24">
      {/* Banner / Card de Destaque Financeiro (RF05) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-rose-950 text-white p-5 shadow-xl border border-rose-950/40">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-rose-600/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-medium tracking-widest text-rose-300">
              Previsão do Mês
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/30 font-medium">
              Fuso Recife (PE)
            </span>
          </div>

          <div>
            <p className="text-xs text-zinc-400 font-normal">Total a Receber este Mês</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-extrabold tracking-tight text-white font-serif">
                {formatCurrency(metricasMes.totalAReceberMes)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/80">
            <div className="bg-zinc-800/40 backdrop-blur-xs rounded-2xl p-3 border border-zinc-700/30">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Já Recebido
              </span>
              <p className="text-sm font-bold text-emerald-400 mt-1">
                {formatCurrency(metricasMes.totalRecebidoMes)}
              </p>
            </div>

            <div className="bg-zinc-800/40 backdrop-blur-xs rounded-2xl p-3 border border-zinc-700/30">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-rose-400" /> A Cobrar Hoje
              </span>
              <p className="text-sm font-bold text-rose-300 mt-1">
                {formatCurrency(valorTotalHoje)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HUB DE COBRANÇAS DO DIA (RF06 & RF07) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
            <h2 className="text-base font-serif font-bold text-zinc-900 tracking-tight">
              Hub de Cobranças de Hoje
            </h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
            {cobrancasHoje.length} {cobrancasHoje.length === 1 ? 'pendência' : 'pendências'}
          </span>
        </div>

        {cobrancasHoje.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center border border-rose-100 shadow-xs space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800">
                Tudo em dia para hoje! ✨
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Nenhuma parcela vencendo hoje aguarda cobrança. Excelente gestão!
              </p>
            </div>
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
                  className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-sm hover:shadow-md transition-shadow space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">
                        {item.nome_cliente}
                      </h3>
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                        {item.descricao_produtos}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        Parcela {item.numero_da_parcela}/{item.total_de_parcelas}
                      </span>
                      <p className="text-base font-extrabold text-zinc-950 font-serif mt-1">
                        {formatCurrency(item.valor_parcela)}
                      </p>
                    </div>
                  </div>

                  {/* Ações Rápidas: Disparo WhatsApp (RF07) e Marcar Pago (RF08) */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-50">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-target flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs active:scale-98 transition-all"
                    >
                      <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                      <span>Cobrar no Whats</span>
                    </a>

                    <button
                      onClick={() => onMarkPaid(item.id_parcela, true)}
                      className="tap-target flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold active:scale-98 transition-all"
                    >
                      <Check className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>Marcar Pago</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* COBRANÇAS EM ATRASO (Vencidas anteriormente) */}
      {cobrancasAtrasadas.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-serif font-bold text-zinc-900 tracking-tight">
                Parcelas em Atraso ({cobrancasAtrasadas.length})
              </h2>
            </div>
            <span className="text-xs text-amber-600 font-semibold">
              Requer atenção
            </span>
          </div>

          <div className="space-y-2.5">
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
                  className="bg-amber-50/40 rounded-2xl p-3.5 border border-amber-200/80 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-900">
                        {item.nome_cliente}
                      </h3>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Venceu em {formatDateBR(item.data_vencimento)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-zinc-950 font-serif">
                        {formatCurrency(item.valor_parcela)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-target flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>Relembrar no WhatsApp</span>
                    </a>
                    <button
                      onClick={() => onMarkPaid(item.id_parcela, true)}
                      className="tap-target px-3 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50"
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

      {/* AÇÕES RÁPIDAS DE ACESSO */}
      <section className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => onNavigateToTab('new-sale')}
          className="tap-target p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white text-left shadow-sm active:scale-98 transition-transform"
        >
          <span className="text-xs uppercase font-medium tracking-wider text-rose-100">
            Nova Venda
          </span>
          <p className="text-sm font-bold mt-1">Registrar Compra</p>
          <span className="text-[11px] text-rose-100/90 block mt-0.5">
            Cálculo de parcelas 30d
          </span>
        </button>

        <button
          onClick={() => onNavigateToTab('clients')}
          className="tap-target p-4 rounded-2xl bg-white border border-rose-100 text-left shadow-2xs hover:border-rose-300 active:scale-98 transition-all"
        >
          <span className="text-xs uppercase font-medium tracking-wider text-rose-600">
            Clientes
          </span>
          <p className="text-sm font-bold text-zinc-900 mt-1">Gerenciar Base</p>
          <span className="text-[11px] text-zinc-500 block mt-0.5">
            Cadastrar ou editar
          </span>
        </button>
      </section>
    </div>
  );
};
