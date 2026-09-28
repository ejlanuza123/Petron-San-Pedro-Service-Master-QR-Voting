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
});
