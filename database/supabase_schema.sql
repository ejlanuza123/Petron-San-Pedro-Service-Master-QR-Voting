-- =========================================================================
-- PETRON SAN PEDRO - SERVICE MASTER (SM) OF THE MONTH QR VOTING SYSTEM
-- Supabase PostgreSQL Database Schema & Migration Script
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. Table: sms (Service Masters nominated at Petron San Pedro)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sms (
  id TEXT PRIMARY KEY DEFAULT ('sm-' || substr(md5(random()::text), 1, 8)),
  name TEXT NOT NULL,
  photo_url TEXT,
  branch TEXT NOT NULL DEFAULT 'Petron San Pedro',
  station TEXT NOT NULL DEFAULT 'Lube Bay 1',
  shift TEXT DEFAULT 'Day Shift (6AM - 2PM)',
  bio TEXT,
  device_fingerprint TEXT,       -- Registered device fingerprint hash to detect self-voting
  ip_registered TEXT,            -- Registered staff IP to detect self-voting
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 2. Table: campaigns (Campaign configurations, operating hours, kill switch)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY DEFAULT 'camp-current',
  name TEXT NOT NULL DEFAULT 'Service Master of the Month - Petron San Pedro',
  start_date TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', NOW()),
  end_date TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second'),
  active BOOLEAN DEFAULT TRUE,
  operating_hours_start TEXT DEFAULT '06:00',
  operating_hours_end TEXT DEFAULT '22:00',
  enforce_operating_hours BOOLEAN DEFAULT TRUE,
  rapid_fire_minutes INTEGER DEFAULT 10,
  rapid_fire_max_votes INTEGER DEFAULT 5,
  duplicate_window TEXT DEFAULT 'daily', -- 'daily' or 'campaign'
  kill_switch BOOLEAN DEFAULT FALSE,     -- Emergency pause toggle
  test_mode BOOLEAN DEFAULT FALSE,       -- Test simulation toggle
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 3. Table: votes (Immutable ballot audit trail)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY DEFAULT ('vote-' || substr(md5(random()::text), 1, 12)),
  sm_id TEXT NOT NULL REFERENCES sms(id) ON DELETE CASCADE,
  voter_fingerprint TEXT NOT NULL,       -- SHA-256 cryptographic device hash
  ip_address TEXT,                       -- Voter IP address
  user_agent TEXT,                       -- Voter device User-Agent
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  mode TEXT NOT NULL CHECK(mode IN ('general', 'sm_specific')),
  branch TEXT DEFAULT 'Petron San Pedro',
  status TEXT NOT NULL DEFAULT 'valid' CHECK(status IN ('valid', 'flagged', 'rejected')),
  flag_reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  is_test BOOLEAN DEFAULT FALSE
);

-- Indexes for high-speed deduplication and anti-fraud rate checking
CREATE INDEX IF NOT EXISTS idx_votes_voter_fingerprint ON votes(voter_fingerprint);
CREATE INDEX IF NOT EXISTS idx_votes_ip_timestamp ON votes(ip_address, timestamp);
CREATE INDEX IF NOT EXISTS idx_votes_sm_id_status ON votes(sm_id, status);
CREATE INDEX IF NOT EXISTS idx_votes_timestamp ON votes(timestamp DESC);

-- -------------------------------------------------------------------------
-- 4. Table: admins (Dashboard administrative accounts)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY DEFAULT ('admin-' || substr(md5(random()::text), 1, 8)),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- -------------------------------------------------------------------------
-- 5. Table: audit_logs (Tracks administrative moderation actions)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('log-' || substr(md5(random()::text), 1, 8)),
  admin_id TEXT,
  action TEXT NOT NULL,
  target_id TEXT,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- -------------------------------------------------------------------------
ALTER TABLE sms ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read of active Service Masters at Petron San Pedro
CREATE POLICY "Public read active sms" ON sms
  FOR SELECT USING (active = true);

-- Allow public read of active campaign configuration
CREATE POLICY "Public read active campaign" ON campaigns
  FOR SELECT USING (active = true);

-- Allow service role full access to all tables
CREATE POLICY "Service role full access sms" ON sms FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access campaigns" ON campaigns FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access votes" ON votes FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access admins" ON admins FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access audit_logs" ON audit_logs FOR ALL TO service_role USING (true);

-- -------------------------------------------------------------------------
-- Initial Seed Data: Petron San Pedro Service Masters
-- -------------------------------------------------------------------------
INSERT INTO sms (id, name, photo_url, branch, station, shift, bio, device_fingerprint, ip_registered, active)
VALUES
  (
    'sm-001',
    'Carlos Mendoza',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
    'Petron San Pedro',
    'Lube Bay 1 (Fast Lube & Change Oil)',
    'Day Shift (6AM - 2PM)',
    'Fast lube specialist with 5 years experience at Petron San Pedro. Always greets customers with a smile!',
    'sm_dev_carlos_mendoza_sample_hash_9821',
    '192.168.1.101',
    true
  ),
  (
    'sm-002',
    'Maria Santos',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80',
    'Petron San Pedro',
    'Tire & Wheel Alignment Center',
    'Afternoon Shift (2PM - 10PM)',
    'Precision wheel balancer and alignment master. Safety champion of Q3.',
    'sm_dev_maria_santos_sample_hash_4412',
    '192.168.1.102',
    true
  ),
  (
    'sm-003',
    'Jerome Bautista',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    'Petron San Pedro',
    'Engine Diagnostics & Electrical Bay',
    'Day Shift (6AM - 2PM)',
    'Automotive diagnostics wizard. Solves check engine warnings accurately and transparently.',
    'sm_dev_jerome_sample_hash_8719',
    '192.168.1.103',
    true
  ),
  (
    'sm-004',
    'Angelica Ramos',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=80',
    'Petron San Pedro',
    'Express Oil Change & Filter Bay 2',
    'Day Shift (6AM - 2PM)',
    'Customer favorite for express maintenance, tire air calibration, and windscreen clean.',
    'sm_dev_angelica_sample_hash_3201',
    '192.168.1.104',
    true
  ),
  (
    'sm-005',
    'Rafael Dalisay',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
    'Petron San Pedro',
    'Brake & Heavy Mechanical Bay',
    'Day Shift (6AM - 2PM)',
    'Master certified brake and suspension technician. 100% first-time fix rate.',
    'sm_dev_rafael_sample_hash_6541',
    '192.168.1.105',
    true
  ),
  (
    'sm-006',
    'Kristine Joy Valdez',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
    'Petron San Pedro',
    'Customer Reception & Inspection Bay',
    'Day Shift (6AM - 2PM)',
    'Service advisor and quality check auditor ensuring vehicle safety before release.',
    'sm_dev_kristine_sample_hash_9012',
    '192.168.1.106',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Initial Campaign
INSERT INTO campaigns (id, name, start_date, end_date, active, operating_hours_start, operating_hours_end, enforce_operating_hours, rapid_fire_minutes, rapid_fire_max_votes, duplicate_window, kill_switch, test_mode)
VALUES (
  'camp-current',
  'Service Master of the Month - Petron San Pedro',
  date_trunc('month', NOW()),
  date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second',
  true,
  '06:00',
  '22:00',
  true,
  10,
  5,
  'daily',
  false,
  false
)
ON CONFLICT (id) DO NOTHING;
