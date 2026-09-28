# Deployment & Production Architecture Guide

This guide details how to build, containerize, and deploy the Service Master QR Voting System to production environments.

---

## 1. Architecture Overview

- **Frontend**: React 18/19, Vite, Tailwind CSS, Lucide Icons, Canvas QR, HTML5 Camera Scanner.
- **Backend API**: Node.js, Express, Rate Limiter, JWT Auth, Fraud Rules Engine, QR Service.
- **Data Persistence**: Portable relational JSON/SQLite storage out of the box with zero external configuration, plus standard SQL migration script (`server/src/db/schema.sql`) for PostgreSQL/Supabase.

---

## 2. Environment Variables

Create a `.env` file in `server/`:

```env
# Server Port
PORT=5000

# Node Environment
NODE_ENV=production

# JWT Authentication Secret (Use strong 64-char random string in prod)
JWT_SECRET=super_secure_production_secret_key_change_me_98214

# Production Domain Base URL (Used for QR code links)
PUBLIC_URL=https://vote.petronsanpedro.ph

# Optional: PostgreSQL Database URL (if switching from SQLite/file store)
# DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
```

---

## 3. Local Execution & Quick Start

```bash
# 1. Install root dependencies
npm install

# 2. Install backend & frontend packages
npm --prefix server install
npm --prefix client install

# 3. Run unit tests
npm test

# 4. Start concurrent development servers
npm run dev
```

The frontend will run at `http://localhost:3000` and the API backend at `http://localhost:5000`.

---

## 4. Production Build & Static Serving

The server includes built-in static file hosting for the client bundle:

```bash
# 1. Build the production React frontend
npm --prefix client run build

# 2. Start the Express server (serves API and client/dist/)
npm --prefix server start
```

Your web application will now run as a single unified service on `http://localhost:5000`.

---

## 5. Deployment Options

### Option A: Railway / Render / DigitalOcean (Single Service)

1. Connect your Git repository.
2. Set Build Command:
   ```bash
   npm --prefix server install && npm --prefix client install && npm --prefix client run build
   ```
3. Set Start Command:
   ```bash
   node server/src/index.js
   ```
4. Configure Environment Variables (`PORT`, `JWT_SECRET`, `PUBLIC_URL`).
5. Ensure persistent storage is attached to `server/data/` if using file-based SQLite.

### Option B: Split Frontend (Vercel) + Backend (Railway/Render)

- **Frontend (Vercel)**:
  - Root directory: `client`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Set `VITE_API_URL` to your backend domain.
- **Backend (Render/Railway)**:
  - Root directory: `server`
  - Start command: `node src/index.js`
  - Enable CORS for your Vercel domain.

---

## 6. Docker Deployment

Create a `Dockerfile` in the root:

```dockerfile
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm --prefix server install
RUN npm --prefix client install

# Copy source and build frontend
COPY server/ ./server/
COPY client/ ./client/
RUN npm --prefix client run build

# Runtime Stage
FROM node:24-alpine

WORKDIR /app
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server/src/index.js"]
```

---

## 7. Security Hardening Checklist

- [x] Reverse proxy trust enabled for real voter IP resolution (`trust proxy: true`).
- [x] Sliding window rate limiter prevents submission spam (`rateLimit` middleware).
- [x] Strict SHA-256 cryptographic voter fingerprinting.
- [x] No personal identifying information (PII) stored, complying with Data Privacy Act of 2012.
- [x] Passwords hashed with bcrypt (salt rounds = 10).
- [x] JWT sessions with expiration.
- [x] HTTPS enforced via reverse proxy (Cloudflare / NGINX / Caddy).
