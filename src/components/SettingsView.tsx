'use client';

import React, { useState } from 'react';
import { 
  Key, 
  User, 
  RotateCcw, 
  Database, 
  Save, 
  Check, 
  Sparkles,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { ConsultantSettings } from '@/lib/store';

interface SettingsViewProps {
  settings: ConsultantSettings;
  onSaveSettings: (settings: ConsultantSettings) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetData,
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
    <div className="space-y-5 pb-24">
      {/* Título */}
      <div>
        <h2 className="text-xl font-serif font-bold text-zinc-950">
          Configurações da Consultora
        </h2>
        <p className="text-xs text-zinc-500">
          Personalize seus dados comerciais e chave Pix para os disparos via WhatsApp.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {/* FORMULÁRIO DE DADOS */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-2xs space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-rose-600" />
              Nome da Consultora (para mensagens)
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Consultora Emanuela"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-rose-500"
              required
            />
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Será inserido na assinatura da mensagem do WhatsApp.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5 mb-1">
              <Key className="w-3.5 h-3.5 text-rose-600" />
              Chave Pix de Recebimento
            </label>
            <input
              type="text"
              value={chavePix}
              onChange={(e) => setChavePix(e.target.value)}
              placeholder="Ex: seu-email@gmail.com, CPF ou telefone"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-rose-500 font-mono"
              required
            />
            <span className="text-[11px] text-zinc-400 mt-1 block">
              A chave Pix que suas clientes usarão para pagar as parcelas em 1 clique.
            </span>
          </div>

          <button
            type="submit"
            className="tap-target w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Dados</span>
          </button>
        </div>
      </form>

      {/* PRÉ-VISUALIZAÇÃO DA MENSAGEM DO WHATSAPP */}
      <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200/80 space-y-2">
        <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
          <MessageCircle className="w-4 h-4 fill-emerald-600 text-white" />
          <span>Exemplo da Mensagem de Cobrança (WhatsApp)</span>
        </div>
        <div className="bg-white rounded-xl p-3 border border-emerald-100 text-[11px] text-zinc-700 space-y-1 font-sans">
          <p>Olá, Mariana! Tudo bem? ✨</p>
          <p>
            Passando para lembrar da parcela <strong>1/3</strong> da sua comprinha Mary Kay (Kit TimeWise 3D), no valor de{' '}
            <strong>R$ 116,63</strong>, com vencimento para <strong>hoje</strong>.
          </p>
          <p className="font-mono bg-zinc-50 p-1 rounded border border-zinc-200 text-zinc-800">
            🔑 <strong>Chave Pix:</strong> {chavePix || 'sua-chave-pix'}
          </p>
          <p>
            Assim que realizar o pagamento, você pode me enviar o comprovante por aqui. Muito obrigada pelo carinho! 💖
          </p>
          <p className="text-zinc-500 italic">_– {nome || 'Consultora'}_</p>
        </div>
      </div>

      {/* INTEGRAÇÃO COM SUPABASE (INFORMATIVO) */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900">
              Conexão com Banco de Dados (Supabase)
            </h3>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Modo Local Ativo (Pronto para Uso)
            </span>
          </div>
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Atualmente o app está operando em <strong>Modo Local</strong> com persistência segura no seu navegador. Quando você criar seu projeto no Supabase, basta rodar o script{' '}
          <code className="text-rose-600 font-semibold">supabase/schema.sql</code> e preencher o arquivo <code className="text-rose-600 font-semibold">.env.local</code>. O sistema está totalmente preparado para conectar instantaneamente!
        </p>
      </div>

      {/* RESET DE DADOS DE DEMONSTRAÇÃO */}
      <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-2xs space-y-2">
        <h3 className="text-xs font-bold text-zinc-900">
          Dados de Demonstração
        </h3>
        <p className="text-[11px] text-zinc-500">
          Deseja restaurar as clientes e vendas de exemplo iniciais?
        </p>
        <button
          onClick={() => {
            if (
              window.confirm(
                'Deseja restaurar os dados de demonstração originais? Isso substituirá os registros atuais.'
              )
            ) {
              onResetData();
            }
          }}
          className="tap-target flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Dados de Exemplo</span>
        </button>
      </div>
    </div>
  );
};
