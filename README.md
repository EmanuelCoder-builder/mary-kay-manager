# Mary Kay Manager (MVP)

Sistema web mobile-first de gestão comercial e financeira desenvolvido para consultoras Mary Kay. Permite o cadastro e acompanhamento de clientes, registro e automação de vendas parceladas, previsibilidade de fluxo de caixa mensal e cobrança diária simplificada em 1 clique via WhatsApp (com chave Pix integrada).

---

## 🚀 Tecnologias

- **Frontend:** [Next.js](https://nextjs.org/) (App Router, React, TypeScript)
- **Estilização & Componentes:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + Lucide Icons
- **Backend as a Service:** [Supabase](https://supabase.com/) (PostgreSQL + Supabase Auth + RLS)
- **Manipulação de Datas:** [date-fns](https://date-fns.org/) com fuso horário forçado `America/Recife`
- **Controle de Versão:** Git + GitHub

---

## 📋 Funcionalidades Principais (MVP)

1. **Autenticação Segura (RF01):**
   - Acesso restrito via Supabase Auth para a consultora.
2. **Gestão de Clientes (RF02):**
   - CRUD completo de clientes (Nome, WhatsApp com DDD, histórico).
3. **Registro de Vendas & Parcelamento Automático (RF03 & RF04):**
   - Registro de produtos vendidos e valor total.
   - Divisão automática em $N$ parcelas com vencimentos a cada 30 dias (ou customizado).
   - Tratamento de arredondamento de centavos na última parcela (RN01).
   - Venda à vista registrada como 1 parcela com vencimento na data atual (RN02).
4. **Dashboard Financeiro (RF05):**
   - Previsão de recebimento do mês corrente.
   - Total recebido vs. pendente.
5. **Hub de Cobranças do Dia (RF06 & RF07):**
   - Listagem em destaque das parcelas que vencem hoje e estão pendentes.
   - Botão de 1 clique redirecionando para WhatsApp (`wa.me`) com mensagem amigável, valor da parcela e chave Pix da consultora.
6. **Baixa Rápida de Pagamento (RF08):**
   - Checkbox/botão com confirmação rápida para marcar parcela como paga (`status_pago = true`).

---

## 🗄️ Modelo do Banco de Dados

O banco de dados relacional é estruturado no Supabase conforme o script em [`supabase/schema.sql`](supabase/schema.sql):

- **`cliente`**: Cadastro da cliente (nome, telefone com DDD, data_cadastro).
- **`venda`**: Registro da venda (cliente, descrição dos produtos, valor total, data da venda, total de parcelas).
- **`parcela`**: Detalhamento de cada prestação (venda, número da parcela, valor, data de vencimento, status pago, data de pagamento).

---

## 🛠️ Como Executar Localmente

### Pré-requisitos
- Node.js 20+ ou 22+ LTS
- Conta no Supabase (projeto configurado)

### Passo a Passo

1. **Instalar Dependências:**
   ```bash
   npm install
   ```

2. **Configurar Variáveis de Ambiente:**
   Crie um arquivo `.env.local` na raiz:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
   NEXT_PUBLIC_CONSULTANT_PIX=sua-chave-pix-aqui
   NEXT_PUBLIC_CONSULTANT_NAME=Nome da Consultora
   ```

3. **Executar as Migrations no Supabase:**
   Copie e cole o conteúdo de `supabase/schema.sql` no **SQL Editor** do painel do Supabase.

4. **Iniciar o Servidor de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000`.
