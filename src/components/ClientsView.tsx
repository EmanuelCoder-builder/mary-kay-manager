'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  Phone, 
  MessageCircle, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { Cliente, Venda } from '@/types/database';
import { formatDateBR } from '@/lib/date-utils';
import { formatPhoneForWhatsApp } from '@/lib/whatsapp';

interface ClientsViewProps {
  clients: Cliente[];
  sales: Venda[];
  onAddClient: (nome: string, telefone: string) => void;
  onUpdateClient: (id_cliente: string, nome: string, telefone: string) => void;
  onDeleteClient: (id_cliente: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  sales,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);

  const [formNome, setFormNome] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formError, setFormError] = useState('');

  // Filtro de busca
  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return clients;
    return clients.filter(
      (c) =>
        c.nome.toLowerCase().includes(term) ||
        c.telefone.includes(term)
    );
  }, [clients, searchTerm]);

  // Contagem de compras por cliente
  const clientPurchasesCount = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => {
      map.set(s.id_cliente, (map.get(s.id_cliente) || 0) + 1);
    });
    return map;
  }, [sales]);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormNome('');
    setFormTelefone('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Cliente) => {
    setEditingClient(client);
    setFormNome(client.nome);
    setFormTelefone(client.telefone);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      setFormError('Por favor, informe o nome da cliente.');
      return;
    }
    const cleanPhone = formTelefone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Informe um telefone válido com DDD (ex: 81999998888).');
      return;
    }

    if (editingClient) {
      onUpdateClient(editingClient.id_cliente, formNome.trim(), cleanPhone);
    } else {
      onAddClient(formNome.trim(), cleanPhone);
    }

    setIsModalOpen(false);
  };

  const formatDisplayPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return raw;
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-zinc-950">
            Minhas Clientes
          </h2>
          <p className="text-xs text-zinc-500">
            {clients.length} {clients.length === 1 ? 'cliente cadastrada' : 'clientes cadastradas'}
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="tap-target flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nova Cliente</span>
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome ou WhatsApp..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-rose-100 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200/50 shadow-2xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lista de Clientes */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-rose-100 shadow-2xs space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-zinc-800">
            {searchTerm ? 'Nenhuma cliente encontrada.' : 'Nenhuma cliente cadastrada ainda.'}
          </p>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            {searchTerm
              ? 'Tente buscar com outro termo ou limpe o campo.'
              : 'Comece adicionando as clientes que você atende para gerenciar as compras e parcelas.'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleOpenCreate}
              className="tap-target px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold"
            >
              Cadastrar Primeira Cliente
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClients.map((client) => {
            const numSales = clientPurchasesCount.get(client.id_cliente) || 0;
            const waNumber = formatPhoneForWhatsApp(client.telefone);

            return (
              <div
                key={client.id_cliente}
                className="bg-white rounded-2xl p-4 border border-rose-100 shadow-2xs hover:border-rose-200 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-pink-400 text-white font-serif font-bold flex items-center justify-center shadow-xs">
                      {client.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">
                        {client.nome}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          {formatDisplayPhone(client.telefone)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3 text-rose-500" />
                    {numSales} {numSales === 1 ? 'venda' : 'vendas'}
                  </span>
                </div>

                {/* Ações da Cliente */}
                <div className="flex items-center justify-between pt-2 border-t border-rose-50">
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-target flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-emerald-600" />
                    <span>WhatsApp</span>
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(client)}
                      className="tap-target p-2 rounded-xl text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                      title="Editar Cliente"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Deseja realmente remover ${client.nome}? Todas as vendas e parcelas vinculadas também serão apagadas.`
                          )
                        ) {
                          onDeleteClient(client.id_cliente);
                        }
                      }}
                      className="tap-target p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Excluir Cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL ADICIONAR / EDITAR CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 border border-rose-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-rose-100">
              <h3 className="text-base font-serif font-bold text-zinc-900">
                {editingClient ? 'Editar Cliente' : 'Nova Cliente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="tap-target p-1.5 text-zinc-400 hover:text-zinc-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Mariana Silva"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  WhatsApp com DDD
                </label>
                <input
                  type="tel"
                  value={formTelefone}
                  onChange={(e) => setFormTelefone(e.target.value)}
                  placeholder="Ex: 81999998888"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                  required
                />
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  Apenas números com DDD. Será usado para os disparos automáticos.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="tap-target flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-semibold hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="tap-target flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
                >
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
