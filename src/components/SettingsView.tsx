'use client';

import React, { useState } from 'react';
import { 
  RotateCcw, 
  Check, 
  CloudOff,
  LogOut,
  LogIn
} from 'lucide-react';
import { ConsultantSettings } from '@/lib/store';
import { User } from '@supabase/supabase-js';

interface SettingsViewProps {
  settings: ConsultantSettings;
  user: User | null;
  isDemoMode: boolean;
  onSaveSettings: (settings: ConsultantSettings) => void;
  onResetData: () => void;
  onSignOut: () => void;
  onOpenAuth: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  user,
  onSaveSettings,
  onResetData,
  onSignOut,
  onOpenAuth,
}) => {
  const [nome, setNome] = useState(settings.nome);
  const [chavePix, setChavePix] = useState(settings.chavePix);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      nome: nome.trim(),
      chavePix: chavePix.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* TÍTULO ESTILO AJUSTES DO IPHONE */}
      <div className="px-1">
        <h2 className="text-2xl font-bold tracking-tight text-[#1C1C1E]">
          Ajustes
        </h2>
        <p className="text-xs text-[#8E8E93]">
          Conta, dados de cobrança e sincronização
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-[18px] bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* SEÇÃO DA CONTA / NUVEM SUPABASE */}
      <div className="bg-white rounded-[22px] p-4 border border-[#E5E5EA]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
        <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
          Status da Conta
        </span>

        {user ? (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-[#1C1C1E]">Sincronizado na Nuvem</span>
              </div>
              <p className="text-xs text-[#8E8E93] truncate max-w-[200px]">
                {user.email}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja realmente sair da sua conta?')) {
                  onSignOut();
                }
              }}
              className="tap-target px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CloudOff className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-[#1C1C1E]">
                  Modo Demonstração (Local)
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Offline
              </span>
            </div>
            <p className="text-xs text-[#8E8E93]">
              Conecte sua conta para salvar suas clientes e vendas em segurança na nuvem do Supabase.
            </p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="tap-target w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar / Criar Conta</span>
            </button>
          </div>
        )}
      </div>

      {/* FORMULÁRIO ESTILO GROUPED TABLE DO IOS */}
      <form onSubmit={handleSave} className="space-y-3.5">
        <div className="bg-white rounded-[22px] p-4 border border-[#E5E5EA]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
              Seu Nome (como aparecerá na mensagem)
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Consultora Emanuela"
              className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] text-sm text-[#1C1C1E] focus:outline-none focus:bg-white border border-transparent focus:border-rose-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block mb-1">
              Chave Pix de Recebimento
            </label>
            <input
              type="text"
              value={chavePix}
              onChange={(e) => setChavePix(e.target.value)}
              placeholder="CPF, celular, e-mail ou aleatória"
              className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] text-sm text-[#1C1C1E] focus:outline-none focus:bg-white border border-transparent focus:border-rose-500"
              required
            />
            <span className="text-[11px] text-[#8E8E93] mt-1 block">
              Será enviada na mensagem do WhatsApp para a cliente pagar fácil.
            </span>
          </div>

          <button
            type="submit"
            className="tap-target w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs shadow-xs transition-transform"
          >
            Salvar Alterações
          </button>
        </div>
      </form>

      {/* EXEMPLO DA MENSAGEM DO WHATSAPP */}
      <div className="bg-white rounded-[22px] p-4 border border-[#E5E5EA]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-2">
        <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
          Como a cliente recebe no WhatsApp:
        </span>
        <div className="bg-[#E7F8E8] rounded-2xl p-3.5 border border-[#CDECCF] text-xs text-[#1C1C1E] space-y-1.5 leading-relaxed">
          <p>Olá, Mariana! Tudo bem? ✨</p>
          <p>
            Passando para lembrar da parcela <strong>1/3</strong> da sua comprinha Mary Kay (Kit TimeWise 3D), no valor de{' '}
            <strong>R$ 116,63</strong>, com vencimento para <strong>hoje</strong>.
          </p>
          <p className="bg-white/80 p-2 rounded-xl text-xs font-mono border border-emerald-200">
            🔑 <strong>Chave Pix:</strong> {chavePix || 'sua-chave-pix'}
          </p>
          <p>
            Assim que fizer o Pix, pode me mandar o comprovante por aqui. Muito obrigada pelo carinho! 💖
          </p>
          <p className="text-[#8E8E93] italic">_– {nome || 'Sua Consultora'}_</p>
        </div>
      </div>

      {/* DADOS DE DEMONSTRAÇÃO */}
      <div className="bg-white rounded-[22px] p-4 border border-[#E5E5EA]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-2">
        <span className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider block">
          Dados de Teste
        </span>
        <p className="text-xs text-[#8E8E93]">
          Deseja recarregar as clientes e vendas de exemplo originais no dispositivo?
        </p>
        <button
          onClick={() => {
            if (
              window.confirm(
                'Deseja restaurar as clientes de exemplo originais?'
              )
            ) {
              onResetData();
            }
          }}
          className="tap-target px-3.5 py-2.5 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] hover:bg-[#E5E5EA] text-xs font-semibold flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Exemplos</span>
        </button>
      </div>
    </div>
  );
};
