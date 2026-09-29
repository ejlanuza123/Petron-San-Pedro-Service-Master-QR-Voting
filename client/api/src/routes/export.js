import express from 'express';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to escape CSV cell content safely
const escapeCSV = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

// GET /api/export/csv - Export complete votes audit trail
router.get('/csv', authenticateToken, (req, res) => {
  const { status, branch, mode } = req.query;
  const votes = db.getVotes({ status, branch, mode });

  const headers = [
    'Vote ID',
    'Service Master ID',
    'Service Master Name',
    'Branch',
    'Timestamp (UTC)',
    'Voting Mode',
    'Status',
    'Flag Reason',
    'Voter Device Fingerprint',
    'IP Address',
    'User Agent',
    'Reviewed By',
    'Reviewed At',
    'Review Notes',
    'Is Test Vote'
  ];

  const rows = votes.map(v => [
    escapeCSV(v.id),
    escapeCSV(v.sm_id),
    escapeCSV(v.sm_name),
    escapeCSV(v.sm_branch),
    escapeCSV(v.timestamp),
    escapeCSV(v.mode),
    escapeCSV(v.status),
    escapeCSV(v.flag_reason || ''),
    escapeCSV(v.voter_fingerprint),
    escapeCSV(v.ip_address),
    escapeCSV(v.user_agent),
    escapeCSV(v.reviewed_by || ''),
    escapeCSV(v.reviewed_at || ''),
    escapeCSV(v.review_notes || ''),
    escapeCSV(v.is_test ? 'YES' : 'NO')
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="votes-audit-export-${Date.now()}.csv"`);
  res.send(csvContent);
});

// GET /api/export/leaderboard - Export leaderboard summary
router.get('/leaderboard', authenticateToken, (req, res) => {
  const allVotes = db.getVotes({ excludeTest: true });
  const sms = db.getSMs({ all: true });
  const validVotes = allVotes.filter(v => v.status === 'valid');

  const tally = {};
  sms.forEach(sm => {
    tally[sm.id] = {
      name: sm.name,
      branch: sm.branch,
      station: sm.station,
      shift: sm.shift,
      valid: 0,
      flagged: 0,
      total: 0
    };
  });

  allVotes.forEach(v => {
    if (tally[v.sm_id]) {
      tally[v.sm_id].total++;
      if (v.status === 'valid') tally[v.sm_id].valid++;
      if (v.status === 'flagged') tally[v.sm_id].flagged++;
    }
  });

  const sorted = Object.values(tally).sort((a, b) => b.valid - a.valid);

  const headers = ['Rank', 'Service Master Name', 'Branch', 'Station', 'Shift', 'Valid Votes', 'Flagged Votes', 'Total Received', 'Share %'];
  const rows = sorted.map((row, idx) => {
    const share = validVotes.length > 0 ? ((row.valid / validVotes.length) * 100).toFixed(2) : '0.00';
    return [
      idx + 1,
      escapeCSV(row.name),
      escapeCSV(row.branch),
      escapeCSV(row.station),
      escapeCSV(row.shift),
      row.valid,
      row.flagged,
      row.total,
      `"${share}%"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="sm-leaderboard-${Date.now()}.csv"`);
  res.send(csvContent);
});

export default router;
