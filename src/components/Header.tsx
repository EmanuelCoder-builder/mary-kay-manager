'use client';

import React from 'react';
import { Sparkles, Settings as SettingsIcon } from 'lucide-react';

interface HeaderProps {
  consultantName: string;
  todayFormatted?: string;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  consultantName, 
  todayFormatted = '', 
  onOpenSettings 
}) => {

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-rose-100 shadow-xs">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo Mary Kay Inspirado */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-serif tracking-[0.22em] text-xl font-bold text-zinc-950 uppercase">
              MARY KAY
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              Manager
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium">
            <Sparkles className="w-3 h-3 text-rose-500 inline" />
            <span className="truncate max-w-[170px]">{consultantName}</span>
            <span className="text-zinc-300">•</span>
            <span className="text-zinc-500">{todayFormatted}</span>
          </div>
        </div>

        {/* Botão de Atalho para Configurações */}
        <button
          onClick={onOpenSettings}
          className="tap-target flex items-center justify-center p-2 rounded-full text-zinc-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Configurações da Consultora"
          aria-label="Abrir configurações"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
