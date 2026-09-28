import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import db from '../db/database.js';
import QRService from '../services/qrService.js';

describe('Database and Services Verification', () => {
  test('Database seeds SMs and default admin successfully', () => {
    const sms = db.getSMs();
    assert.ok(sms.length >= 6, 'Should have at least 6 pre-seeded SMs');

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
    const generalQR = await QRService.generateGeneralVotingQR('http://localhost:3000');
    assert.ok(generalQR.qrDataUrl.startsWith('data:image/'));
    assert.equal(generalQR.targetUrl, 'http://localhost:3000/vote');

    const smQR = await QRService.generateSMVotingQR('http://localhost:3000', 'sm-001');
    assert.ok(smQR.qrDataUrl.startsWith('data:image/'));
    assert.equal(smQR.targetUrl, 'http://localhost:3000/vote/sm/sm-001');
  });
});
