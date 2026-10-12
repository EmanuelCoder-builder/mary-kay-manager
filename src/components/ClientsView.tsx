'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  MessageCircle, 
  Edit2, 
  Trash2, 
  X, 
  Users
} from 'lucide-react';
import { Cliente, Venda } from '@/types/database';
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
      setFormError('Por favor, digite o nome da cliente.');
      return;
    }
    const cleanPhone = formTelefone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Digite um WhatsApp com DDD (ex: 81999998888).');
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
    <div className="space-y-4 pb-28">
      {/* CABEÇALHO ESTILO CONTATOS DO IPHONE */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1C1C1E]">
            Clientes
          </h2>
          <p className="text-xs text-[#8E8E93]">
            {clients.length} {clients.length === 1 ? 'cadastrada' : 'cadastradas'}
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="tap-target px-3.5 py-2 rounded-full bg-rose-600 active:scale-95 text-white text-xs font-semibold shadow-xs flex items-center gap-1 transition-transform"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova</span>
        </button>
      </div>

      {/* CAMPO DE BUSCA NATIVO IOS */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar cliente ou WhatsApp..."
          className="w-full pl-10 pr-9 py-2.5 rounded-[14px] bg-[#E5E5EA]/50 text-sm text-[#1C1C1E] placeholder:text-[#8E8E93] focus:outline-none focus:bg-white focus:ring-2 focus:ring-rose-500/20 border border-transparent focus:border-[#D1D1D6] transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#1C1C1E]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* LISTA DE CLIENTES */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-[24px] p-8 text-center border border-[#E5E5EA]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#F2F2F7] text-[#8E8E93] flex items-center justify-center">
            <Users className="w-6 h-6 stroke-[1.8]" />
          </div>
          <p className="text-sm font-bold text-[#1C1C1E]">
            {searchTerm ? 'Nenhuma cliente encontrada.' : 'Nenhuma cliente cadastrada ainda.'}
          </p>
          <p className="text-xs text-[#8E8E93] max-w-xs mx-auto">
            {searchTerm
              ? 'Tente buscar com outro nome.'
              : 'Toque no botão "+ Nova" acima para cadastrar a primeira cliente.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredClients.map((client) => {
            const numSales = clientPurchasesCount.get(client.id_cliente) || 0;
            const waNumber = formatPhoneForWhatsApp(client.telefone);

            return (
              <div
                key={client.id_cliente}
                className="bg-white rounded-[20px] p-3.5 border border-[#E5E5EA]/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 text-rose-600 font-bold text-sm flex items-center justify-center shrink-0">
                    {client.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1C1C1E]">
                      {client.nome}
                    </h3>
                    <p className="text-xs text-[#8E8E93] mt-0.5">
                      {formatDisplayPhone(client.telefone)}
                    </p>
                    <span className="inline-block text-[10px] font-medium text-rose-600 bg-rose-50 px-2 py-0.2 rounded-md mt-0.5">
                      {numSales} {numSales === 1 ? 'compra' : 'compras'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-target p-2 rounded-xl text-[#25D366] hover:bg-emerald-50 active:scale-95 transition-all"
                    title="Conversar no WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5 fill-current" />
                  </a>

                  <button
                    onClick={() => handleOpenEdit(client)}
                    className="tap-target p-2 rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] active:scale-95 transition-all"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Deseja apagar o cadastro de ${client.nome}? Todas as compras dela serão removidas.`
                        )
                      ) {
                        onDeleteClient(client.id_cliente);
                      }
                    }}
                    className="tap-target p-2 rounded-xl text-[#8E8E93] hover:text-rose-600 active:scale-95 transition-all"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL SHEET ESTILO IOS PARA CADASTRO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[28px] p-6 shadow-2xl space-y-4 border border-[#E5E5EA] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2F2F7]">
              <h3 className="text-base font-bold text-[#1C1C1E]">
                {editingClient ? 'Editar Cliente' : 'Nova Cliente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="tap-target w-8 h-8 rounded-full bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-1">
                  Nome da Cliente
                </label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Mariana Silva"
                  className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] border border-transparent text-sm text-[#1C1C1E] focus:outline-none focus:bg-white focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-1">
                  WhatsApp com DDD
                </label>
                <input
                  type="tel"
                  value={formTelefone}
                  onChange={(e) => setFormTelefone(e.target.value)}
                  placeholder="Ex: 81999998888"
                  className="w-full px-4 py-3 rounded-xl bg-[#F2F2F7] border border-transparent text-sm text-[#1C1C1E] focus:outline-none focus:bg-white focus:border-rose-500"
                  required
                />
                <span className="text-[11px] text-[#8E8E93] mt-1 block">
                  Usado para enviar a cobrança em 1 toque.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="tap-target flex-1 py-3 rounded-xl bg-[#F2F2F7] text-[#1C1C1E] text-xs font-semibold hover:bg-[#E5E5EA]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="tap-target flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-transform"
                >
                  {editingClient ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
