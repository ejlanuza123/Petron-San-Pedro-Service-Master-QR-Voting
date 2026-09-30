import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import db from '../db/database.js';
import FraudEngine from '../services/fraudEngine.js';

describe('FraudEngine - Anti-Cheat Security Rules', () => {
  let testSM;
  beforeEach(() => {
    // Reset or ensure campaign rules are standard for tests
    const campaign = db.getActiveCampaign();
    db.updateCampaign(campaign.id, {
      start_date: new Date(Date.now() - 86400000).toISOString(),
      end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      kill_switch: false,
      test_mode: false,
      enforce_operating_hours: false, // disable hours check for repeatable test runs
      duplicate_window: 'daily',
      rapid_fire_minutes: 10,
      rapid_fire_max_votes: 5
    });

    testSM = db.getSMs()[0];
    if (!testSM) {
      testSM = db.createSM({
        name: 'Rodrigo Lanuza III',
        branch: 'Petron San Pedro',
        station: 'Diesel',
        shift: 'Day Shift (6AM - 2PM)',
        device_fingerprint: 'test_dev_hash_rodrigo_lanuza_99',
        ip_registered: '192.168.1.101'
      });
    } else {
      if (!testSM.device_fingerprint) testSM.device_fingerprint = 'test_dev_hash_rodrigo_lanuza_99';
      if (!testSM.ip_registered) testSM.ip_registered = '192.168.1.101';
    }
  });

  test('Rule: Valid vote from a regular customer passes as valid', () => {
    const sm = testSM;
    const result = FraudEngine.evaluateVote({
      sm_id: sm.id,
      voter_fingerprint: `fp_test_unique_customer_${Date.now()}_${Math.random()}`,
      ip_address: '180.190.10.5',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      mode: 'general'
    });

    assert.equal(result.allowed, true);
    assert.equal(result.status, 'valid');
    assert.equal(result.reason, null);
  });

  test('Rule: Emergency Kill Switch blocks vote immediately', () => {
    const campaign = db.getActiveCampaign();
    db.updateCampaign(campaign.id, { kill_switch: true });

    const result = FraudEngine.evaluateVote({
      sm_id: testSM.id,
      voter_fingerprint: `fp_kill_switch_test_${Date.now()}`,
      ip_address: '180.190.10.6',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      mode: 'general'
    });

    assert.equal(result.allowed, false);
    assert.equal(result.error, 'VOTING_SUSPENDED');

    // restore
    db.updateCampaign(campaign.id, { kill_switch: false });
  });

  test('Rule: Self-Voting detection by device fingerprint flags vote', () => {
    const sm = testSM;
    assert.ok(sm.device_fingerprint, 'SM should have a registered device fingerprint');

    const result = FraudEngine.evaluateVote({
      sm_id: sm.id,
      voter_fingerprint: sm.device_fingerprint, // Matches SM's registered phone
      ip_address: '180.190.200.5',
      user_agent: 'Mozilla/5.0 (Android 14; Mobile)',
      mode: 'sm_specific'
    });

    assert.equal(result.allowed, true);
    assert.equal(result.status, 'flagged');
    assert.match(result.reason, /possible_self_vote/);
  });

  test('Rule: Self-Voting detection by registered IP flags vote', () => {
    const sm = testSM;
    assert.ok(sm.ip_registered, 'SM should have a registered IP address');

    const result = FraudEngine.evaluateVote({
      sm_id: sm.id,
      voter_fingerprint: `fp_non_matching_voter_${Date.now()}`,
      ip_address: sm.ip_registered, // Matches SM's registered home/work IP
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      mode: 'sm_specific'
    });

    assert.equal(result.allowed, true);
    assert.equal(result.status, 'flagged');
    assert.match(result.reason, /possible_self_vote/);
  });

  test('Rule: Duplicate vote on same day is blocked', () => {
    const sm = testSM;
    const fixedFingerprint = `fp_duplicate_test_client_${Date.now()}`;

    // Cast first vote
    db.createVote({
      sm_id: sm.id,
      voter_fingerprint: fixedFingerprint,
      ip_address: '122.54.10.1',
      status: 'valid'
    });

    // Attempt second vote with same fingerprint
    const result = FraudEngine.evaluateVote({
      sm_id: sm.id,
      voter_fingerprint: fixedFingerprint,
      ip_address: '122.54.10.1',
      user_agent: 'Mozilla/5.0',
      mode: 'general'
    });

    assert.equal(result.allowed, false);
    assert.equal(result.error, 'ALREADY_VOTED');
  });

  test('Rule: Rapid-fire voting from same IP is flagged', () => {
    const testIP = `10.99.88.${Math.floor(Math.random() * 200) + 1}`;
    const sm = testSM;

    // Insert 5 votes from this IP within the last 2 minutes
    for (let i = 0; i < 5; i++) {
      db.createVote({
        sm_id: sm.id,
        voter_fingerprint: `fp_rapid_sim_${i}_${Date.now()}`,
        ip_address: testIP,
        timestamp: new Date(Date.now() - 60000 * (i + 1)).toISOString(),
        status: 'valid'
      });
    }

    // Now evaluate 6th vote from same IP
    const result = FraudEngine.evaluateVote({
      sm_id: sm.id,
      voter_fingerprint: `fp_rapid_sim_6th_${Date.now()}`,
      ip_address: testIP,
      user_agent: 'Mozilla/5.0 (iPhone)',
      mode: 'general'
    });

    assert.equal(result.allowed, true);
    assert.equal(result.status, 'flagged');
    assert.match(result.reason, /rapid_fire/);
  });

  test('Rule: Non-existent Service Master returns error', () => {
    const result = FraudEngine.evaluateVote({
      sm_id: 'sm-non-existent-99999',
      voter_fingerprint: `fp_dummy_${Date.now()}`,
      ip_address: '1.2.3.4',
      user_agent: 'Mozilla/5.0',
      mode: 'general'
    });

    assert.equal(result.allowed, false);
    assert.equal(result.error, 'INVALID_SM');
  });
});
