import express from 'express';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  generateVotesExcel, 
  generateLeaderboardExcel, 
  generateSystemAuditExcel 
} from '../services/excelExportService.js';

const router = express.Router();

// Helper to escape CSV cell content safely
const escapeCSV = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

// GET /api/export/csv & /api/export/xlsx - Export complete votes audit trail
const handleVotesExport = async (req, res) => {
  const { status, branch, mode, startDate, endDate, includeTest } = req.query;
  const format = req.query.format || (req.path.includes('xlsx') ? 'xlsx' : 'csv');
  const excludeTest = includeTest !== 'true';

  const votes = db.getVotes({ status, branch, mode, startDate, endDate, excludeTest });

  if (format === 'xlsx') {
    const buffer = await generateVotesExcel(votes, { status, branch, mode });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="votes-audit-export-${Date.now()}.xlsx"`);
    return res.send(buffer);
  }

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

  // Prepend UTF-8 BOM for clean Excel UTF-8 recognition
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="votes-audit-export-${Date.now()}.csv"`);
  res.send(csvContent);
};

router.get('/csv', authenticateToken, handleVotesExport);
router.get('/xlsx', authenticateToken, handleVotesExport);

// GET /api/export/leaderboard - Export leaderboard summary (CSV & XLSX)
router.get('/leaderboard', authenticateToken, async (req, res) => {
  const branch = req.query.branch;
  const format = req.query.format || (req.path.includes('xlsx') ? 'xlsx' : 'csv');
  const allVotes = db.getVotes({ excludeTest: true, branch: (branch && branch !== 'All') ? branch : undefined });
  let sms = db.getSMs({ all: true });
  if (branch && branch !== 'All') {
    sms = sms.filter(s => s.branch && s.branch.toLowerCase() === branch.toLowerCase());
  }
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
  const branchSlug = branch && branch !== 'All' ? `-${branch.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '';

  if (format === 'xlsx') {
    const buffer = await generateLeaderboardExcel(sorted, branch || 'All', validVotes.length);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="sm-leaderboard${branchSlug}-${Date.now()}.xlsx"`);
    return res.send(buffer);
  }

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

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="sm-leaderboard${branchSlug}-${Date.now()}.csv"`);
  res.send(csvContent);
});

// GET /api/export/system-logs - Export security audit logs (CSV & XLSX)
router.get('/system-logs', authenticateToken, async (req, res) => {
  const action = req.query.action;
  const format = req.query.format || (req.path.includes('xlsx') ? 'xlsx' : 'csv');
  let logs = db.getAuditLogs(500);
  if (action) {
    logs = logs.filter(l => l.action === action);
  }

  if (format === 'xlsx') {
    const buffer = await generateSystemAuditExcel(logs, action);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="system-audit-logs-${Date.now()}.xlsx"`);
    return res.send(buffer);
  }

  const headers = ['Log ID', 'Timestamp', 'Admin / Initiator', 'Action', 'Target ID', 'Details'];
  const rows = logs.map(l => [
    escapeCSV(l.id), escapeCSV(l.timestamp), escapeCSV(l.admin_id),
    escapeCSV(l.action), escapeCSV(l.target_id || ''), escapeCSV(l.details || '')
  ].join(','));
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="system-audit-logs-${Date.now()}.csv"`);
  res.send(csvContent);
});

export default router;

