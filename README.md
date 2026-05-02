# BackOfficeAI

[![CI/CD](https://github.com/yourusername/backofficai/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/backofficai/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://typescriptlang.org)

An AI-powered back-office management system for small and medium-sized businesses. Combines a full ERP with an autonomous AI agent that manages invoices, expenses, payroll, vendors, and more — all through natural language.

---

## Features

- 🤖 **AI Agent** — Chat with your back office. Ask questions, trigger actions, get insights using Groq (free) or Ollama (local)
- 🧾 **Invoice Management** — Create, track, mark paid, flag overdue invoices automatically
- 💸 **Expense Management** — Submit, approve, and reject expenses with policy enforcement
- 👥 **Payroll Processing** — Manage employees and run payroll (weekly, bi-weekly, monthly)
- 🏢 **Vendor Management** — Track vendors, payment terms, and payment history
- 📋 **Business Policies** — Define rules for automated approvals, alerts, and payments
- 🏦 **Bank Transactions** — Monitor cash flow with automatic categorization
- 📊 **Analytics** — Revenue, expenses, cash flow charts and financial health score
- 🔔 **Notifications** — Real-time alerts for overdue invoices, low cash balance, and more
- 📝 **Audit Trail** — Full audit log of all create/update/delete operations
- ⏰ **Background Jobs** — Automated daily briefings, overdue checks, scheduled payroll via Bull/Redis
- 🔒 **JWT Authentication** — Secure multi-user support with company isolation
- 📤 **CSV Export** — Export invoices, expenses, and payroll data

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   Vercel / nginx (80)   │  ← Frontend (React)
              │   Static + SPA routing  │
              └────────────┬────────────┘
                           │ /api/* proxy
              ┌────────────▼────────────┐
              │  Railway / Express      │  ← Backend (Node.js)
              │  :3001                  │
              └──────┬──────────┬───────┘
                     │          │
          ┌──────────▼──┐  ┌────▼──────────┐
          │  PostgreSQL  │  │  Redis        │
          │  (Neon.tech) │  │  (Upstash)    │
          └─────────────┘  └───────────────┘
                     │
          ┌──────────▼──────────┐
          │  Groq API / Ollama  │  ← AI Provider
          └─────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20 + Express + TypeScript |
| Frontend | React 18 + TypeScript + Tailwind CSS + shadcn/ui |
| Database | PostgreSQL 15 + Prisma ORM |
| AI Agent | Groq (llama-3.3-70b) or Ollama with function calling |
| Queue | Bull (Redis-based background jobs) |
| Auth | JWT (bcrypt password hashing) |
| Email | Resend |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions → Railway + Vercel |

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)
- Redis 7+ (optional — background jobs only)

### 1. Clone and install

```bash
git clone https://github.com/yourusername/backofficai.git
cd backofficai

# Install all dependencies
make install
# or manually:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — minimum required: DATABASE_URL, JWT_SECRET
# For AI: set AI_PROVIDER=groq and GROQ_API_KEY, or AI_PROVIDER=ollama
```

### 3. Set up the database

```bash
make migrate
# or:
cd backend && npx prisma migrate dev
```

### 4. Seed demo data (optional)

```bash
make seed
# Creates demo user: demo@backofficai.com / demo123456
# Plus sample invoices, expenses, employees, vendors, transactions
```

### 5. Start development servers

```bash
make dev
# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

---

## Docker Setup

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET and AI credentials

# Start all services (postgres, redis, backend, frontend)
make docker-up

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed demo data
docker-compose exec backend npx ts-node src/scripts/seed.ts
```

Services:
- Frontend: http://localhost:80
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Secret for JWT signing (use 64+ random chars) |
| `AI_PROVIDER` | — | `ollama` | `groq` or `ollama` |
| `GROQ_API_KEY` | If groq | — | API key from console.groq.com |
| `GROQ_MODEL` | — | `llama-3.3-70b-versatile` | Groq model name |
| `OLLAMA_BASE_URL` | If ollama | `http://localhost:11434/v1` | Ollama server URL |
| `OLLAMA_MODEL` | — | `qwen2.5:14b` | Ollama model name |
| `RESEND_API_KEY` | — | — | Email API key from resend.com |
| `RESEND_FROM_EMAIL` | — | `onboarding@resend.dev` | From address for emails |
| `REDIS_URL` | — | `redis://localhost:6379` | Redis URL for background jobs |
| `PORT` | — | `3001` | Backend server port |
| `NODE_ENV` | — | `development` | `development` or `production` |
| `FRONTEND_URL` | — | `http://localhost:5173` | Frontend URL for CORS |
| `JWT_EXPIRES_IN` | — | `7d` | JWT token expiry |
| `VITE_API_URL` | — | `http://localhost:3001/api/v1` | Frontend API base URL |
| `POSTGRES_USER` | Docker | `postgres` | Postgres username (Docker only) |
| `POSTGRES_PASSWORD` | Docker | — | Postgres password (Docker only) |
| `POSTGRES_DB` | Docker | `backofficai` | Postgres database name (Docker only) |

---

## API Endpoints

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Server health + DB status |
| GET | `/api/v1/health` | No | API health check |

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | No | Register new user |
| POST | `/api/v1/auth/login` | No | Login, returns JWT |
| GET | `/api/v1/auth/me` | Yes | Get current user |

### Dashboard
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/dashboard` | Yes | Financial overview stats |

### Invoices
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/invoices` | Yes | List invoices (supports `?status=`, `?search=`, `?page=`, `?limit=`) |
| POST | `/api/v1/invoices` | Yes | Create invoice |
| PUT | `/api/v1/invoices/:id/paid` | Yes | Mark invoice as paid |
| PUT | `/api/v1/invoices/:id/flag` | Yes | Flag invoice for review |
| DELETE | `/api/v1/invoices/:id` | Yes | Delete invoice |
| POST | `/api/v1/invoices/bulk` | Yes | Bulk mark paid / flag / delete |
| GET | `/api/v1/invoices/overdue` | Yes | Get overdue invoices |

### Expenses
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/expenses` | Yes | List expenses (supports `?status=`, `?search=`, `?page=`) |
| POST | `/api/v1/expenses` | Yes | Submit expense |
| PUT | `/api/v1/expenses/:id/approve` | Yes | Approve expense |
| PUT | `/api/v1/expenses/:id/reject` | Yes | Reject expense |
| POST | `/api/v1/expenses/bulk-approve` | Yes | Bulk approve expenses |

### Payroll
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/payroll/employees` | Yes | List employees |
| POST | `/api/v1/payroll/employees` | Yes | Add employee |
| PUT | `/api/v1/payroll/employees/:id` | Yes | Update employee |
| POST | `/api/v1/payroll/run` | Yes | Run payroll |
| GET | `/api/v1/payroll/history` | Yes | Payroll history |

### Vendors
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/vendors` | Yes | List vendors |
| POST | `/api/v1/vendors` | Yes | Create vendor |
| PUT | `/api/v1/vendors/:id` | Yes | Update vendor |
| DELETE | `/api/v1/vendors/:id` | Yes | Delete vendor |

### Policies
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/policies` | Yes | List policies |
| POST | `/api/v1/policies` | Yes | Create policy |
| PUT | `/api/v1/policies/:id` | Yes | Update policy |
| DELETE | `/api/v1/policies/:id` | Yes | Delete policy |

### AI Agent
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/agent/chat` | Yes | Send message to agent |
| GET | `/api/v1/agent/logs` | Yes | Get agent activity logs |

### Analytics
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/analytics` | Yes | Revenue, expenses, cash flow charts |

### Audit Log
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/audit` | Yes | Full audit trail with filtering |

### Notifications
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/notifications` | Yes | List notifications |
| PUT | `/api/v1/notifications/:id/read` | Yes | Mark as read |

---

## AI Agent Usage

The AI agent understands natural language commands:

```
"What's my current cash balance?"
"Show me all overdue invoices"
"Approve all pending expenses under $200"
"Run payroll for monthly employees"
"Create a new vendor called Acme Corp with Net 30 terms"
"Flag invoice [id] — amount seems incorrect"
"What's my monthly expense breakdown?"
"How much did I spend on software this quarter?"
"Get me a financial summary"
```

---

## Project Structure

```
backofficai/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD
├── backend/
│   ├── src/
│   │   ├── agent/              # AI agent core, tools, prompts, scheduler
│   │   ├── config/             # Environment configuration
│   │   ├── db/                 # Prisma client singleton
│   │   ├── middleware/         # Auth, error handling
│   │   ├── routes/             # Express route handlers
│   │   ├── scripts/            # seed.ts and other scripts
│   │   ├── services/           # Business logic layer
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # CSV export, helpers
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── Dockerfile              # Multi-stage production build
│   └── railway.toml            # Railway deployment config
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components + shadcn/ui
│   │   ├── lib/                # API client, utilities
│   │   ├── pages/              # Page components
│   │   └── store/              # Zustand state management
│   ├── Dockerfile              # Multi-stage nginx build
│   ├── nginx.conf              # Production nginx config
│   └── vercel.json             # Vercel deployment config
├── docker-compose.yml          # Full local stack
├── railway.json                # Railway root config
├── render.yaml                 # Render.com deployment config
├── Makefile                    # Common dev commands
├── .env.example                # Environment variable template
├── DEPLOY.md                   # Full deployment guide
└── README.md                   # This file
```

---

## Makefile Commands

```bash
make help          # Show all available commands
make install       # Install all dependencies
make dev           # Start development servers
make migrate       # Run database migrations
make migrate-prod  # Run production migrations
make generate      # Generate Prisma client
make studio        # Open Prisma Studio
make build         # Build for production
make docker-up     # Start all services with Docker
make docker-down   # Stop all Docker services
make docker-logs   # View Docker logs
make docker-build  # Rebuild Docker images
make typecheck     # Run TypeScript type checking
make seed          # Seed database with demo data
make clean         # Clean build artifacts
```

---

## Deployment

See [DEPLOY.md](DEPLOY.md) for complete step-by-step instructions.

**Free stack summary:**
1. **Database** → [Neon.tech](https://neon.tech) (free PostgreSQL)
2. **Backend** → [Railway.app](https://railway.app) (free tier)
3. **Frontend** → [Vercel](https://vercel.com) (free)
4. **Redis** → [Upstash](https://upstash.com) (free)
5. **AI** → [Groq](https://console.groq.com) (free)
6. **Email** → [Resend](https://resend.com) (free)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and run type checks: `make typecheck`
4. Commit: `git commit -m "feat: add my feature"`
5. Push: `git push origin feature/my-feature`
6. Open a pull request

---

## License

MIT — see [LICENSE](LICENSE) for details.
