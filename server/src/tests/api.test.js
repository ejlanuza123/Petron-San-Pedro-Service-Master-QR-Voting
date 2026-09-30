import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import db from '../db/database.js';
import QRService from '../services/qrService.js';

describe('Database and Services Verification', () => {
  test('Database seeds SMs and default admin successfully', () => {
    const sms = db.getSMs();
    assert.ok(sms.length >= 1, 'Should have at least 1 SM in the database');

    const admin = db.getAdminByUsername('admin');
    assert.ok(admin, 'Default admin account should exist');
    assert.equal(admin.role, 'superadmin');
  });

  test('Database filters votes by status and mode correctly', () => {
    const allVotes = db.getVotes();
    assert.ok(allVotes.length > 0, 'Should return votes');

    const validVotes = db.getVotes({ status: 'valid' });
    const flaggedVotes = db.getVotes({ status: 'flagged' });

    assert.ok(validVotes.every(v => v.status === 'valid'));
    assert.ok(flaggedVotes.every(v => v.status === 'flagged'));
  });

  test('QRService generates valid Data URLs for General and SM modes', async () => {
    const sms = db.getSMs();
    const targetSMId = sms[0]?.id || 'sm-test-1';

    const generalQR = await QRService.generateGeneralVotingQR('http://localhost:3000');
    assert.ok(generalQR.qrDataUrl.startsWith('data:image/svg+xml;base64,'));
    assert.ok(generalQR.svg.includes('<svg') && generalQR.svg.includes('</svg>'));
    assert.equal(generalQR.targetUrl, 'http://localhost:3000/vote');

    const smQR = await QRService.generateSMVotingQR('http://localhost:3000', targetSMId);
    assert.ok(smQR.qrDataUrl.startsWith('data:image/svg+xml;base64,'));
    assert.ok(smQR.svg.includes('<svg') && smQR.svg.includes('</svg>'));
    assert.equal(smQR.targetUrl, `http://localhost:3000/vote/sm/${encodeURIComponent(targetSMId)}`);
  });

  test('QRService generates valid Staff Device Pairing QR', async () => {
    const sms = db.getSMs();
    const targetSMId = sms[0]?.id || 'sm-test-1';
    const pairingQR = await QRService.generateDevicePairingQR('http://localhost:3000', targetSMId, 'test-token-123');

    assert.ok(pairingQR.qrDataUrl.startsWith('data:image/svg+xml;base64,'));
    assert.ok(pairingQR.svg.includes('<svg') && pairingQR.svg.includes('</svg>'));
    assert.ok(pairingQR.targetUrl.includes(`/pair-device?id=${encodeURIComponent(targetSMId)}&token=test-token-123`));
  });

  test('Pairing token generation and verification works reliably', async () => {
    const { generatePairingToken, verifyPairingToken } = await import('../middleware/auth.js');
    const smId = 'sm-test-nominee-99';
    const token = generatePairingToken(smId);

    assert.ok(token && token.length === 16, 'Token should be a 16-char hex string');
    assert.equal(verifyPairingToken(smId, token), true, 'Valid token should verify');
    assert.equal(verifyPairingToken('sm-other-id', token), false, 'Token for another SM should fail');
    assert.equal(verifyPairingToken(smId, 'wrong-token-abc'), false, 'Invalid token should fail');
  });

  test('Staff device registration and fraud engine quarantine works end-to-end', async () => {
    const { default: FraudEngine } = await import('../services/fraudEngine.js');
    const campaign = db.getActiveCampaign();
    db.updateCampaign(campaign.id, {
      start_date: new Date(Date.now() - 86400000).toISOString(),
      end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      kill_switch: false,
      enforce_operating_hours: false
    });

    const sms = db.getSMs();
    const sm = sms[0];
    const originalFP = sm.device_fingerprint;
    const originalIP = sm.ip_registered;

    const staffDeviceFP = 'fp_staff_hardware_hash_' + Date.now();
    const staffIP = '192.168.10.55';

    // 1. Register staff device
    db.updateSM(sm.id, { device_fingerprint: staffDeviceFP, ip_registered: staffIP });
    const refreshedSM = db.getSMById(sm.id);
    assert.equal(refreshedSM.device_fingerprint, staffDeviceFP);

    // 2. Staff attempts to vote for themselves -> Must be FLAGGED
    const cheatResult = FraudEngine.evaluateVote({
      sm_id: sm.id,
      voter_fingerprint: staffDeviceFP,
      ip_address: staffIP,
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      mode: 'sm_specific'
    });

    assert.equal(cheatResult.status, 'flagged');
    assert.match(cheatResult.reason, /possible_self_vote/);

    // 3. Genuine customer votes for this SM -> Passes as VALID
    const customerDeviceFP = 'fp_customer_device_' + (Date.now() + 9999);
    const customerResult = FraudEngine.evaluateVote({
      sm_id: sm.id,
      voter_fingerprint: customerDeviceFP,
      ip_address: '120.28.1.5',
      user_agent: 'Mozilla/5.0 (Android 14; Mobile; rv:109.0)',
      mode: 'general'
    });

    assert.equal(customerResult.status, 'valid');
    assert.equal(customerResult.reason, null);

    // 4. Restore original SM values
    db.updateSM(sm.id, { device_fingerprint: originalFP, ip_registered: originalIP });
  });
});

describe('Vercel Serverless Functions & Subpath Routing Verification', () => {
  function createMockReqRes({ method = 'GET', url = '/', headers = {}, query = {}, body = null }) {
    const req = {
      method,
      url,
      headers: { host: 'petron-service-master-voting.vercel.app', ...headers },
      query,
      body,
      async *[Symbol.asyncIterator]() {
        if (body) {
          yield typeof body === 'string' ? body : JSON.stringify(body);
        }
      }
    };

    let statusCode = 200;
    let responseHeaders = {};
    let responseBody = '';

    const res = {
      writeHead(code, hdrs = {}) {
        statusCode = code;
        Object.entries(hdrs).forEach(([k, v]) => {
          responseHeaders[k.toLowerCase()] = v;
        });
        return res;
      },
      setHeader(name, val) {
        responseHeaders[name.toLowerCase()] = val;
      },
      end(chunk) {
        if (chunk) responseBody += chunk;
      },
      get statusCode() { return statusCode; },
      get headers() { return responseHeaders; },
      get body() {
        try {
          return JSON.parse(responseBody);
        } catch {
          return responseBody;
        }
      }
    };

    return { req, res };
  }

  test('Campaign Handler successfully executes toggle-kill-switch via subpath rewrite', async () => {
    const { default: campaignHandler } = await import('../../../api/campaign.js');
    const { generateToken } = await import('../middleware/auth.js');
    const admin = db.getAdminByUsername('admin');
    const token = generateToken({ id: admin.id, username: admin.username, role: admin.role, name: admin.name });

    const initialCampaign = db.getActiveCampaign();
    const initialKillSwitch = initialCampaign.kill_switch;

    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/campaign?subpath=toggle-kill-switch',
      query: { subpath: 'toggle-kill-switch' },
      headers: { authorization: `Bearer ${token}` }
    });

    await campaignHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.kill_switch, !initialKillSwitch);

    // Toggle back to restore
    const { req: reqRestore, res: resRestore } = createMockReqRes({
      method: 'POST',
      url: '/api/campaign?subpath=toggle-kill-switch',
      query: { subpath: 'toggle-kill-switch' },
      headers: { authorization: `Bearer ${token}` }
    });
    await campaignHandler(reqRestore, resRestore);
    assert.equal(resRestore.body.kill_switch, initialKillSwitch);
  });

  test('Campaign Handler successfully executes toggle-test-mode via subpath rewrite', async () => {
    const { default: campaignHandler } = await import('../../../api/campaign.js');
    const { generateToken } = await import('../middleware/auth.js');
    const admin = db.getAdminByUsername('admin');
    const token = generateToken({ id: admin.id, username: admin.username, role: admin.role, name: admin.name });

    const initialCampaign = db.getActiveCampaign();
    const initialTestMode = initialCampaign.test_mode;

    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/campaign?subpath=toggle-test-mode',
      query: { subpath: 'toggle-test-mode' },
      headers: { authorization: `Bearer ${token}` }
    });

    await campaignHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.test_mode, !initialTestMode);

    // Toggle back to restore
    const { req: reqRestore, res: resRestore } = createMockReqRes({
      method: 'POST',
      url: '/api/campaign?subpath=toggle-test-mode',
      query: { subpath: 'toggle-test-mode' },
      headers: { authorization: `Bearer ${token}` }
    });
    await campaignHandler(reqRestore, resRestore);
    assert.equal(resRestore.body.test_mode, initialTestMode);
  });

  test('Votes Handler successfully serves stats via subpath rewrite', async () => {
    const { default: votesHandler } = await import('../../../api/votes.js');
    const { generateToken } = await import('../middleware/auth.js');
    const admin = db.getAdminByUsername('admin');
    const token = generateToken({ id: admin.id, username: admin.username, role: admin.role, name: admin.name });

    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/votes?subpath=stats',
      query: { subpath: 'stats' },
      headers: { authorization: `Bearer ${token}` }
    });

    await votesHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(res.body.kpis);
    assert.ok(Array.isArray(res.body.leaderboard));
  });

  test('Auth Handler successfully logs in via subpath rewrite', async () => {
    const { default: authHandler } = await import('../../../api/auth.js');

    const { req, res } = createMockReqRes({
      method: 'POST',
      url: '/api/auth?subpath=login',
      query: { subpath: 'login' },
      body: { username: 'admin', password: 'admin123' }
    });

    await authHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.username, 'admin');
  });

  test('Database Handler successfully returns status via subpath rewrite', async () => {
    const { default: dbHandler } = await import('../../../api/database.js');

    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/database?subpath=status',
      query: { subpath: 'status' }
    });

    await dbHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(res.body.provider);
    assert.ok(res.body.database_url);
  });

  test('Health Handler returns online status', async () => {
    const { default: healthHandler } = await import('../../../api/health.js');

    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/health'
    });

    await healthHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'online');
  });

  test('QR Handler returns general voting QR via subpath rewrite', async () => {
    const { default: qrHandler } = await import('../../../api/qr.js');

    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/qr?subpath=general&format=json',
      query: { subpath: 'general', format: 'json' }
    });

    await qrHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(res.body.targetUrl);
    assert.ok(res.body.qrDataUrl);
  });

  test('Export Handler serves filtered votes CSV via subpath rewrite and auth header', async () => {
    const { default: exportHandler } = await import('../../../api/export.js');
    const { generateToken } = await import('../middleware/auth.js');
    const admin = db.getAdminByUsername('admin');
    const token = generateToken({ id: admin.id, username: admin.username, role: admin.role, name: admin.name });

    const { req, res } = createMockReqRes({
      method: 'GET',
      url: '/api/export?subpath=csv&status=valid',
      query: { subpath: 'csv', status: 'valid' },
      headers: { authorization: `Bearer ${token}` }
    });

    await exportHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('text/csv'));
    assert.ok(res.body.includes('Vote ID'));
    assert.ok(res.body.includes('SM Name'));
  });

  test('Export Handler verifies token via query param and serves leaderboard CSV', async () => {
    const { default: exportHandler } = await import('../../../api/export.js');
    const { generateToken } = await import('../middleware/auth.js');
    const admin = db.getAdminByUsername('admin');
    const token = generateToken({ id: admin.id, username: admin.username, role: admin.role, name: admin.name });

    const { req, res } = createMockReqRes({
      method: 'GET',
      url: `/api/export?subpath=leaderboard&branch=All&token=${token}`,
      query: { subpath: 'leaderboard', branch: 'All', token }
    });

    await exportHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('text/csv'));
    assert.ok(res.body.includes('Rank'));
    assert.ok(res.body.includes('SM Name'));
  });

  test('Export Handler serves system security audit logs CSV via subpath rewrite', async () => {
    const { default: exportHandler } = await import('../../../api/export.js');
    const { generateToken } = await import('../middleware/auth.js');
    const admin = db.getAdminByUsername('admin');
    const token = generateToken({ id: admin.id, username: admin.username, role: admin.role, name: admin.name });

    const { req, res } = createMockReqRes({
      method: 'GET',
      url: `/api/export?subpath=system-logs&token=${token}`,
      query: { subpath: 'system-logs', token }
    });

    await exportHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('text/csv'));
    assert.ok(res.body.includes('Log ID'));
    assert.ok(res.body.includes('Admin / Initiator'));
  });
});


