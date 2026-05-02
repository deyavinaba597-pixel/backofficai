# BackOfficeAI — Deployment Guide

Deploy the full stack for **free** using these services:

| Service | Provider | Free Tier |
|---------|----------|-----------|
| Database | [Neon](https://neon.tech) | 512 MB PostgreSQL |
| Backend | [Railway](https://railway.app) | $5/month credit (covers small apps) |
| Frontend | [Vercel](https://vercel.com) | Unlimited static sites |
| Redis | [Upstash](https://upstash.com) | 10,000 req/day |
| AI | [Groq](https://console.groq.com) | 14,400 req/day |
| Email | [Resend](https://resend.com) | 3,000 emails/month |

---

## Step 1 — Database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up (free, no credit card)
2. Click **New Project** → name it `backofficai` → choose a region close to you
3. On the dashboard, click **Connection Details**
4. Copy the **Connection string** — it looks like:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Save this as your `DATABASE_URL` — you'll need it in the next steps

---

## Step 2 — AI Provider (Groq)

1. Go to [console.groq.com](https://console.groq.com) and sign up (free)
2. Click **API Keys** → **Create API Key**
3. Copy the key (starts with `gsk_...`)
4. Save as `GROQ_API_KEY`

---

## Step 3 — Email (Resend) — Optional

1. Go to [resend.com](https://resend.com) and sign up (free)
2. Click **API Keys** → **Create API Key**
3. Copy the key (starts with `re_...`)
4. Save as `RESEND_API_KEY`
5. For `RESEND_FROM_EMAIL`, use `onboarding@resend.dev` (works without domain verification)
   - Or add your own domain in Resend settings for a custom from address

---

## Step 4 — Redis (Upstash) — Optional

Background jobs (daily briefings, overdue checks) require Redis. The app works without it — jobs are just disabled.

1. Go to [upstash.com](https://upstash.com) and sign up (free)
2. Click **Create Database** → name it `backofficai` → choose a region
3. Copy the **Redis URL** (starts with `redis://...` or `rediss://...`)
4. Save as `REDIS_URL`

---

## Step 5 — Backend (Railway)

### Option A: Deploy via Railway CLI (recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# From the backofficai/ directory, create a new project
railway init

# Link to your project
railway link

# Set environment variables (replace values with yours)
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")"
railway variables set AI_PROVIDER="groq"
railway variables set GROQ_API_KEY="gsk_..."
railway variables set GROQ_MODEL="llama-3.3-70b-versatile"
railway variables set RESEND_API_KEY="re_..."
railway variables set RESEND_FROM_EMAIL="onboarding@resend.dev"
railway variables set REDIS_URL="redis://..."
railway variables set PORT="3001"
railway variables set NODE_ENV="production"
railway variables set FRONTEND_URL="https://your-app.vercel.app"

# Deploy from the backend directory
cd backend
railway up
```

### Option B: Deploy via Railway Dashboard

1. Go to [railway.app](https://railway.app) and sign up
2. Click **New Project** → **Deploy from GitHub repo**
3. Connect your GitHub account and select your repository
4. Railway will detect the `backend/Dockerfile` automatically
5. Go to **Variables** tab and add all environment variables listed above
6. Click **Deploy**

### After deployment:

- Railway gives you a URL like `https://backofficai-backend-production.up.railway.app`
- Test it: `curl https://your-backend.railway.app/health`
- You should see: `{"status":"ok","database":"connected",...}`
- **Copy this URL** — you need it for the frontend

### Run database migrations on Railway:

```bash
# Via Railway CLI
railway run --service backofficai-backend npx prisma migrate deploy

# Or via Railway dashboard → your service → Shell tab:
npx prisma migrate deploy
```

### Seed demo data (optional):

```bash
railway run --service backofficai-backend npx ts-node src/scripts/seed.ts
```

---

## Step 6 — Frontend (Vercel)

### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# From the frontend directory
cd frontend

# Login and deploy
vercel login
vercel --prod
```

Vercel will ask:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → backofficai-frontend
- **Directory?** → ./  (you're already in frontend/)
- **Override settings?** → Yes
- **Build command?** → `npm run build`
- **Output directory?** → `dist`

### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **Add New Project** → **Import Git Repository**
3. Select your repository
4. Set **Root Directory** to `frontend`
5. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.railway.app/api/v1`
6. Click **Deploy**

### Update vercel.json with your Railway URL:

Edit `frontend/vercel.json` and replace `your-backend-url.railway.app` with your actual Railway URL:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://backofficai-backend-production.up.railway.app/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Then redeploy: `vercel --prod`

### Update CORS on backend:

Set `FRONTEND_URL` on Railway to your Vercel URL:

```bash
railway variables set FRONTEND_URL="https://backofficai-frontend.vercel.app"
```

---

## Step 7 — Verify Everything Works

```bash
# 1. Check backend health
curl https://your-backend.railway.app/health
# Expected: {"status":"ok","database":"connected","aiProvider":"groq",...}

# 2. Test auth
curl -X POST https://your-backend.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@backofficai.com","password":"demo123456"}'
# Expected: {"token":"eyJ...","user":{...}}

# 3. Open frontend
# Visit: https://your-app.vercel.app
# Login with: demo@backofficai.com / demo123456
```

---

## Step 8 — Custom Domain (Optional)

### Vercel (frontend):
1. Go to your Vercel project → **Settings** → **Domains**
2. Add your domain (e.g., `app.yourdomain.com`)
3. Add the CNAME record shown to your DNS provider
4. Wait for DNS propagation (usually 5–30 minutes)

### Railway (backend):
1. Go to your Railway service → **Settings** → **Domains**
2. Click **Add Custom Domain**
3. Add your subdomain (e.g., `api.yourdomain.com`)
4. Add the CNAME record to your DNS provider
5. Update `FRONTEND_URL` on Railway and `VITE_API_URL` on Vercel to use the new domains

---

## GitHub Actions CI/CD (Optional)

The `.github/workflows/ci.yml` file automatically:
- Type-checks and builds both backend and frontend on every push
- Deploys to Railway + Vercel on pushes to `main`

### Setup:

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:
   - `RAILWAY_TOKEN` — from Railway dashboard → Account Settings → Tokens
   - `VERCEL_TOKEN` — from Vercel dashboard → Settings → Tokens
   - `VERCEL_ORG_ID` — from `vercel env pull` or Vercel project settings
   - `VERCEL_PROJECT_ID` — from Vercel project settings

---

## Docker Self-Hosting (Alternative)

If you prefer to self-host on a VPS (DigitalOcean, Hetzner, etc.):

```bash
# On your server
git clone https://github.com/yourusername/backofficai.git
cd backofficai

# Create .env from example
cp .env.example .env
# Edit .env with your values (nano .env)

# Start everything
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed demo data
docker-compose exec backend npx ts-node src/scripts/seed.ts
```

The app will be available at `http://your-server-ip` (port 80).

For HTTPS, put Nginx or Caddy in front as a reverse proxy.

---

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` is correct and includes `?sslmode=require` for Neon
- Verify the database exists: `psql $DATABASE_URL -c "SELECT 1"`
- For Railway: check the Variables tab has `DATABASE_URL` set

### "AI agent not responding"
- Check `GROQ_API_KEY` is set and valid
- Verify `AI_PROVIDER=groq` is set
- Test: `curl -H "Authorization: Bearer $GROQ_API_KEY" https://api.groq.com/openai/v1/models`

### "CORS error in browser"
- Set `FRONTEND_URL` on Railway to your exact Vercel URL (no trailing slash)
- Example: `FRONTEND_URL=https://backofficai-frontend.vercel.app`

### "Migrations failed"
- Run manually: `railway run npx prisma migrate deploy`
- Check migration files exist in `backend/prisma/migrations/`

### "Redis connection failed" (non-critical)
- The app works without Redis — background jobs are just disabled
- Check logs: `railway logs` or `docker-compose logs backend`

### Frontend shows blank page
- Check browser console for errors
- Verify `VITE_API_URL` points to your Railway backend
- Check `vercel.json` rewrites have the correct backend URL

### Check logs
```bash
# Railway
railway logs --tail

# Docker
docker-compose logs -f backend
docker-compose logs -f frontend
```
