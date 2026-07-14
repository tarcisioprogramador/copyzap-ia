# CopyZap AI / ZapCopy AI

**Plataforma SaaS de geração de copies de vendas para WhatsApp com IA.**

Sistema completo para vendedores brasileiros criarem mensagens altamente persuasivas de WhatsApp usando Inteligência Artificial (Groq LLaMA 3.3). Inclui modo vendedor IA, correção de copies, gerador de follow-up, assistente guiado de fechamento, analytics e sistema de autenticação.

---

## Funcionalidades

- **Gerador de Copy com IA** — Gere copies personalizadas por nicho, produto e público
- **Modo Vendedor IA** — Descreva o cenário, a IA responde como um vendedor humano
- **Correção de Copy** — Cole sua mensagem e a IA melhora a persuasão
- **Gerador de Follow-up** — Reative leads que pararam de responder
- **Assistente de Fechamento** — Wizard guiado de 7 passos com recomendação estratégica
- **Templates Inteligentes** — AIDA, SPIN, PAS integrados automaticamente
- **Sistema de Autenticação** — Login, cadastro, JWT, planos Free/Pro
- **Dashboard com Analytics** — Histórico, métricas de uso, taxa de resposta
- **Preview WhatsApp** — Visualize como a mensagem ficará no WhatsApp
- **Integração WhatsApp** — Envio direto via WhatsApp Cloud API

## Stack

| Camada       | Tecnologia                                              |
|--------------|---------------------------------------------------------|
| **Frontend**  | React 19, Vite 7, Tailwind CSS 4, shadcn/ui, Framer Motion |
| **Backend**   | Express 5, Drizzle ORM, PostgreSQL 16                   |
| **IA**        | Groq SDK (LLaMA 3.3 70B)                               |
| **Auth**      | JWT (jsonwebtoken + bcryptjs)                           |
| **Validação** | Zod v4, React Hook Form                                 |
| **Monorepo**  | pnpm workspaces                                         |

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/installation)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Uma chave de API [Groq](https://console.groq.com/keys) (grátis)

## Setup rápido

```bash
# 1. Clone e entre na pasta
cd copyzap-ai30-main

# 2. Copie o .env.example e configure
cp .env.example .env
# Edite .env e adicione sua GROQ_API_KEY e JWT_SECRET

# 3. Suba o banco PostgreSQL
docker compose up -d

# 4. Instale as dependências
pnpm install

# 5. Rode as migrations do banco
pnpm run db:push

# 6. Inicie o projeto (API + Frontend)
pnpm run dev
```

O frontend estará em **http://localhost:5173** e a API em **http://localhost:5000**.

## Scripts disponíveis

| Comando                      | Descrição                                    |
|------------------------------|----------------------------------------------|
| `pnpm run dev`               | Inicia API + Frontend em paralelo            |
| `pnpm run dev:api`           | API server com hot reload                    |
| `pnpm run dev:web`           | Frontend Vite dev server                     |
| `pnpm run build`             | Typecheck + build de todos os pacotes        |
| `pnpm run build:production`  | Build otimizado para produção                |
| `pnpm run start:production`  | Inicia o servidor em produção                |
| `pnpm run typecheck`         | Typecheck em todo o monorepo                 |
| `pnpm run db:push`           | Sincroniza schema do banco (dev)             |
| `pnpm run db:push-force`     | Força sincronização do schema                |
| `pnpm run docker:up`         | Sobe PostgreSQL via Docker                   |
| `pnpm run docker:down`       | Para o container Docker                      |

## Estrutura do projeto

```
copyzap-ai30-main/
├── artifacts/
│   ├── api-server/           # API Express + rotas + IA
│   │   └── src/
│   │       ├── routes/       # Rotas (auth, copies, ai, whatsapp)
│   │       └── lib/          # Auth, middleware, WhatsApp client
│   ├── copyzap/              # Frontend React principal
│   │   └── src/
│   │       ├── pages/        # Home, Login
│   │       ├── components/   # UI components + features
│   │       └── lib/          # Auth context, utils, técnicas
│   └── mockup-sandbox/       # Preview de componentes (Replit)
├── lib/
│   ├── api-client-react/     # React hooks gerados (Orval)
│   ├── api-spec/             # OpenAPI spec
│   ├── api-zod/              # Schemas Zod gerados
│   ├── db/                   # Drizzle schema + conexão
│   └── integrations-anthropic-ai/
├── scripts/
├── docker-compose.yml        # PostgreSQL + Adminer
└── .env.example              # Template de variáveis
```

## Variáveis de ambiente

| Variável                 | Obrigatória | Descrição                                    |
|--------------------------|-------------|----------------------------------------------|
| `DATABASE_URL`           | ✅          | PostgreSQL connection string                 |
| `GROQ_API_KEY`           | ✅          | Chave da API Groq para geração IA            |
| `JWT_SECRET`             | ✅          | Secret para tokens JWT (troque em produção)  |
| `PORT`                   | ❌          | Porta da API (default: 5000)                 |
| `NODE_ENV`               | ❌          | development / production                     |
| `WHATSAPP_PHONE_NUMBER_ID` | ❌        | ID do número WhatsApp Business               |
| `WHATSAPP_ACCESS_TOKEN`  | ❌          | Token de acesso WhatsApp Cloud API           |
| `WHATSAPP_VERIFY_TOKEN`  | ❌          | Token de verificação do webhook              |

## Planos

| Plano   | Copies/dia | Preço      |
|---------|------------|------------|
| **Free** | 10         | Grátis     |
| **Pro**  | Ilimitado  | R$ 29,90/mês |

## Deploy

### Frontend (Vercel)
```bash
cd artifacts/copyzap
pnpm run build
# Deploy dist/ para Vercel
```

### Backend (Railway/Render)
```bash
# Configure as variáveis de ambiente
# Deploy o artifacts/api-server/
```

## Licença

MIT
