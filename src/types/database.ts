export type Cliente = {
  id_cliente: string;
  nome: string;
  telefone: string;
  data_cadastro: string;
  user_id?: string;
};

export type Venda = {
  id_venda: string;
  id_cliente: string;
  descricao_produtos: string;
  valor_total: number;
  data_venda: string;
  total_de_parcelas: number;
  user_id?: string;
  created_at: string;
};

export type Parcela = {
  id_parcela: string;
  id_venda: string;
  numero_da_parcela: number;
  valor_parcela: number;
  data_vencimento: string; // YYYY-MM-DD
  status_pago: boolean;
  data_pagamento: string | null; // YYYY-MM-DD
  created_at: string;
};

export type CobrancaComCliente = {
  id_parcela: string;
  numero_da_parcela: number;
  valor_parcela: number;
  data_vencimento: string;
  status_pago: boolean;
  data_pagamento: string | null;
  id_venda: string;
  descricao_produtos: string;
  total_de_parcelas: number;
  data_venda: string;
  id_cliente: string;
  nome_cliente: string;
  telefone_cliente: string;
};

export type Database = {
  public: {
    Tables: {
      cliente: {
        Row: Cliente;
        Insert: Omit<Cliente, 'id_cliente' | 'data_cadastro'> & {
          id_cliente?: string;
          data_cadastro?: string;
        };
        Update: Partial<Omit<Cliente, 'id_cliente'>>;
      };
      venda: {
        Row: Venda;
        Insert: Omit<Venda, 'id_venda' | 'created_at'> & {
          id_venda?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Venda, 'id_venda'>>;
      };
      parcela: {
        Row: Parcela;
        Insert: Omit<Parcela, 'id_parcela' | 'created_at'> & {
          id_parcela?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Parcela, 'id_parcela'>>;
      };
    };
    Views: {
      vw_cobrancas: {
        Row: CobrancaComCliente;
      };
    };
  };
};
