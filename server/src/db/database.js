import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import supabase, { isSupabaseConfigured } from './supabase.js';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) {
    // Fallback for demo admin credentials
    return password === 'admin123';
  }
  const [salt, hash] = parts;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state synchronized atomically to disk and Supabase
class Database {
  constructor() {
    this.data = {
      sms: [],
      campaigns: [],
      votes: [],
      admins: [],
      audit_logs: []
    };
    this.supabaseConnected = false;
    this.init();
  }

  init() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure all tables exist
        this.data.sms = this.data.sms || [];
        this.data.campaigns = this.data.campaigns || [];
        this.data.votes = this.data.votes || [];
        this.data.admins = this.data.admins || [];
        this.data.audit_logs = this.data.audit_logs || [];
      } catch (err) {
        console.error('Error loading db.json, creating fresh store:', err.message);
        this.seedDefaults();
      }
    } else {
      this.seedDefaults();
    }

    // Connect & synchronize live with Supabase in the background
    this.syncWithSupabase().catch(err => {
      console.warn('[Database] Initial Supabase sync deferred:', err.message);
    });
  }

  async syncWithSupabase() {
    if (!isSupabaseConfigured()) {
      console.log('[Database] Supabase is not configured. Running in local JSON storage mode.');
      return false;
    }

    try {
      console.log(`[Database] Connecting to Supabase (${process.env.SUPABASE_URL})...`);

      // 1. Sync Service Masters
      const sbSMs = await supabase.select('sms', 'order=name.asc');
      if (Array.isArray(sbSMs)) {
        this.data.sms = sbSMs;
        console.log(`[Supabase] Loaded ${sbSMs.length} Service Masters from Supabase.`);
      }

      // 2. Sync Campaigns
      const sbCampaigns = await supabase.select('campaigns');
      if (Array.isArray(sbCampaigns) && sbCampaigns.length > 0) {
        this.data.campaigns = sbCampaigns;
        console.log(`[Supabase] Loaded active campaign '${sbCampaigns[0].name}' from Supabase.`);
      }

      // 3. Sync Admins
      const sbAdmins = await supabase.select('admins');
      if (Array.isArray(sbAdmins) && sbAdmins.length > 0) {
        this.data.admins = sbAdmins;
        console.log(`[Supabase] Loaded ${sbAdmins.length} admin accounts from Supabase.`);
      }

      // 4. Sync Votes
      const sbVotes = await supabase.select('votes', 'order=timestamp.desc');
      if (Array.isArray(sbVotes)) {
        this.data.votes = sbVotes;
        console.log(`[Supabase] Loaded ${sbVotes.length} historical votes from Supabase.`);
      }

      this.save();
      this.supabaseConnected = true;
      console.log('=============================================================');
      console.log('  [Supabase] LIVE SYNC COMPLETE: APP CONNECTED TO SUPABASE!  ');
      console.log(`  Database URL: ${process.env.SUPABASE_URL}`);
      console.log(`  Service Masters: ${this.data.sms.length}`);
      console.log(`  Votes: ${this.data.votes.length}`);
      console.log('=============================================================');
      return true;
    } catch (err) {
      console.error('[Supabase Sync Error]:', err.message);
      this.supabaseConnected = false;
      return false;
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db.json:', err.message);
    }
  }

  seedDefaults() {
    const defaultPasswordHash = hashPassword('admin123');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const sampleSMs = [
      {
        id: 'sm-001',
        name: 'Carlos Mendoza',
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
        branch: 'Petron San Pedro',
        station: 'Lube Bay 1 (Fast Lube)',
        shift: 'Day Shift (6AM - 2PM)',
        bio: 'Fast lube specialist with 5 years experience at Petron San Pedro. Always greets customers with a smile!',
        device_fingerprint: 'sm_dev_carlos_mendoza_sample_hash_9821',
        ip_registered: '192.168.1.101',
        active: true,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'sm-002',
        name: 'Maria Santos',
        photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80',
        branch: 'Petron San Pedro',
        station: 'Tire & Wheel Alignment Bay',
        shift: 'Afternoon Shift (2PM - 10PM)',
        bio: 'Precision wheel balancer and alignment master. Safety champion of Q3.',
        device_fingerprint: 'sm_dev_maria_santos_sample_hash_4412',
        ip_registered: '192.168.1.102',
        active: true,
        created_at: new Date(Date.now() - 25 * 86400000).toISOString()
      },
      {
        id: 'sm-003',
        name: 'Jerome Bautista',
        photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
        branch: 'Petron San Pedro',
        station: 'Engine Diagnostics & Electrical Bay',
        shift: 'Day Shift (6AM - 2PM)',
        bio: 'Automotive diagnostics wizard. Solves check engine lights before you finish coffee.',
        device_fingerprint: 'sm_dev_jerome_sample_hash_8719',
        ip_registered: '192.168.1.103',
        active: true,
        created_at: new Date(Date.now() - 20 * 86400000).toISOString()
      },
      {
        id: 'sm-004',
        name: 'Angelica Ramos',
        photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=80',
        branch: 'Petron San Pedro',
        station: 'Express Oil Change Bay 2',
        shift: 'Day Shift (6AM - 2PM)',
        bio: 'Customer favorite for express maintenance, tire air calibration, and windscreen clean.',
        device_fingerprint: 'sm_dev_angelica_sample_hash_3201',
        ip_registered: '192.168.1.104',
        active: true,
        created_at: new Date(Date.now() - 15 * 86400000).toISOString()
      },
      {
        id: 'sm-005',
        name: 'Rafael Dalisay',
        photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
        branch: 'Petron San Pedro',
        station: 'Brake & Heavy Mechanical Bay',
        shift: 'Day Shift (6AM - 2PM)',
        bio: 'Master certified brake and suspension specialist. 100% first-time fix rate.',
        device_fingerprint: 'sm_dev_rafael_sample_hash_6541',
        ip_registered: '192.168.1.105',
        active: true,
        created_at: new Date(Date.now() - 10 * 86400000).toISOString()
      },
      {
        id: 'sm-006',
        name: 'Kristine Joy Valdez',
        photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
        branch: 'Petron San Pedro',
        station: 'Customer Reception & Inspection Bay',
        shift: 'Day Shift (6AM - 2PM)',
        bio: 'Service quality auditor ensuring every vehicle leaves factory-sharp.',
        device_fingerprint: 'sm_dev_kristine_sample_hash_9012',
        ip_registered: '192.168.1.106',
        active: true,
        created_at: new Date(Date.now() - 5 * 86400000).toISOString()
      }
    ];

    const campaign = {
      id: 'camp-current',
      name: `Service Master of the Month - Petron San Pedro`,
      start_date: startOfMonth,
      end_date: endOfMonth,
      active: true,
      operating_hours_start: '06:00',
      operating_hours_end: '22:00',
      enforce_operating_hours: true,
      rapid_fire_minutes: 10,
      rapid_fire_max_votes: 5,
      duplicate_window: 'daily',
      kill_switch: false,
      test_mode: false,
      created_at: now.toISOString()
    };

    const admin = {
      id: 'admin-001',
      username: 'admin',
      password_hash: defaultPasswordHash,
      name: 'Petron San Pedro Admin',
      role: 'superadmin',
      created_at: now.toISOString(),
      last_login: null
    };

    // Pre-populate some realistic initial votes for Petron San Pedro
    const sampleVotes = [
      {
        id: 'vote-1001',
        sm_id: 'sm-001',
        voter_fingerprint: 'fp_voter_client_a9821048b',
        ip_address: '112.198.102.14',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
        timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
        mode: 'general',
        branch: 'Petron San Pedro',
        status: 'valid',
        flag_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        review_notes: null,
        is_test: false
      },
      {
        id: 'vote-1002',
        sm_id: 'sm-001',
        voter_fingerprint: 'fp_voter_client_b4719283c',
        ip_address: '112.198.102.35',
        user_agent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B)',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        mode: 'sm_specific',
        branch: 'Petron San Pedro',
        status: 'valid',
        flag_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        review_notes: null,
        is_test: false
      },
      {
        id: 'vote-1003',
        sm_id: 'sm-002',
        voter_fingerprint: 'fp_voter_client_c1829471f',
        ip_address: '175.176.44.20',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        mode: 'sm_specific',
        branch: 'Petron San Pedro',
        status: 'valid',
        flag_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        review_notes: null,
        is_test: false
      },
      {
        id: 'vote-1004',
        sm_id: 'sm-003',
        voter_fingerprint: 'fp_voter_client_d9918234e',
        ip_address: '120.28.199.88',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
        mode: 'general',
        branch: 'Petron San Pedro',
        status: 'valid',
        flag_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        review_notes: null,
        is_test: false
      },
      {
        id: 'vote-1005',
        sm_id: 'sm-001',
        voter_fingerprint: 'sm_dev_carlos_mendoza_sample_hash_9821',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Linux; Android 13; SM-A536B)',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        mode: 'sm_specific',
        branch: 'Petron San Pedro',
        status: 'flagged',
        flag_reason: 'possible_self_vote (device fingerprint matched SM registered profile)',
        reviewed_by: null,
        reviewed_at: null,
        review_notes: null,
        is_test: false
      }
    ];

    this.data = {
      sms: sampleSMs,
      campaigns: [campaign],
      votes: sampleVotes,
      admins: [admin],
      audit_logs: [
        {
          id: 'log-001',
          admin_id: 'system',
          action: 'SYSTEM_INITIALIZED',
          target_id: 'system',
          details: 'Initialized Service Master Voting System with 6 SMs and default security rules',
          timestamp: now.toISOString()
        }
      ]
    };

    this.save();
    console.log('Database initialized with default schema & sample data');
  }

  // --- Service Masters Queries ---
  getSMs(filter = {}) {
    let result = [...this.data.sms];
    if (filter.active !== undefined) {
      result = result.filter(sm => sm.active === filter.active);
    }
    if (filter.branch) {
      result = result.filter(sm => sm.branch.toLowerCase() === filter.branch.toLowerCase());
    }
    return result;
  }

  getSMById(id) {
    return this.data.sms.find(sm => sm.id === id);
  }

  createSM(smData) {
    const newSM = {
      id: smData.id || `sm-${Date.now().toString(36)}`,
      name: smData.name,
      photo_url: smData.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80',
      branch: smData.branch || 'Petron San Pedro',
      station: smData.station || 'Bay 1',
      shift: smData.shift || 'Day Shift',
      bio: smData.bio || '',
      device_fingerprint: smData.device_fingerprint || null,
      ip_registered: smData.ip_registered || null,
      active: smData.active !== undefined ? smData.active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.sms.push(newSM);
    this.save();

    if (isSupabaseConfigured()) {
      supabase.insert('sms', newSM).catch(err =>
        console.error('[Supabase SM Insert Error]:', err.message)
      );
    }

    return newSM;
  }

  updateSM(id, updates) {
    const index = this.data.sms.findIndex(sm => sm.id === id);
    if (index === -1) return null;
    this.data.sms[index] = {
      ...this.data.sms[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();

    if (isSupabaseConfigured()) {
      supabase.update('sms', id, { ...updates, updated_at: new Date().toISOString() }).catch(err =>
        console.error('[Supabase SM Update Error]:', err.message)
      );
    }

    return this.data.sms[index];
  }

  deleteSM(id) {
    const index = this.data.sms.findIndex(sm => sm.id === id);
    if (index === -1) return false;
    this.data.sms.splice(index, 1);
    this.save();

    if (isSupabaseConfigured()) {
      supabase.delete('sms', id).catch(err =>
        console.error('[Supabase SM Delete Error]:', err.message)
      );
    }

    return true;
  }

  // --- Campaign Queries ---
  getActiveCampaign() {
    return this.data.campaigns.find(c => c.active) || this.data.campaigns[0];
  }

  updateCampaign(id, updates) {
    const index = this.data.campaigns.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.data.campaigns[index] = {
      ...this.data.campaigns[index],
      ...updates
    };
    this.save();

    if (isSupabaseConfigured()) {
      supabase.update('campaigns', id, updates).catch(err =>
        console.error('[Supabase Campaign Update Error]:', err.message)
      );
    }

    return this.data.campaigns[index];
  }

  // --- Votes Queries ---
  createVote(voteData) {
    const vote = {
      id: voteData.id || `vote-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
      sm_id: voteData.sm_id,
      voter_fingerprint: voteData.voter_fingerprint,
      ip_address: voteData.ip_address || 'unknown',
      user_agent: voteData.user_agent || 'unknown',
      timestamp: voteData.timestamp || new Date().toISOString(),
      mode: voteData.mode || 'general',
      branch: voteData.branch || null,
      status: voteData.status || 'valid',
      flag_reason: voteData.flag_reason || null,
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      is_test: !!voteData.is_test
    };
    this.data.votes.push(vote);
    this.save();

    // Persist directly to Supabase
    if (isSupabaseConfigured()) {
      const payload = {
        id: vote.id,
        sm_id: vote.sm_id,
        voter_fingerprint: vote.voter_fingerprint,
        ip_address: vote.ip_address,
        user_agent: vote.user_agent,
        timestamp: vote.timestamp,
        mode: vote.mode,
        branch: vote.branch,
        status: vote.status,
        flag_reason: vote.flag_reason,
        reviewed_by: vote.reviewed_by,
        reviewed_at: vote.reviewed_at,
        review_notes: vote.review_notes,
        is_test: vote.is_test
      };
      supabase.insert('votes', payload).then(res => {
        if (res) console.log(`[Supabase] Vote ${vote.id} persisted to Supabase successfully.`);
      }).catch(err => {
        console.error('[Supabase Vote Save Error]:', err.message);
      });
    }

    return vote;
  }

  getVotes(filter = {}) {
    let result = [...this.data.votes];

    if (filter.status) {
      result = result.filter(v => v.status === filter.status);
    }
    if (filter.sm_id) {
      result = result.filter(v => v.sm_id === filter.sm_id);
    }
    if (filter.branch) {
      result = result.filter(v => v.branch && v.branch.toLowerCase() === filter.branch.toLowerCase());
    }
    if (filter.mode) {
      result = result.filter(v => v.mode === filter.mode);
    }
    if (filter.excludeTest) {
      result = result.filter(v => !v.is_test);
    }
    if (filter.startDate) {
      const start = new Date(filter.startDate);
      result = result.filter(v => new Date(v.timestamp) >= start);
    }
    if (filter.endDate) {
      const end = new Date(filter.endDate);
      result = result.filter(v => new Date(v.timestamp) <= end);
    }

    // Attach SM metadata for ease of frontend consumption
    return result.map(v => {
      const sm = this.getSMById(v.sm_id);
      return {
        ...v,
        sm_name: sm ? sm.name : 'Unknown SM',
        sm_branch: sm ? sm.branch : (v.branch || 'Unknown Branch'),
        sm_photo: sm ? sm.photo_url : null
      };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getVoteById(id) {
    return this.data.votes.find(v => v.id === id);
  }

  updateVoteStatus(id, { status, reviewed_by, review_notes }) {
    const vote = this.data.votes.find(v => v.id === id);
    if (!vote) return null;
    vote.status = status;
    vote.reviewed_by = reviewed_by || 'admin';
    vote.reviewed_at = new Date().toISOString();
    if (review_notes !== undefined) vote.review_notes = review_notes;
    this.save();

    if (isSupabaseConfigured()) {
      supabase.update('votes', id, {
        status: vote.status,
        reviewed_by: vote.reviewed_by,
        reviewed_at: vote.reviewed_at,
        review_notes: vote.review_notes
      }).catch(err => console.error('[Supabase Vote Status Update Error]:', err.message));
    }

    return vote;
  }

  // Counts votes from an IP in the last X minutes
  countVotesLastMinutesByIP(ip, minutes) {
    if (!ip || ip === 'unknown') return 0;
    const cutoff = new Date(Date.now() - minutes * 60000);
    return this.data.votes.filter(v => 
      v.ip_address === ip && 
      new Date(v.timestamp) >= cutoff
    ).length;
  }

  // Check if voter fingerprint already voted today or in campaign
  hasVotedInWindow(fingerprint, windowType = 'daily') {
    if (!fingerprint) return false;
    const now = new Date();
    let cutoff;

    if (windowType === 'daily') {
      // Start of current day (midnight local time)
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else {
      // Current campaign start
      const campaign = this.getActiveCampaign();
      cutoff = new Date(campaign.start_date);
    }

    return this.data.votes.some(v => 
      v.voter_fingerprint === fingerprint && 
      v.status !== 'rejected' &&
      !v.is_test &&
      new Date(v.timestamp) >= cutoff
    );
  }

  // --- Admin Queries ---
  getAdminByUsername(username) {
    return this.data.admins.find(a => a.username === username);
  }

  updateAdminLogin(id) {
    const admin = this.data.admins.find(a => a.id === id);
    if (admin) {
      admin.last_login = new Date().toISOString();
      this.save();

      if (isSupabaseConfigured()) {
        supabase.update('admins', id, { last_login: admin.last_login }).catch(err =>
          console.error('[Supabase Admin Login Update Error]:', err.message)
        );
      }
    }
  }

  // --- Audit Logs ---
  logAction({ admin_id, action, target_id, details }) {
    const log = {
      id: `log-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
      admin_id: admin_id || 'system',
      action,
      target_id: target_id || null,
      details: typeof details === 'object' ? JSON.stringify(details) : String(details),
      timestamp: new Date().toISOString()
    };
    this.data.audit_logs.push(log);
    this.save();

    if (isSupabaseConfigured()) {
      supabase.insert('audit_logs', log).catch(err =>
        console.error('[Supabase Audit Log Error]:', err.message)
      );
    }

    return log;
  }

  getAuditLogs(limit = 100) {
    return [...this.data.audit_logs]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  getStatus() {
    return {
      connected: this.supabaseConnected || isSupabaseConfigured(),
      provider: 'supabase',
      database_url: process.env.SUPABASE_URL || 'local-fallback',
      sms_count: this.data.sms.length,
      votes_count: this.data.votes.length,
      campaign: this.getActiveCampaign()?.name || 'Active'
    };
  }
}

export const db = new Database();
export default db;
