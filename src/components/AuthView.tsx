'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '@/lib/supabase/service';
import { User } from '@supabase/supabase-js';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
  onContinueDemo: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onAuthSuccess,
  onContinueDemo,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consultantName, setConsultantName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await signInWithEmail(email.trim(), password);
        if (result.user) {
          onAuthSuccess(result.user);
        }
      } else {
        const result = await signUpWithEmail(
          email.trim(),
          password,
          consultantName.trim() || undefined
        );
        if (result.user) {
          // Se o Supabase confirmou automaticamente ou enviou confirmação
          if (result.session) {
            setSuccessMsg('Conta criada com sucesso! Entrando...');
            setTimeout(() => {
              if (result.user) onAuthSuccess(result.user);
            }, 1000);
          } else {
            setSuccessMsg(
              'Conta criada! Se o Supabase solicitar confirmação, verifique seu e-mail para ativar o acesso.'
            );
          }
        }
      }
    } catch (err: unknown) {
      console.error('Erro na autenticação:', err);
      const msg = err instanceof Error ? err.message : 'Ocorreu um erro ao processar. Tente novamente.';
      
      // Tradução amigável de erros comuns do Supabase
      if (msg.includes('Invalid login credentials')) {
        setErrorMsg('E-mail ou senha incorretos. Por favor, verifique.');
      } else if (msg.includes('User already registered')) {
        setErrorMsg('Este e-mail já possui cadastro. Toque em "Entrar".');
      } else if (msg.includes('Password should be at least')) {
        setErrorMsg('A senha precisa ter no mínimo 6 caracteres.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col justify-center px-4 py-8">
      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* LOGO & BRANDING ESTILO MARY KAY */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/80 text-rose-700 text-[11px] font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Consultoria de Beleza</span>
          </div>
          <h1 className="font-serif tracking-[0.25em] text-3xl font-bold text-[#1C1C1E]">
            MARY KAY
          </h1>
          <p className="text-xs text-[#8E8E93] font-medium">
            Gestão inteligente de clientes, vendas e cobranças
          </p>
        </div>

        {/* CARTÃO PRINCIPAL ESTILO IOS */}
        <div className="bg-white rounded-[26px] p-6 border border-[#E5E5EA]/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5">
          {/* SELETOR SEGMENTED CONTROL */}
          <div className="p-1 bg-[#F2F2F7] rounded-xl flex">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-[#1C1C1E] shadow-xs'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E]'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-[#1C1C1E] shadow-xs'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E]'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* MENSAGENS DE FEEDBACK */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-700 font-medium flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 font-medium flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORMULÁRIO */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block">
                  Seu Nome
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={consultantName}
                    onChange={(e) => setConsultantName(e.target.value)}
                    placeholder="Ex: Maria Emanuelly"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F2F2F7] text-sm text-[#1C1C1E] placeholder:text-[#8E8E93]/60 focus:outline-none focus:bg-white border border-transparent focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F2F2F7] text-sm text-[#1C1C1E] placeholder:text-[#8E8E93]/60 focus:outline-none focus:bg-white border border-transparent focus:border-rose-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider block">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#F2F2F7] text-sm text-[#1C1C1E] placeholder:text-[#8E8E93]/60 focus:outline-none focus:bg-white border border-transparent focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1C1C1E] p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="tap-target w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Entrar no Aplicativo' : 'Criar Minha Conta'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* MODO DEMONSTRAÇÃO / ACESSO RÁPIDO */}
        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={onContinueDemo}
            className="tap-target inline-flex items-center gap-2 text-xs font-semibold text-[#8E8E93] hover:text-rose-600 transition-colors py-2 px-3 rounded-full hover:bg-white/60"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Acessar Modo Demonstração (Sem Login)</span>
          </button>
          <p className="text-[11px] text-[#8E8E93]/80">
            Seus dados ficam 100% seguros e protegidos no Supabase.
          </p>
        </div>
      </div>
    </div>
  );
};
