# QR-Based Voting System for Service Master (SM) of the Month

A cheat-resistant, auditable, web-based voting system allowing customers to vote for their favorite Service Master in seconds via physical QR codes or mobile camera scanning. Equipped with real-time analytics, automated anti-cheat fraud detection (including anti-self-voting prevention), and an administrative moderation dashboard.

---

## 🌟 Key Features

### 1. Dual Voting Channels via QR Code
- **Mode A – General Voting QR (Counter / Entrance Poster)**:
  - Scanned at station counters, waiting areas, or printed on receipts.
  - Opens a mobile-responsive nominee gallery with live branch filtering and search.
  - Voters pick their Service Master, preview their profile, and confirm their vote.
- **Mode B – SM-Specific QR (Personal Lanyard Badge / Tool Chest)**:
  - Scanned from the Service Master’s physical badge or station bay sticker.
  - Opens an expedited, dedicated confirmation view: *"You are voting for [SM Name] (Station/Branch). Confirm your vote?"*
  - Eliminates mis-votes and completes voting in under 10 seconds.

### 2. Automated Anti-Cheat & Fraud Detection
- **Anti-Self-Voting Shield**: Matches voter hardware fingerprints and IP addresses against registered staff devices to detect and flag employee self-voting attempts.
- **Device Fingerprint Deduplication**: Enforces strict single-ballot limits per customer per day (or per month) without requiring invasive registration or phone numbers.
- **Rapid-Fire Spam Protection**: Flags suspicious bursts from identical IP clusters exceeding configurable velocity limits (e.g. >5 votes in 10 minutes).
- **Operating Hours Boundary**: Restricts voting to station operating hours (e.g. 06:00 to 22:00).
- **Emergency Kill Switch**: Instant administrative shutdown switch.
- **Test Mode**: Safe simulation environment to verify badges and connections without corrupting production stats.

### 3. Real-Time Admin Monitoring & Audit Trail
- **Live Leaderboard**: Ranked standings with vote share percentages, branch filters, and rank badges.
- **Visual Analytics**: Interactive bar charts for SM votes, donut charts for branch share, and 7-day timeline trends.
- **Fraud Queue**: Moderation center displaying full forensic metadata (IP, fingerprint, user agent, flag reason) with one-click **Approve** and **Reject** actions.
- **Audit Registry & Export**: Complete transaction log with one-click **Export to CSV**.
- **QR Code Studio**: Print-ready A4/Letter general posters and CR80 employee lanyard badges.

---

## 🚀 Quick Start

### Prerequisites
- Node.js `>= 18` (Node 20 - 24 supported)
- npm `>= 9`

### Setup & Run

```bash
# 1. Clone or navigate to the project directory
cd c:\Projects\sm-voting-system

# 2. Install all dependencies (root, backend, frontend)
npm run install:all

# 3. Run automated test suite
npm test

# 4. Start concurrent development servers
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **Default Admin Login**:
  - **Username**: `admin`
  - **Password**: `admin123`

---

## 📂 Project Structure

```
sm-voting-system/
├── package.json               # Root monorepo orchestration
├── server/                    # Express REST API & Fraud Engine
│   ├── src/
│   │   ├── index.js           # Server entrypoint & static host
│   │   ├── db/
│   │   │   ├── database.js    # Data store with auto-seeding
│   │   │   └── schema.sql     # Canonical SQL schema (Postgres / Supabase)
│   │   ├── middleware/        # JWT auth & sliding window rate limiter
│   │   ├── routes/            # Auth, SMs, Votes, QR, Campaign, Export
│   │   ├── services/          # FraudEngine & QRService
│   │   └── tests/             # Fraud rules & DB verification tests
├── client/                    # React 18/19 Vite SPA & Tailwind CSS
│   ├── src/
│   │   ├── components/        # Navbar, Footer, Privacy, Modals, PrintViews
│   │   ├── pages/             # Mode A, Mode B, Scanner, Success, Admin
│   │   │   └── admin/         # Overview, Leaderboard, Fraud, Audit, QR Studio
│   │   ├── context/           # AuthContext & ToastContext
│   │   └── hooks/             # useFingerprint (SHA-256 entropy)
└── docs/                      # Manuals and Guides
    ├── ADMIN_MANUAL.md        # Printing guide & moderation manual
    ├── DEPLOYMENT_GUIDE.md    # Production deployment & Docker
    └── FRAUD_DETECTION_RULES.md # Security algorithms & threat matrix
```

---

## 🛡️ Data Privacy & Compliance

This platform complies with the **Data Privacy Act of 2012** and **GDPR guidelines**.
No personal contact information (such as mobile numbers or names) is collected from customers. Ballots are secured through one-way cryptographic SHA-256 hardware hashes solely for fraud prevention and duplicate blocking.

---

## 📄 License
MIT License &copy; 2026. All rights reserved.
