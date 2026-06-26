# CopyZap AI

**Gerador de copys de vendas para WhatsApp com IA treinada em técnicas de conversão.**

Aplicação full-stack para vendedores brasileiros criarem mensagens otimizadas de WhatsApp usando IA (Groq LLaMA 3.3). Inclui assistente guiado de fechamento, analytics de resposta e playbook de técnicas de vendas (AIDA, SPIN, PAS).

---

## Stack

| Camada      | Tecnologia                                              |
|-------------|---------------------------------------------------------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, shadcn/ui, Framer Motion |
| **Backend**  | Express 5, Drizzle ORM, PostgreSQL 16                   |
| **IA**       | Groq SDK (LLaMA 3.3 70B), Anthropic (batch opcional)    |
| **Validação**| Zod v4, React Hook Form                                 |
| **Monorepo** | pnpm workspaces                                         |

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
# Edite .env e adicione sua GROQ_API_KEY

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

| Comando                     | Descrição                                    |
|-----------------------------|----------------------------------------------|
| `pnpm run dev`              | Inicia API + Frontend em paralelo            |
| `pnpm run dev:api`          | API server com hot reload                    |
| `pnpm run dev:web`          | Frontend Vite dev server                     |
| `pnpm run build`            | Typecheck + build de todos os pacotes        |
| `pnpm run typecheck`        | Typecheck em todo o monorepo                 |
| `pnpm run db:push`          | Sincroniza schema do banco (dev)              |
| `pnpm run docker:up`        | Sobe PostgreSQL via Docker                   |
| `pnpm run docker:down`      | Para o container Docker                      |

## Estrutura do projeto

```
copyzap-ai30-main/
├── artifacts/
│   ├── api-server/        # API Express + Groq AI
│   ├── copyzap/           # Frontend React principal
│   └── mockup-sandbox/    # Preview de componentes
├── lib/
│   ├── api-client-react/  # React hooks gerados (Orval)
│   ├── api-spec/          # OpenAPI spec
│   ├── api-zod/           # Schemas Zod gerados
│   ├── db/                # Drizzle schema + conexão
│   └── integrations-anthropic-ai/  # Batch Anthropic
├── scripts/               # Scripts utilitários
├── docker-compose.yml     # PostgreSQL + Adminer
└── .env.example           # Template de variáveis
```

## Variáveis de ambiente

| Variável          | Obrigatória | Descrição                          |
|-------------------|-------------|------------------------------------|
| `DATABASE_URL`    | ✅           | PostgreSQL connection string       |
| `GROQ_API_KEY`    | ✅           | Chave da API Groq para geração IA  |
| `ANTHROPIC_API_KEY` | ❌        | Chave Anthropic (batch opcional)   |
| `PORT`            | ❌           | Porta da API (default: 5000)       |
