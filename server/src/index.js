import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Core domain logic & storage
import db, { hashPassword, verifyPassword } from './db/database.js';
import FraudEngine from './services/fraudEngine.js';
import QRService from './services/qrService.js';
import { generateToken, generatePairingToken, verifyPairingToken } from './middleware/auth.js';
import supabase, { isSupabaseConfigured } from './db/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

// Simple sliding window rate limiter
const ipHits = new Map();
function isRateLimited(ip, limit = 20, windowMs = 60000) {
  const now = Date.now();
  const record = ipHits.get(ip);
  if (!record || now - record.start > windowMs) {
    ipHits.set(ip, { start: now, count: 1 });
    return false;
  }
  record.count++;
  return record.count > limit;
}

// Token verification helper
function authenticate(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const bodyStr = Buffer.from(parts[1], 'base64').toString('utf-8');
    const payload = JSON.parse(bodyStr);
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Client IP resolver
function getClientIP(req) {
  const forwarded = req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip']);
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
}

// Escape CSV cell
function escapeCSV(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Helper for Vercel Serverless Function entrypoints
export function createVercelHandler(defaultPath) {
  return async function handler(req, res) {
    let subpath = '';
    if (req.query?.subpath) {
      subpath = Array.isArray(req.query.subpath) ? req.query.subpath.join('/') : req.query.subpath;
    } else if (req.query?.path) {
      subpath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    }

    const matched = req.headers && (req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-invoke-path']);

    if (matched && matched.startsWith(defaultPath)) {
      req.url = matched;
    } else if (subpath) {
      const cleanSub = String(subpath).replace(/^\//, '');
      const search = req.url && req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
      req.url = `${defaultPath}/${cleanSub}${search}`;
    } else if (!req.url || !req.url.startsWith(defaultPath)) {
      const search = req.url && req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
      req.url = defaultPath + search;
    }

    return handleRequest(req, res);
  };
}

// HTTP Server Request Handler (Supports both Node.js standalone and Vercel Serverless)
export async function handleRequest(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-origin');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Response helpers
  if (!res.json) {
    res.json = (data, statusCode = 200) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };
  }

  if (!res.error) {
    res.error = (message, statusCode = 400, code = 'ERROR') => {
      res.json({ error: code, message }, statusCode);
    };
  }

  const matchedPath = req.headers && (req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-invoke-path']);
  let rawUrl = req.url || '/';
  if ((rawUrl === '/' || rawUrl.startsWith('/api/index') || rawUrl === '/api') && matchedPath && matchedPath.startsWith('/api') && !matchedPath.startsWith('/api/index')) {
    rawUrl = matchedPath;
  }

  const parsedUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname;

  // Support Vercel serverless query subpath or path params
  const subpathParam = req.query?.subpath || req.query?.path || parsedUrl.searchParams.get('subpath') || parsedUrl.searchParams.get('path');
  if (subpathParam) {
    const subStr = Array.isArray(subpathParam) ? subpathParam.join('/') : String(subpathParam);
    const cleanSub = subStr.replace(/^\//, '');
    if (cleanSub && !pathname.endsWith('/' + cleanSub) && pathname !== '/' + cleanSub) {
      pathname = pathname.replace(/\/$/, '') + '/' + cleanSub;
    }
  }

  if (!pathname.startsWith('/api') && pathname !== '/' && !pathname.includes('.')) {
    pathname = '/api' + pathname;
  }

  const method = req.method;
  const ip = getClientIP(req);

  // Parse body safely (supports Vercel pre-parsed JSON and raw Node stream)
  let body = {};
  if (req.body && typeof req.body === 'object') {
    body = req.body;
  } else if (typeof req.body === 'string') {
    try { body = JSON.parse(req.body); } catch {}
  } else if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    let bodyData = '';
    for await (const chunk of req) {
      bodyData += chunk;
    }
    if (bodyData) {
      try { body = JSON.parse(bodyData); } catch {}
    }
  }

  console.log(`[${new Date().toISOString()}] ${method} ${pathname}`);

    // --- API ROUTING ---

    // 1. Health
    if (pathname === '/api/health' && method === 'GET') {
      return res.json({
        status: 'online',
        service: 'Service Master QR Voting System API',
        timestamp: new Date().toISOString()
      });
    }

    // 1b. Database Status (Supabase)
    if (pathname === '/api/database/status' && method === 'GET') {
      return res.json(db.getStatus());
    }

    // 1c. Sync Database Live from Supabase
    if (pathname === '/api/database/sync' && (method === 'POST' || method === 'GET')) {
      const ok = await db.syncWithSupabase();
      return res.json({ success: ok, status: db.getStatus() });
    }

    // 2. Auth: Login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const { username, password } = body;
      if (!username || !password) {
        return res.error('Username and password are required', 400, 'MISSING_FIELDS');
      }
      const admin = db.getAdminByUsername(username);
      if (!admin || !verifyPassword(password, admin.password_hash)) {
        return res.error('Invalid username or password', 401, 'INVALID_CREDENTIALS');
      }
      db.updateAdminLogin(admin.id);
      db.logAction({
        admin_id: admin.id,
        action: 'ADMIN_LOGIN',
        target_id: admin.id,
        details: `Admin ${admin.username} logged in successfully`
      });
      const token = generateToken({
        id: admin.id,
        username: admin.username,
        role: admin.role,
        name: admin.name
      });
      return res.json({
        token,
        user: { id: admin.id, username: admin.username, name: admin.name, role: admin.role }
      });
    }

    // 2b. Auth: Me
    if (pathname === '/api/auth/me' && method === 'GET') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      const admin = db.getAdminByUsername(user.username);
      if (!admin) return res.error('Admin not found', 404, 'NOT_FOUND');
      return res.json({ user: { id: admin.id, username: admin.username, name: admin.name, role: admin.role } });
    }

    // 3. Campaign & Status
    if (pathname === '/api/campaign' && method === 'GET') {
      const campaign = db.getActiveCampaign();
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeVal = currentHours * 60 + currentMinutes;

      const [startH, startM] = (campaign.operating_hours_start || '06:00').split(':').map(Number);
      const [endH, endM] = (campaign.operating_hours_end || '22:00').split(':').map(Number);
      const isWithinHours = !campaign.enforce_operating_hours || (currentTimeVal >= startH * 60 + startM && currentTimeVal <= endH * 60 + endM);
      const isWithinWindow = now >= new Date(campaign.start_date) && now <= new Date(campaign.end_date);
      const isVotingOpen = !campaign.kill_switch && isWithinHours && isWithinWindow;

      return res.json({
        campaign,
        status: {
          is_voting_open: isVotingOpen,
          kill_switch_active: campaign.kill_switch,
          is_within_hours: isWithinHours,
          is_within_window: isWithinWindow,
          test_mode: campaign.test_mode
        }
      });
    }

    if (pathname === '/api/campaign' && method === 'PUT') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      const current = db.getActiveCampaign();
      const updated = db.updateCampaign(current.id, body);
      db.logAction({ admin_id: user.id, action: 'UPDATE_CAMPAIGN_RULES', target_id: current.id, details: body });
      return res.json({ campaign: updated, message: 'Settings updated' });
    }

    if (pathname === '/api/campaign/toggle-kill-switch' && method === 'POST') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      const current = db.getActiveCampaign();
      const newState = !current.kill_switch;
      db.updateCampaign(current.id, { kill_switch: newState });
      return res.json({
        kill_switch: newState,
        message: newState ? 'Kill switch ENGAGED: Voting halted.' : 'Kill switch deactivated: Voting resumed.'
      });
    }

    if (pathname === '/api/campaign/toggle-test-mode' && method === 'POST') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      const current = db.getActiveCampaign();
      const newState = !current.test_mode;
      db.updateCampaign(current.id, { test_mode: newState });
      return res.json({
        test_mode: newState,
        message: newState ? 'Test Mode activated' : 'Test Mode deactivated'
      });
    }

    // 4. Service Masters (SM)
    if (pathname === '/api/sms' && method === 'GET') {
      const branch = parsedUrl.searchParams.get('branch');
      const all = parsedUrl.searchParams.get('all') === 'true';
      if (isSupabaseConfigured()) {
        const liveSMs = await supabase.select('sms', 'order=name.asc');
        if (Array.isArray(liveSMs)) {
          db.data.sms = liveSMs;
        }
      }
      const sms = db.getSMs({ active: all ? undefined : true, branch });
      return res.json({ sms });
    }

    if (pathname.startsWith('/api/sms/') && !pathname.includes('/pair-token') && method === 'GET') {
      const id = pathname.replace('/api/sms/', '');
      const sm = db.getSMById(id);
      if (!sm) return res.error('Service Master not found', 404, 'NOT_FOUND');
      return res.json({ sm });
    }

    if (pathname === '/api/sms' && method === 'POST') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      if (!body.name || !body.branch) return res.error('Name and Branch required', 400);
      const newSM = db.createSM(body);
      return res.json({ sm: newSM }, 201);
    }

    if (pathname.startsWith('/api/sms/') && method === 'PUT') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      const id = pathname.replace('/api/sms/', '');
      const updated = db.updateSM(id, body);
      if (!updated) return res.error('SM not found', 404);
      return res.json({ sm: updated });
    }

    if (pathname.startsWith('/api/sms/') && method === 'DELETE') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      const id = pathname.replace('/api/sms/', '');
      db.deleteSM(id);
      return res.json({ success: true });
    }

    // 4b. Staff Device Pairing for Anti-Self-Vote Protection
    if (pathname.startsWith('/api/sms/') && pathname.endsWith('/pair-token') && method === 'GET') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      const id = pathname.replace('/api/sms/', '').replace('/pair-token', '');
      const sm = db.getSMById(id);
      if (!sm) return res.error('Service Master not found', 404, 'NOT_FOUND');
      const token = generatePairingToken(id);
      const host = req.headers.host || `localhost:${PORT}`;
      const proto = req.headers['x-forwarded-proto'] || 'http';
      return res.json({
        sm_id: id,
        sm_name: sm.name,
        pairing_token: token,
        pairing_url: `${proto}://${host}/pair-device?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`
      });
    }

    if (pathname.startsWith('/api/sms/') && pathname.endsWith('/register-device') && method === 'POST') {
      const id = pathname.replace('/api/sms/', '').replace('/register-device', '');
      const sm = db.getSMById(id);
      if (!sm) return res.error('Service Master not found', 404, 'NOT_FOUND');

      const user = authenticate(req);
      const pairingToken = body.token || body.pairing_token || parsedUrl.searchParams.get('token');
      const isTokenValid = pairingToken && verifyPairingToken(id, pairingToken);

      if (!user && !isTokenValid) {
        return res.error('Invalid or expired pairing authorization token', 401, 'UNAUTHORIZED');
      }

      const { device_fingerprint, ip_address } = body;
      if (!device_fingerprint) {
        return res.error('Hardware device fingerprint is required', 400, 'MISSING_FINGERPRINT');
      }

      const clientIp = ip_address || ip;
      const updated = db.updateSM(id, {
        device_fingerprint,
        ip_registered: clientIp
      });

      db.logAction({
        admin_id: user ? user.id : 'staff-device-pairing',
        action: 'REGISTER_SM_DEVICE',
        target_id: id,
        details: `Registered hardware device fingerprint (${device_fingerprint.substring(0, 16)}...) for ${sm.name} (IP: ${clientIp})`
      });

      return res.json({
        success: true,
        message: `Phone successfully paired to ${sm.name}! Any self-votes will be automatically quarantined.`,
        sm: updated
      });
    }

    if (pathname.startsWith('/api/sms/') && pathname.endsWith('/unregister-device') && method === 'POST') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      const id = pathname.replace('/api/sms/', '').replace('/unregister-device', '');
      const sm = db.getSMById(id);
      if (!sm) return res.error('Service Master not found', 404, 'NOT_FOUND');

      const updated = db.updateSM(id, {
        device_fingerprint: null,
        ip_registered: null
      });

      db.logAction({
        admin_id: user.id,
        action: 'UNREGISTER_SM_DEVICE',
        target_id: id,
        details: `Unlinked hardware device registration for ${sm.name}`
      });

      return res.json({
        success: true,
        message: `Hardware device registration cleared for ${sm.name}.`,
        sm: updated
      });
    }

    // 5. Submit Vote
    if (pathname === '/api/vote' && method === 'POST') {
      if (isRateLimited(ip, 12, 60000)) {
        return res.error('Too many attempts. Please slow down.', 429, 'RATE_LIMIT');
      }

      const { sm_id, voter_fingerprint, mode } = body;
      if (!sm_id) return res.error('Please select a Service Master.', 400, 'MISSING_SM');
      if (!voter_fingerprint) return res.error('Voter verification failed.', 400, 'MISSING_FINGERPRINT');

      const evaluation = FraudEngine.evaluateVote({
        sm_id,
        voter_fingerprint,
        ip_address: ip,
        user_agent: req.headers['user-agent'] || 'unknown',
        mode: mode || 'general'
      });

      if (!evaluation.allowed) {
        return res.error(evaluation.message, 403, evaluation.error);
      }

      const targetSM = db.getSMById(sm_id);
      const campaign = db.getActiveCampaign();

      const newVote = db.createVote({
        sm_id,
        voter_fingerprint,
        ip_address: ip,
        user_agent: req.headers['user-agent'] || 'unknown',
        mode: mode || 'general',
        branch: targetSM.branch,
        status: evaluation.status,
        flag_reason: evaluation.reason,
        is_test: campaign.test_mode
      });

      return res.json({
        success: true,
        vote_id: newVote.id,
        sm_name: targetSM.name,
        sm_branch: targetSM.branch,
        status: newVote.status,
        flagged: newVote.status === 'flagged',
        is_test: newVote.is_test,
        message: newVote.status === 'flagged'
          ? 'Your vote has been received and queued for verification. Thank you!'
          : `Thank you! Your vote for ${targetSM.name} has been recorded successfully.`
      }, 201);
    }

    // 6. Admin Votes Queries & Stats
    if (pathname === '/api/votes' && method === 'GET') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      const votes = db.getVotes({
        status: parsedUrl.searchParams.get('status'),
        branch: parsedUrl.searchParams.get('branch'),
        mode: parsedUrl.searchParams.get('mode')
      });
      return res.json({ votes, count: votes.length });
    }

    if (pathname === '/api/votes/flagged' && method === 'GET') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      const flagged = db.getVotes({ status: 'flagged' });
      return res.json({ flagged, count: flagged.length });
    }

    if (pathname.match(/^\/api\/votes\/([^/]+)\/approve$/) && method === 'POST') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      const voteId = pathname.split('/')[3];
      const updated = db.updateVoteStatus(voteId, { status: 'valid', reviewed_by: user.username, review_notes: body.notes });
      return res.json({ success: true, vote: updated });
    }

    if (pathname.match(/^\/api\/votes\/([^/]+)\/reject$/) && method === 'POST') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      const voteId = pathname.split('/')[3];
      const updated = db.updateVoteStatus(voteId, { status: 'rejected', reviewed_by: user.username, review_notes: body.notes });
      return res.json({ success: true, vote: updated });
    }

    if (pathname === '/api/votes/stats' && method === 'GET') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');

      const allVotes = db.getVotes({ excludeTest: true });
      const sms = db.getSMs({ all: true });
      const validVotes = allVotes.filter(v => v.status === 'valid');

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayVotes = allVotes.filter(v => new Date(v.timestamp) >= todayStart).length;

      const tally = {};
      sms.forEach(s => {
        tally[s.id] = { sm_id: s.id, name: s.name, branch: s.branch, station: s.station, shift: s.shift, photo_url: s.photo_url, valid_votes: 0, flagged_votes: 0 };
      });

      allVotes.forEach(v => {
        if (tally[v.sm_id]) {
          if (v.status === 'valid') tally[v.sm_id].valid_votes++;
          if (v.status === 'flagged') tally[v.sm_id].flagged_votes++;
        }
      });

      const leaderboard = Object.values(tally).sort((a, b) => b.valid_votes - a.valid_votes).map((item, idx) => ({
        rank: idx + 1,
        ...item,
        percentage: validVotes.length > 0 ? ((item.valid_votes / validVotes.length) * 100).toFixed(1) : 0
      }));

      const branchCounts = {};
      validVotes.forEach(v => {
        branchCounts[v.branch || 'Other'] = (branchCounts[v.branch || 'Other'] || 0) + 1;
      });

      const dateCounts = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dateCounts[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
      }
      allVotes.forEach(v => {
        const key = new Date(v.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dateCounts[key] !== undefined) dateCounts[key]++;
      });

      return res.json({
        kpis: {
          total_votes: allVotes.length,
          valid_votes: validVotes.length,
          flagged_votes: allVotes.filter(v => v.status === 'flagged').length,
          rejected_votes: allVotes.filter(v => v.status === 'rejected').length,
          today_votes: todayVotes,
          active_sms_count: sms.filter(s => s.active).length,
          modes: {
            general: validVotes.filter(v => v.mode === 'general').length,
            sm_specific: validVotes.filter(v => v.mode === 'sm_specific').length
          }
        },
        leaderboard,
        branch_distribution: branchCounts,
        timeline_trend: dateCounts
      });
    }

    // 7. QR Generation
    if (pathname === '/api/qr/general' && method === 'GET') {
      const base = parsedUrl.searchParams.get('baseUrl') || `http://${req.headers.host || 'localhost:5000'}`;
      const data = await QRService.generateGeneralVotingQR(base);
      const format = parsedUrl.searchParams.get('format');
      const accept = req.headers['accept'] || '';
      const wantsJson = format === 'json' || (accept.includes('application/json') && !accept.includes('image/'));

      if (wantsJson) {
        return res.json(data);
      }

      const isDownload = parsedUrl.searchParams.get('download') === 'true';
      res.writeHead(200, {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
        'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="general-voting-qr.svg"`
      });
      return res.end(data.svg);
    }

    if (pathname.startsWith('/api/qr/sm/') && method === 'GET') {
      const smId = pathname.replace('/api/qr/sm/', '');
      const sm = db.getSMById(smId);
      if (!sm) return res.error('SM not found', 404);
      const base = parsedUrl.searchParams.get('baseUrl') || `http://${req.headers.host || 'localhost:5000'}`;
      const data = await QRService.generateSMVotingQR(base, sm.id);
      const format = parsedUrl.searchParams.get('format');
      const accept = req.headers['accept'] || '';
      const wantsJson = format === 'json' || (accept.includes('application/json') && !accept.includes('image/'));

      if (wantsJson) {
        return res.json({ ...data, sm });
      }

      const isDownload = parsedUrl.searchParams.get('download') === 'true';
      const safeName = sm.name ? sm.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : sm.id;
      res.writeHead(200, {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
        'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="petron-badge-${safeName}-qr.svg"`
      });
      return res.end(data.svg);
    }

    if (pathname.startsWith('/api/qr/pair/') && method === 'GET') {
      const smId = pathname.replace('/api/qr/pair/', '');
      const sm = db.getSMById(smId);
      if (!sm) return res.error('Service Master not found', 404, 'NOT_FOUND');

      const token = parsedUrl.searchParams.get('token') || generatePairingToken(smId);
      const base = parsedUrl.searchParams.get('baseUrl') || `http://${req.headers.host || 'localhost:5000'}`;
      const data = await QRService.generateDevicePairingQR(base, smId, token);

      const format = parsedUrl.searchParams.get('format');
      const accept = req.headers['accept'] || '';
      const wantsJson = format === 'json' || (accept.includes('application/json') && !accept.includes('image/'));

      if (wantsJson) {
        return res.json({ ...data, sm, pairing_token: token });
      }

      const isDownload = parsedUrl.searchParams.get('download') === 'true';
      const safeName = sm.name ? sm.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : sm.id;
      res.writeHead(200, {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
        'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="petron-pair-${safeName}-qr.svg"`
      });
      return res.end(data.svg);
    }

    if (pathname === '/api/qr/all-sms' && method === 'GET') {
      const sms = db.getSMs({ active: true });
      const base = parsedUrl.searchParams.get('baseUrl') || `http://${req.headers.host || 'localhost:5000'}`;
      const batch = await Promise.all(sms.map(async s => {
        const qr = await QRService.generateSMVotingQR(base, s.id);
        return { sm: s, targetUrl: qr.targetUrl, qrDataUrl: qr.qrDataUrl, svg: qr.svg };
      }));
      return res.json({ count: batch.length, batch });
    }

    // 8. Exports (CSV)
    if (pathname === '/api/export/csv' && method === 'GET') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      const votes = db.getVotes();
      const headers = ['Vote ID', 'SM Name', 'Branch', 'Timestamp', 'Mode', 'Status', 'Flag Reason', 'Fingerprint', 'IP Address', 'User Agent'];
      const rows = votes.map(v => [
        escapeCSV(v.id), escapeCSV(v.sm_name), escapeCSV(v.sm_branch), escapeCSV(v.timestamp),
        escapeCSV(v.mode), escapeCSV(v.status), escapeCSV(v.flag_reason || ''), escapeCSV(v.voter_fingerprint),
        escapeCSV(v.ip_address), escapeCSV(v.user_agent)
      ].join(','));
      const csv = [headers.join(','), ...rows].join('\r\n');
      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="votes-audit-${Date.now()}.csv"`
      });
      return res.end(csv);
    }

    if (pathname === '/api/export/leaderboard' && method === 'GET') {
      const user = authenticate(req);
      if (!user) return res.error('Unauthorized', 401, 'UNAUTHORIZED');
      const votes = db.getVotes({ excludeTest: true });
      const sms = db.getSMs({ all: true });
      const validVotes = votes.filter(v => v.status === 'valid');

      const tally = {};
      sms.forEach(s => { tally[s.id] = { name: s.name, branch: s.branch, station: s.station, valid: 0, total: 0 }; });
      votes.forEach(v => {
        if (tally[v.sm_id]) {
          tally[v.sm_id].total++;
          if (v.status === 'valid') tally[v.sm_id].valid++;
        }
      });
      const sorted = Object.values(tally).sort((a, b) => b.valid - a.valid);
      const headers = ['Rank', 'SM Name', 'Branch', 'Station', 'Valid Votes', 'Total Received', 'Share %'];
      const rows = sorted.map((row, idx) => {
        const share = validVotes.length > 0 ? ((row.valid / validVotes.length) * 100).toFixed(2) : '0.00';
        return [idx + 1, escapeCSV(row.name), escapeCSV(row.branch), escapeCSV(row.station), row.valid, row.total, `"${share}%"`].join(',');
      });
      const csv = [headers.join(','), ...rows].join('\r\n');
      res.writeHead(200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="sm-leaderboard-${Date.now()}.csv"`
      });
      return res.end(csv);
    }

    // Static Frontend Serving (if built in client/dist)
    const distPath = path.join(__dirname, '../../client/dist');
    if (fs.existsSync(distPath)) {
      let filePath = path.join(distPath, pathname === '/' ? 'index.html' : pathname);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distPath, 'index.html');
      }
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.json': 'application/json'
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        return res.end(fs.readFileSync(filePath));
      }
    }

    // 404 for unhandled routes
    return res.error(`Route ${method} ${pathname} not found`, 404, 'NOT_FOUND');
}

// HTTP Server
export const server = http.createServer(handleRequest);

// Only listen if executed directly (e.g. node src/index.js), not inside Vercel serverless functions
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (!process.env.VERCEL && isDirectRun) {
  server.listen(PORT, () => {
    console.log(`
=============================================================
  Service Master QR Voting System - Enterprise Server
  Status: ONLINE
  Listening on: http://localhost:${PORT}
  Environment: ${process.env.NODE_ENV || 'production'}
=============================================================
    `);
  });
}

export default server;

