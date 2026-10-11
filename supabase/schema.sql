-- ==============================================================================
-- MARY KAY MANAGER - ESQUEMA DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- ==============================================================================

-- Habilita extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABELA: CLIENTE (RF02)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cliente (
    id_cliente UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL, -- WhatsApp com DDD (apenas números ou formatado)
    data_cadastro TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Recife', now()),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid()
);

-- Índices para busca ágil
CREATE INDEX IF NOT EXISTS idx_cliente_nome ON public.cliente(nome);
CREATE INDEX IF NOT EXISTS idx_cliente_user_id ON public.cliente(user_id);

-- ------------------------------------------------------------------------------
-- 2. TABELA: VENDA (RF03)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.venda (
    id_venda UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cliente UUID NOT NULL REFERENCES public.cliente(id_cliente) ON DELETE CASCADE,
    descricao_produtos TEXT NOT NULL,
    valor_total NUMERIC(10, 2) NOT NULL CHECK (valor_total > 0),
    data_venda DATE NOT NULL,
    total_de_parcelas INTEGER NOT NULL CHECK (total_de_parcelas >= 1),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Recife', now())
);

-- Índices para consultas por cliente e data
CREATE INDEX IF NOT EXISTS idx_venda_cliente ON public.venda(id_cliente);
CREATE INDEX IF NOT EXISTS idx_venda_user_id ON public.venda(user_id);
CREATE INDEX IF NOT EXISTS idx_venda_data ON public.venda(data_venda DESC);

-- ------------------------------------------------------------------------------
-- 3. TABELA: PARCELA (RF04, RF05, RF06, RF08)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parcela (
    id_parcela UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_venda UUID NOT NULL REFERENCES public.venda(id_venda) ON DELETE CASCADE,
    numero_da_parcela INTEGER NOT NULL CHECK (numero_da_parcela >= 1),
    valor_parcela NUMERIC(10, 2) NOT NULL CHECK (valor_parcela >= 0),
    data_vencimento DATE NOT NULL,
    status_pago BOOLEAN NOT NULL DEFAULT FALSE,
    data_pagamento DATE DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Recife', now())
);

-- Índices cruciais para o Hub de Cobranças do Dia e Dashboard Financeiro
CREATE INDEX IF NOT EXISTS idx_parcela_venda ON public.parcela(id_venda);
CREATE INDEX IF NOT EXISTS idx_parcela_cobranca_dia ON public.parcela(data_vencimento, status_pago);

-- ------------------------------------------------------------------------------
-- 4. POLÍTICAS DE SEGURANÇA POR LINHA (ROW LEVEL SECURITY - RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcela ENABLE ROW LEVEL SECURITY;

-- Políticas para CLIENTE (apenas a dona dos dados acessa)
CREATE POLICY "Usuário autenticado pode gerenciar seus clientes"
ON public.cliente
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas para VENDA
CREATE POLICY "Usuário autenticado pode gerenciar suas vendas"
ON public.venda
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas para PARCELA (vinculada à venda do usuário)
CREATE POLICY "Usuário autenticado pode gerenciar parcelas de suas vendas"
ON public.parcela
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.venda
        WHERE public.venda.id_venda = public.parcela.id_venda
        AND public.venda.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.venda
        WHERE public.venda.id_venda = public.parcela.id_venda
        AND public.venda.user_id = auth.uid()
    )
);

-- ------------------------------------------------------------------------------
-- 5. VIEW CONVENIENTE: COBRANÇAS COM DADOS DA CLIENTE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_cobrancas AS
SELECT 
    p.id_parcela,
    p.numero_da_parcela,
    p.valor_parcela,
    p.data_vencimento,
    p.status_pago,
    p.data_pagamento,
    v.id_venda,
    v.descricao_produtos,
    v.total_de_parcelas,
    v.data_venda,
    v.user_id,
    c.id_cliente,
    c.nome AS nome_cliente,
    c.telefone AS telefone_cliente
FROM public.parcela p
JOIN public.venda v ON v.id_venda = p.id_venda
JOIN public.cliente c ON c.id_cliente = v.id_cliente;
