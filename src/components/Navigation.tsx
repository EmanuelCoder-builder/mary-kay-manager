'use client';

import React from 'react';
import { Home, Users, Plus, ReceiptText, SlidersHorizontal } from 'lucide-react';

export type TabType = 'dashboard' | 'clients' | 'new-sale' | 'sales' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  pendingTodayCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  pendingTodayCount = 0,
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Início',
      icon: Home,
      badge: pendingTodayCount > 0 ? pendingTodayCount : undefined,
    },
    {
      id: 'clients' as TabType,
      label: 'Clientes',
      icon: Users,
    },
    {
      id: 'new-sale' as TabType,
      label: 'Vender',
      icon: Plus,
      isAction: true,
    },
    {
      id: 'sales' as TabType,
      label: 'Extrato',
      icon: ReceiptText,
    },
    {
      id: 'settings' as TabType,
      label: 'Ajustes',
      icon: SlidersHorizontal,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-2xl border-t border-[#D1D1D6]/50 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 shadow-[0_-1px_12px_rgba(0,0,0,0.03)]">
      <div className="max-w-md mx-auto px-4 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isAction) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className="tap-target relative flex flex-col items-center justify-center -top-2"
                aria-label="Registrar Nova Venda"
              >
                <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30 active:scale-90 transition-transform">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-semibold text-rose-600 mt-0.5">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`tap-target relative flex flex-col items-center justify-center px-3 py-1 transition-all active:scale-95 ${
                isActive ? 'text-rose-600' : 'text-[#8E8E93] hover:text-[#1C1C1E]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-1 ${
                  isActive ? 'font-semibold text-rose-600' : 'font-medium text-[#8E8E93]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
