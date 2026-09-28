-- QR-Based Voting System for Service Master (SM) of the Month
-- Database Schema (PostgreSQL / Supabase / SQLite compatible)

-- 1. Service Masters (SM)
CREATE TABLE IF NOT EXISTS sms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  branch TEXT NOT NULL,
  station TEXT DEFAULT 'Bay 1',
  shift TEXT DEFAULT 'Day Shift',
  bio TEXT,
  device_fingerprint TEXT,       -- Registered device fingerprint to catch self-voting
  ip_registered TEXT,            -- Registered IP address to catch self-voting
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Campaigns & System Rules
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  operating_hours_start TEXT DEFAULT '06:00',
  operating_hours_end TEXT DEFAULT '22:00',
  enforce_operating_hours BOOLEAN DEFAULT TRUE,
  rapid_fire_minutes INTEGER DEFAULT 10,
  rapid_fire_max_votes INTEGER DEFAULT 5,
  duplicate_window TEXT DEFAULT 'daily', -- 'daily' or 'campaign'
  kill_switch BOOLEAN DEFAULT FALSE,     -- Emergency pause
  test_mode BOOLEAN DEFAULT FALSE,       -- Test simulation mode
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Votes Table with Audit Columns
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  sm_id TEXT NOT NULL REFERENCES sms(id) ON DELETE CASCADE,
  voter_fingerprint TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  mode TEXT NOT NULL CHECK(mode IN ('general', 'sm_specific')),
  branch TEXT,
  status TEXT NOT NULL DEFAULT 'valid' CHECK(status IN ('valid', 'flagged', 'rejected')),
  flag_reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  is_test BOOLEAN DEFAULT FALSE
);

-- 4. Admins
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- 5. Audit Log (Tracks administrative actions)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT,
  action TEXT NOT NULL,
  target_id TEXT,
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast queries and anti-fraud checks
CREATE INDEX IF NOT EXISTS idx_votes_voter_fingerprint ON votes(voter_fingerprint);
CREATE INDEX IF NOT EXISTS idx_votes_ip_address ON votes(ip_address);
CREATE INDEX IF NOT EXISTS idx_votes_timestamp ON votes(timestamp);
CREATE INDEX IF NOT EXISTS idx_votes_status ON votes(status);
CREATE INDEX IF NOT EXISTS idx_votes_sm_id ON votes(sm_id);
