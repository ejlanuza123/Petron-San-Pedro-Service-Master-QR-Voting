import express from 'express';
import db from '../db/database.js';
import FraudEngine from '../services/fraudEngine.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

// Helper to extract client IP safely
const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || req.ip || '127.0.0.1';
};

// POST /api/vote - Submit a vote (Rate limited: 10 submissions per minute per IP)
router.post('/', rateLimit({ windowMs: 60000, max: 10 }), (req, res) => {
  const { sm_id, voter_fingerprint, mode } = req.body;

  if (!sm_id) {
    return res.status(400).json({ error: 'MISSING_SM', message: 'Please select a Service Master to vote for.' });
  }

  if (!voter_fingerprint) {
    return res.status(400).json({ error: 'MISSING_FINGERPRINT', message: 'Voter verification failed. Please enable JavaScript or refresh.' });
  }

  const validModes = ['general', 'sm_specific'];
  const voteMode = validModes.includes(mode) ? mode : 'general';

  const ip_address = getClientIP(req);
  const user_agent = req.headers['user-agent'] || 'unknown';

  const campaign = db.getActiveCampaign();
  const targetSM = db.getSMById(sm_id);

  if (!targetSM) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Selected Service Master does not exist.' });
  }

  // Run Fraud Detection Evaluation
  const evaluation = FraudEngine.evaluateVote({
    sm_id,
    voter_fingerprint,
    ip_address,
    user_agent,
    mode: voteMode
  });

  // If disallowed (e.g. duplicate vote, kill switch, outside hours, invalid SM)
  if (!evaluation.allowed) {
    return res.status(403).json({
      error: evaluation.error,
      message: evaluation.message
    });
  }

  // Create vote record in database with audit metadata
  const newVote = db.createVote({
    sm_id,
    voter_fingerprint,
    ip_address,
    user_agent,
    mode: voteMode,
    branch: targetSM.branch,
    status: evaluation.status, // 'valid' or 'flagged'
    flag_reason: evaluation.reason,
    is_test: campaign.test_mode
  });

  res.status(201).json({
    success: true,
    vote_id: newVote.id,
    sm_name: targetSM.name,
    sm_branch: targetSM.branch,
    status: newVote.status,
    flagged: newVote.status === 'flagged',
    is_test: newVote.is_test,
    message: newVote.status === 'flagged'
      ? 'Your vote has been received and submitted for verification. Thank you!'
      : `Thank you! Your vote for ${targetSM.name} has been recorded successfully.`
  });
});

// GET /api/votes - Filterable audit log of votes (Admin only)
router.get('/', authenticateToken, (req, res) => {
  const { status, sm_id, branch, mode, startDate, endDate, excludeTest } = req.query;
  const votes = db.getVotes({
    status,
    sm_id,
    branch,
    mode,
    startDate,
    endDate,
    excludeTest: excludeTest === 'true'
  });

  res.json({ votes, count: votes.length });
});

// GET /api/votes/flagged - Flagged queue needing review (Admin only)
router.get('/flagged', authenticateToken, (req, res) => {
  const flaggedVotes = db.getVotes({ status: 'flagged' });
  res.json({ flagged: flaggedVotes, count: flaggedVotes.length });
});

// POST /api/votes/:id/approve - Approve flagged vote (Admin only)
router.post('/:id/approve', authenticateToken, (req, res) => {
  const { notes } = req.body;
  const updated = db.updateVoteStatus(req.params.id, {
    status: 'valid',
    reviewed_by: req.user.username,
    review_notes: notes || 'Approved by administrator'
  });

  if (!updated) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Vote record not found' });
  }

  db.logAction({
    admin_id: req.user.id,
    action: 'APPROVE_VOTE',
    target_id: updated.id,
    details: `Approved flagged vote ${updated.id} for SM ${updated.sm_id}`
  });

  res.json({ success: true, vote: updated });
});

// POST /api/votes/:id/reject - Reject flagged vote (Admin only)
router.post('/:id/reject', authenticateToken, (req, res) => {
  const { notes } = req.body;
  const updated = db.updateVoteStatus(req.params.id, {
    status: 'rejected',
    reviewed_by: req.user.username,
    review_notes: notes || 'Rejected by administrator due to policy violation'
  });

  if (!updated) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Vote record not found' });
  }

  db.logAction({
    admin_id: req.user.id,
    action: 'REJECT_VOTE',
    target_id: updated.id,
    details: `Rejected flagged vote ${updated.id}: ${notes || 'policy violation'}`
  });

  res.json({ success: true, vote: updated });
});

// GET /api/votes/stats - High-level metrics, leaderboard, & chart distributions (Admin only)
router.get('/stats', authenticateToken, (req, res) => {
  const allVotes = db.getVotes({ excludeTest: true });
  const sms = db.getSMs({ all: true });

  const totalVotes = allVotes.length;
  const validVotes = allVotes.filter(v => v.status === 'valid');
  const flaggedVotes = allVotes.filter(v => v.status === 'flagged');
  const rejectedVotes = allVotes.filter(v => v.status === 'rejected');

  // Today's votes count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayVotes = allVotes.filter(v => new Date(v.timestamp) >= todayStart).length;

  // Mode breakdown
  const generalModeCount = validVotes.filter(v => v.mode === 'general').length;
  const smSpecificModeCount = validVotes.filter(v => v.mode === 'sm_specific').length;

  // Leaderboard tally (based on VALID votes)
  const smTally = {};
  sms.forEach(sm => {
    smTally[sm.id] = {
      sm_id: sm.id,
      name: sm.name,
      branch: sm.branch,
      station: sm.station,
      shift: sm.shift,
      photo_url: sm.photo_url,
      active: sm.active,
      valid_votes: 0,
      flagged_votes: 0,
      total_received: 0
    };
  });

  allVotes.forEach(v => {
    if (smTally[v.sm_id]) {
      smTally[v.sm_id].total_received++;
      if (v.status === 'valid') smTally[v.sm_id].valid_votes++;
      if (v.status === 'flagged') smTally[v.sm_id].flagged_votes++;
    }
  });

  const leaderboard = Object.values(smTally)
    .sort((a, b) => b.valid_votes - a.valid_votes)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
      percentage: validVotes.length > 0 ? ((item.valid_votes / validVotes.length) * 100).toFixed(1) : 0
    }));

  // Branch breakdown
  const branchCounts = {};
  validVotes.forEach(v => {
    const branch = v.branch || 'Unassigned';
    branchCounts[branch] = (branchCounts[branch] || 0) + 1;
  });

  // Hourly / Daily trend (last 7 days)
  const dateCounts = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dateCounts[key] = 0;
  }

  allVotes.forEach(v => {
    const dateKey = new Date(v.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dateCounts[dateKey] !== undefined) {
      dateCounts[dateKey]++;
    }
  });

  res.json({
    kpis: {
      total_votes: totalVotes,
      valid_votes: validVotes.length,
      flagged_votes: flaggedVotes.length,
      rejected_votes: rejectedVotes.length,
      today_votes: todayVotes,
      active_sms_count: sms.filter(s => s.active).length,
      modes: {
        general: generalModeCount,
        sm_specific: smSpecificModeCount
      }
    },
    leaderboard,
    branch_distribution: branchCounts,
    timeline_trend: dateCounts
  });
});

export default router;
