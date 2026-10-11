'use client';

import React from 'react';
import { Settings } from 'lucide-react';

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
    <header className="sticky top-0 z-30 bg-[#F2F2F7]/85 backdrop-blur-xl border-b border-[#E5E5EA]/60 px-5 pt-3 pb-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">
            Mary Kay
          </span>
          <h1 className="text-lg font-bold tracking-tight text-[#1C1C1E] leading-tight">
            Olá, {consultantName.replace('Consultora ', '')}
          </h1>
          {todayFormatted && (
            <p className="text-xs text-[#8E8E93] font-medium">
              {todayFormatted}
            </p>
          )}
        </div>

        <button
          onClick={onOpenSettings}
          className="tap-target w-10 h-10 rounded-full bg-white border border-[#E5E5EA] shadow-xs flex items-center justify-center text-[#3A3A3C] hover:text-rose-600 active:scale-95 transition-all"
          title="Ajustes"
          aria-label="Abrir Ajustes"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
