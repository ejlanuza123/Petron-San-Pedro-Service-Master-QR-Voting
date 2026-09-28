# Supabase Connection & Setup Guide (Petron San Pedro)

This guide walks you through setting up a separate Supabase cloud project for the **Petron San Pedro Service Master Voting System**.

---

## 1. Create Your New Supabase Project

1. Log in to [Supabase](https://supabase.com/dashboard).
2. Click **New Project**.
3. Select your organization and enter:
   - **Project Name**: `petron-san-pedro-voting`
   - **Database Password**: *(Generate and save a strong password)*
   - **Region**: `Singapore (ap-southeast-1)` *(recommended for fastest response in the Philippines)*
4. Click **Create new project** and wait 1-2 minutes for Supabase to provision your PostgreSQL database.

---

## 2. Run the Database Schema & Migration

1. In your new Supabase project dashboard, click **SQL Editor** from the left navigation bar (or press `Ctrl + K` and type `SQL`).
2. Click **+ New query**.
3. Open the file [`database/supabase_schema.sql`](file:///c:/Projects/sm-voting-system/database/supabase_schema.sql) in your code editor.
4. Copy its entire content, paste it into the Supabase SQL editor, and click **Run** (or `Ctrl + Enter`).
5. You should see `Success. No rows returned`.
6. Confirm the tables are created: click **Table Editor** on the left menu:
   - `sms` (Pre-seeded with 6 Petron San Pedro Service Masters)
   - `campaigns` (Pre-seeded with active campaign)
   - `votes` (With fraud audit columns & indexes)
   - `admins`
   - `audit_logs`

---

## 3. Retrieve Supabase API Credentials

1. In Supabase, go to **Project Settings** (gear icon at the bottom of the left sidebar).
2. Click **API** under Configuration.
3. Locate the following two values:
   - **Project URL**: e.g., `https://abcdefghijklm.supabase.co`
   - **Project API Keys**:
     - `anon` `public` key: e.g., `eyJhbGciOi...`
     - `service_role` `secret` key: e.g., `eyJhbGciOi...` *(recommended for server-side operations)*

---

## 4. Connect the Backend Application

1. In `c:\Projects\sm-voting-system\server\`, create or edit `.env`:

```env
# Server Port & Domain
PORT=5000
PUBLIC_URL=http://localhost:5000
JWT_SECRET=petron_san_pedro_secure_jwt_token_2026

# Supabase Credentials (from Step 3)
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

2. Restart your backend server:
```powershell
Push-Location "c:\Projects\sm-voting-system"; node server/src/index.js; Pop-Location
```

3. The system will detect your Supabase URL and key. When configured, queries and votes route directly to Supabase!
   *(If not configured or in offline mode, the system automatically runs on its local store so you are never blocked)*.

---

## 5. Security & Row Level Security (RLS)

- The migration script automatically enables **Row Level Security (RLS)**.
- Public customers can only `SELECT` active Service Masters and active campaigns.
- Ballot submissions (`INSERT`) are evaluated through the backend's Fraud Engine before insertion, ensuring suspicious self-votes and rapid-fire spam are tagged as `flagged` in Supabase.
- The `service_role` key allows your server backend to manage the fraud queue, approvals, rejections, and settings.
