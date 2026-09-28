# Vercel Deployment Guide - Petron San Pedro SM Voting System

This guide outlines how to deploy the **Service Master (SM) of the Month Voting System** to **Vercel** with full Supabase cloud database integration and live QR generation.

---

## Architecture on Vercel

- **Frontend**: Global CDN static SPA served directly from `/public/index.html`.
- **Backend API**: Serverless Node.js function running on `/api/index.js` handling all voting, fraud engine checks, QR generation, and staff device pairing.
- **Database**: Cloud Supabase PostgreSQL (`https://trpzgmcyknhmqbnszeba.supabase.co`).
- **Dynamic QR URLs**: All QR codes automatically use the live Vercel domain (`https://<project-name>.vercel.app`) as their scan destination.

---

## Method A: Deploy via GitHub (Recommended)

### Step 1: Push Your Code to GitHub
If you haven't already pushed to your repository:
```bash
git add .
git commit -m "feat(deploy): configure Vercel deployment with serverless API and public static assets"
git push origin main
```

### Step 2: Import into Vercel Dashboard
1. Log in to [vercel.com](https://vercel.com).
2. Click **"Add New..."** &rarr; **"Project"**.
3. Select your GitHub repository (`sm-voting-system`).
4. Keep the Framework Preset as **Other** (Vercel will detect `vercel.json`).

### Step 3: Add Environment Variables
Under the **Environment Variables** section in the Vercel import page, add the following 4 keys:

| Key | Value | Description |
| :--- | :--- | :--- |
| `SUPABASE_URL` | `https://trpzgmcyknhmqbnszeba.supabase.co` | Cloud Supabase database endpoint |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` *(from server/.env)* | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` *(from server/.env)* | Supabase service role key (for backend writes) |
| `JWT_SECRET` | `petron_san_pedro_secure_jwt_token_2026` | Secret key for signing admin and pairing tokens |

*(Optional)*:
- `PORT`: `5000` (Defaults to standard serverless)
- `ADMIN_DEFAULT_PASSWORD`: `admin123`

### Step 4: Click Deploy
- Click **"Deploy"**.
- In ~45–60 seconds, Vercel will build and assign you a production URL:
  `https://your-project-name.vercel.app`

---

## Method B: Deploy via Vercel CLI

If you prefer deploying directly from your computer terminal:

1. Open PowerShell and run:
   ```powershell
   Push-Location "c:\Projects\sm-voting-system"
   npx vercel
   ```
2. Follow the on-screen prompts:
   - **Set up and deploy?** &rarr; `Y`
   - **Which scope?** &rarr; Select your Vercel personal or team account
   - **Link to existing project?** &rarr; `N`
   - **Project name?** &rarr; `petron-sanpedro-voting` (or your choice)
   - **In which directory is your code located?** &rarr; `./`
3. Add your environment variables using CLI:
   ```powershell
   npx vercel env add SUPABASE_URL
   npx vercel env add SUPABASE_SERVICE_ROLE_KEY
   npx vercel env add SUPABASE_ANON_KEY
   npx vercel env add JWT_SECRET
   ```
4. Deploy to production:
   ```powershell
   npx vercel --prod
   Pop-Location
   ```

---

## Post-Deployment Verification

1. **Test Public Ballot**:
   Open `https://<your-project>.vercel.app/vote` on a smartphone over cellular data. Verify you can see Rodrigo Lanuza III and submit a vote.
2. **Test Admin Dashboard**:
   Open `https://<your-project>.vercel.app/admin` &rarr; Sign in with `admin` / `admin123`.
3. **Test Mode B QR & ID Badges**:
   Go to the **QR Code Studio** &rarr; verify the QR codes now point directly to your live `.vercel.app` address.
4. **Test Staff Device Pairing**:
   Click **"Pair Phone"** under Rodrigo Lanuza III &rarr; scan the green QR code with his personal smartphone to test device binding live.
