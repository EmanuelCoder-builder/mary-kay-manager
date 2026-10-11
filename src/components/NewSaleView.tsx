'use client';

import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Calendar, 
  Calculator, 
  UserPlus, 
  Check
} from 'lucide-react';
import { Cliente } from '@/types/database';
import { formatDateBR } from '@/lib/date-utils';
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
  'Máscara de Cílios',
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

  // Cálculo das parcelas em tempo real
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
      setFormError('Selecione uma cliente.');
      return;
    }
    if (!descricao.trim()) {
      setFormError('Informe o que a cliente comprou.');
      return;
    }
    if (numericTotal <= 0) {
      setFormError('Digite o valor total da venda.');
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

    setDescricao('');
    setValorTotalStr('');
    setParcelasCount(1);
    setFormError('');
    onSaleCreatedSuccess();
  };

  return (
    <div className="space-y-4 pb-28">
      {/* TÍTULO ESTILO IOS */}
      <div className="px-1">
        <h2 className="text-2xl font-bold tracking-tight text-[#1C1C1E]">
          Nova Venda
        </h2>
        <p className="text-xs text-[#8E8E93]">
          As parcelas serão calculadas e agendadas a cada 30 dias.
        </p>
      </div>

      {formError && (
        <div className="p-3.5 rounded-[18px] bg-rose-50 border border-rose-100 text-xs text-rose-700">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* 1. SELEÇÃO DA CLIENTE */}
        <div className="bg-white rounded-[22px] p-4 border border-[#E5E5EA]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
              Cliente
            </label>
            <button
              type="button"
              onClick={onNavigateToClients}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Cadastrar nova</span>
            </button>
          </div>

          {clients.length === 0 ? (
            <div className="text-xs text-[#8E8E93] py-2">
              Nenhuma cliente cadastrada ainda.{' '}
              <button
                type="button"
                onClick={onNavigateToClients}
                className="text-rose-600 font-bold underline"
              >
                Cadastrar agora
              </button>
            </div>
          ) : (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-[#F2F2F7] text-sm font-semibold text-[#1C1C1E] focus:outline-none focus:bg-white border border-transparent focus:border-rose-500"
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

        {/* 2. PRODUTOS & SUGESTÕES RÁPIDAS */}
        <div className="bg-white rounded-[22px] p-4 border border-[#E5E5EA]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
          <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
            Produtos Vendidos
          </label>

          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Kit TimeWise 3D + Batom Matte"
            className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] text-sm text-[#1C1C1E] focus:outline-none focus:bg-white border border-transparent focus:border-rose-500"
            required
          />

          <div>
            <span className="text-[11px] text-[#8E8E93] block mb-1.5 font-medium">
              Toque rápido para adicionar:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_MK_PRODUCTS.map((prod) => (
                <button
                  key={prod}
                  type="button"
                  onClick={() => handleAddChip(prod)}
                  className="tap-target px-3 py-1.5 rounded-full bg-[#F2F2F7] hover:bg-rose-50 active:scale-95 text-[#1C1C1E] text-xs font-medium border border-[#E5E5EA] transition-all"
                >
                  + {prod}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. VALOR TOTAL E DATA */}
        <div className="bg-white rounded-[22px] p-4 border border-[#E5E5EA]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
                Valor Total (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8E8E93]">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorTotalStr}
                  onChange={(e) => setValorTotalStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#F2F2F7] text-base font-bold text-[#1C1C1E] focus:outline-none focus:bg-white border border-transparent focus:border-rose-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
                Data da Compra
              </label>
              <input
                type="date"
                value={dataVenda}
                onChange={(e) => setDataVenda(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-[#F2F2F7] text-xs font-semibold text-[#1C1C1E] focus:outline-none focus:bg-white border border-transparent focus:border-rose-500"
                required
              />
            </div>
          </div>

          {/* CONDIÇÃO DE PARCELAMENTO ESTILO SEGMENTED CONTROL */}
          <div>
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1.5">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 10, 12].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setParcelasCount(num)}
                  className={`tap-target py-2.5 rounded-xl text-xs font-bold transition-all ${
                    parcelasCount === num
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E5E5EA]'
                  }`}
                >
                  {num === 1 ? 'À vista' : `${num}x`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. CRONOGRAMA DAS PARCELAS */}
        {previewInstallments.length > 0 && (
          <div className="bg-white rounded-[22px] p-4 border border-[#E5E5EA]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-2">
            <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
              Vencimentos Programados
            </span>

            <div className="space-y-1.5">
              {previewInstallments.map((p) => (
                <div
                  key={p.numero_da_parcela}
                  className="bg-[#F2F2F7]/60 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-[#1C1C1E]">
                    Parcela {p.numero_da_parcela} de {parcelasCount}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#8E8E93]">
                      {formatDateBR(p.data_vencimento)}
                    </span>
                    <span className="font-bold text-[#1C1C1E]">
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

        {/* BOTÃO CONCLUIR */}
        <button
          type="submit"
          className="tap-target w-full py-4 rounded-[18px] bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          <span>Salvar Venda</span>
        </button>
      </form>
    </div>
  );
};
