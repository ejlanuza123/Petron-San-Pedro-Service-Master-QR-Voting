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

