'use client';

import React from 'react';
import { Home, Users, PlusCircle, Receipt, Sliders } from 'lucide-react';

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
      icon: PlusCircle,
      highlight: true,
    },
    {
      id: 'sales' as TabType,
      label: 'Extrato',
      icon: Receipt,
    },
    {
      id: 'settings' as TabType,
      label: 'Ajustes',
      icon: Sliders,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-rose-100 shadow-[0_-4px_20px_rgba(225,29,72,0.05)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className="tap-target relative flex flex-col items-center justify-center -top-3 focus:outline-none"
                aria-label="Registrar Nova Venda"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 via-pink-500 to-rose-400 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 active:scale-95 transition-transform">
                  <Icon className="w-6 h-6" />
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
              className={`tap-target relative flex flex-col items-center justify-center px-3 py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-rose-600 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-600 font-normal'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-4 h-0.5 bg-rose-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
