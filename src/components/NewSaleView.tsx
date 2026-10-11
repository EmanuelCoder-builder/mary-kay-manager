'use client';

import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Calendar, 
  Calculator, 
  Sparkles, 
  CheckCircle, 
  UserPlus, 
  Plus,
  ArrowRight
} from 'lucide-react';
import { Cliente } from '@/types/database';
import { getTodayRecife, formatDateBR } from '@/lib/date-utils';
import { calculateInstallments, CalculatedInstallment } from '@/lib/calculations';

interface NewSaleViewProps {
  clients: Cliente[];
  today: string;
  onAddSale: (
    id_cliente: string,
    descricao_produtos: string,
    valor_total: number,
    total_de_parcelas: number,
    data_venda: string,
    installments: CalculatedInstallment[]
  ) => void;
  onNavigateToClients: () => void;
  onSaleCreatedSuccess: () => void;
}

const POPULAR_MK_PRODUCTS = [
  'Kit TimeWise 3D',
  'Base Matte At Play',
  'Batom Líquido Matte',
  'Microdermoabrasão',
  'Perfume Live Fearlessly',
  'Máscara Lash Intensity',
  'Delineador em Gel',
  'Primer Facial FPS 15',
];

export const NewSaleView: React.FC<NewSaleViewProps> = ({
  clients,
  today,
  onAddSale,
  onNavigateToClients,
  onSaleCreatedSuccess,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clients[0]?.id_cliente || ''
  );
  const [descricao, setDescricao] = useState('');
  const [valorTotalStr, setValorTotalStr] = useState('');
  const [parcelasCount, setParcelasCount] = useState<number>(1);
  const [dataVenda, setDataVenda] = useState(today || '');
  const [formError, setFormError] = useState('');

  // Cálculo das parcelas em tempo real (RF04, RN01, RN02)
  const numericTotal = parseFloat(valorTotalStr.replace(',', '.')) || 0;

  const previewInstallments = useMemo(() => {
    if (numericTotal <= 0) return [];
    try {
      return calculateInstallments(numericTotal, parcelasCount, dataVenda);
    } catch {
      return [];
    }
  }, [numericTotal, parcelasCount, dataVenda]);

  const handleAddChip = (prod: string) => {
    if (!descricao) {
      setDescricao(prod);
    } else if (!descricao.includes(prod)) {
      setDescricao(`${descricao} + ${prod}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setFormError('Selecione uma cliente para registrar a venda.');
      return;
    }
    if (!descricao.trim()) {
      setFormError('Informe a descrição dos produtos vendidos.');
      return;
    }
    if (numericTotal <= 0) {
      setFormError('O valor total da venda deve ser maior que zero.');
      return;
    }

    onAddSale(
      selectedClientId,
      descricao.trim(),
      numericTotal,
      parcelasCount,
      dataVenda,
      previewInstallments
    );

    // Limpar formulário e dar feedback
    setDescricao('');
    setValorTotalStr('');
    setParcelasCount(1);
    setFormError('');
    onSaleCreatedSuccess();
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Título */}
      <div>
        <h2 className="text-xl font-serif font-bold text-zinc-950">
          Registrar Venda
        </h2>
        <p className="text-xs text-zinc-500">
          Geração automática de parcelas com intervalo de 30 dias (ou à vista).
        </p>
      </div>

      {formError && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. SELEÇÃO DA CLIENTE */}
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-800">
              Cliente Compradora
            </label>
            <button
              type="button"
              onClick={onNavigateToClients}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
            >
              <UserPlus className="w-3 h-3" />
              <span>Cadastrar nova</span>
            </button>
          </div>

          {clients.length === 0 ? (
            <div className="text-xs text-zinc-500 py-2">
              Nenhuma cliente cadastrada.{' '}
              <button
                type="button"
                onClick={onNavigateToClients}
                className="text-rose-600 font-semibold underline"
              >
                Cadastrar agora
              </button>
            </div>
          ) : (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50/50 focus:outline-none focus:border-rose-500 focus:bg-white"
              required
            >
              {clients.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.nome} ({c.telefone})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 2. DESCRIÇÃO DOS PRODUTOS & SUGESTÕES */}
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-2xs space-y-3">
          <label className="text-xs font-semibold text-zinc-800 block">
            Descrição dos Produtos
          </label>

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: 1x Kit TimeWise 3D + 2x Batom Líquido Matte"
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
            required
          />

          {/* Chips de Produtos Frequentes da Mary Kay */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1.5">
              Sugestões Rápidas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_MK_PRODUCTS.map((prod) => (
                <button
                  key={prod}
                  type="button"
                  onClick={() => handleAddChip(prod)}
                  className="tap-target px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-medium border border-rose-200/60 transition-colors"
                >
                  + {prod}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. VALOR, DATA E NÚMERO DE PARCELAS */}
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-2xs space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-800 block mb-1">
                Valor Total (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorTotalStr}
                  onChange={(e) => setValorTotalStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-900 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-800 block mb-1">
                Data da Venda
              </label>
              <input
                type="date"
                value={dataVenda}
                onChange={(e) => setDataVenda(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-rose-500"
                required
              />
            </div>
          </div>

          {/* Seletor de Parcelamento */}
          <div>
            <label className="text-xs font-semibold text-zinc-800 block mb-1.5">
              Condição de Pagamento (RN01 & RN02)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 10, 12].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setParcelasCount(num)}
                  className={`tap-target py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                    parcelasCount === num
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-rose-50 hover:border-rose-200'
                  }`}
                >
                  {num === 1 ? 'À vista' : `${num}x`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. PRÉ-VISUALIZAÇÃO DAS PARCELAS GERADAS */}
        {previewInstallments.length > 0 && (
          <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-rose-600" />
                Cronograma de Vencimentos
              </span>
              <span className="text-[11px] text-rose-700 font-medium">
                {parcelasCount === 1 ? 'Pagamento imediato' : `Intervalo de 30 dias`}
              </span>
            </div>

            <div className="space-y-1.5">
              {previewInstallments.map((p) => (
                <div
                  key={p.numero_da_parcela}
                  className="bg-white rounded-xl p-2.5 border border-rose-100 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-zinc-800">
                    Parcela {p.numero_da_parcela}/{parcelasCount}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-500">
                      Vence em {formatDateBR(p.data_vencimento)}
                    </span>
                    <span className="font-bold text-zinc-950 font-serif">
                      {p.valor_parcela.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTÃO SALVAR VENDA */}
        <button
          type="submit"
          className="tap-target w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Confirmar Venda e Gerar Parcelas</span>
        </button>
      </form>
    </div>
  );
};
