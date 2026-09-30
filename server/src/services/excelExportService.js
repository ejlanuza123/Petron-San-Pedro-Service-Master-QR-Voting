import ExcelJS from 'exceljs';

// Petron Corporate Theme Colors
const BRAND_NAVY_DARK = 'FF002D62';   // Main Petron Navy
const BRAND_NAVY_MID = 'FF0A3875';    // Secondary Navy
const BRAND_BLUE = 'FF1E40AF';        // Table Header Royal Blue
const SLATE_HEADER_FILL = 'FFF1F5F9';
const ZEBRA_ROW_FILL = 'FFF8FAFC';
const WHITE_FILL = 'FFFFFFFF';
const BORDER_COLOR = 'FFCBD5E1';      // Slate-300

// Helper to apply standard thin borders
function applyCellBorder(cell, color = BORDER_COLOR) {
  cell.border = {
    top: { style: 'thin', color: { argb: color } },
    left: { style: 'thin', color: { argb: color } },
    bottom: { style: 'thin', color: { argb: color } },
    right: { style: 'thin', color: { argb: color } }
  };
}

// Helper to auto-fit columns with safety bounds
function autoFitColumns(worksheet, minWidth = 12, maxWidth = 48) {
  worksheet.columns.forEach((column) => {
    let maxLen = 0;
    column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      // Skip title rows (1-3) when measuring column width
      if (rowNumber <= 3) return;
      const cellVal = cell.value ? String(cell.value) : '';
      const len = cellVal.length;
      if (len > maxLen) maxLen = len;
    });
    column.width = Math.max(minWidth, Math.min(maxLen + 3, maxWidth));
  });
}

/**
 * 1. Generate Designer Excel Workbook for Voter Ballot Registry
 */
export async function generateVotesExcel(votes = [], filters = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Petron San Pedro SM Voting System';
  workbook.created = new Date();

  // --- SHEET 1: Ballot Registry ---
  const ws = workbook.addWorksheet('Ballot Registry', {
    views: [{ showGridLines: true }]
  });

  const totalCols = 13;
  const lastColLetter = 'M';

  // 1. Brand Title Banner (Row 1)
  ws.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = ws.getCell('A1');
  titleCell.value = 'PETRON SAN PEDRO — SERVICE MASTER OF THE MONTH';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_NAVY_DARK } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 32;

  // 2. Subtitle Banner (Row 2)
  ws.mergeCells(`A2:${lastColLetter}2`);
  const subtitleCell = ws.getCell('A2');
  subtitleCell.value = 'OFFICIAL VOTER BALLOT REGISTRY & CRYPTOGRAPHIC AUDIT TRAIL';
  subtitleCell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_NAVY_MID } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 22;

  // 3. Metadata Info Banner (Row 3)
  ws.mergeCells(`A3:${lastColLetter}3`);
  const metaCell = ws.getCell('A3');
  const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
  const filterDesc = [
    `Status: ${filters.status || 'All'}`,
    `Branch: ${filters.branch || 'All'}`,
    `Mode: ${filters.mode || 'All'}`,
    `Total Ballots: ${votes.length}`,
    `Generated: ${nowStr}`
  ].join('  •  ');
  metaCell.value = filterDesc;
  metaCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF475569' } };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SLATE_HEADER_FILL } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(3).height = 20;

  // Row 4: Empty space
  ws.getRow(4).height = 8;

  // 4. Column Headers (Row 5)
  const headers = [
    'Vote ID',
    'Service Master Name',
    'Branch',
    'Timestamp (UTC)',
    'Channel / Mode',
    'Status',
    'Flag / Anti-Cheat Reason',
    'Reviewer',
    'Review Notes',
    'Device Fingerprint',
    'IP Address',
    'User Agent',
    'Test Mode'
  ];

  const headerRow = ws.getRow(5);
  headerRow.values = headers;
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_BLUE } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    applyCellBorder(cell, 'FF94A3B8');
  });

  // 5. Populate Data Rows (Row 6+)
  votes.forEach((v, index) => {
    const rowNum = 6 + index;
    const row = ws.getRow(rowNum);
    const isEven = index % 2 === 0;
    const bgFill = isEven ? WHITE_FILL : ZEBRA_ROW_FILL;

    const modeLabel = v.mode === 'sm_specific' ? 'Mode B (Direct Badge)' : 'Mode A (General Poster)';
    const statusLabel = (v.status || 'valid').toUpperCase();
    const isTestLabel = v.is_test ? 'TEST' : 'LIVE';

    row.values = [
      v.id,
      v.sm_name || 'Unknown SM',
      v.sm_branch || v.branch || 'Petron San Pedro',
      v.timestamp ? new Date(v.timestamp).toISOString() : '',
      modeLabel,
      statusLabel,
      v.flag_reason || '-',
      v.reviewed_by || '-',
      v.review_notes || '-',
      v.voter_fingerprint || '-',
      v.ip_address || '-',
      v.user_agent || '-',
      isTestLabel
    ];
    row.height = 20;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      // Default cell formatting
      cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgFill } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      applyCellBorder(cell);

      // Specific Column Styling
      if (colNumber === 1) {
        // Vote ID
        cell.font = { name: 'Consolas', size: 9, bold: true, color: { argb: 'FF2563EB' } };
      } else if (colNumber === 2) {
        // SM Name
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
      } else if (colNumber === 4) {
        // Timestamp
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Consolas', size: 9, color: { argb: 'FF475569' } };
      } else if (colNumber === 5) {
        // Mode
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: v.mode === 'sm_specific' ? 'FFE0F2FE' : 'FFF1F5F9' }
        };
        cell.font = {
          name: 'Segoe UI',
          size: 9,
          bold: true,
          color: { argb: v.mode === 'sm_specific' ? 'FF0369A1' : 'FF475569' }
        };
      } else if (colNumber === 6) {
        // Status Badge Styling
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (v.status === 'valid') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF15803D' } };
        } else if (v.status === 'flagged') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFB45309' } };
        } else if (v.status === 'rejected') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFB91C1C' } };
        }
      } else if (colNumber === 10 || colNumber === 11) {
        // Fingerprint & IP
        cell.font = { name: 'Consolas', size: 8.5, color: { argb: 'FF475569' } };
        if (colNumber === 11) cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 13) {
        // Test Flag
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: v.is_test ? 'FFDC2626' : 'FF059669' } };
      }
    });
  });

  // 6. Summary Footer Row
  const validCount = votes.filter(v => v.status === 'valid').length;
  const flaggedCount = votes.filter(v => v.status === 'flagged').length;
  const rejectedCount = votes.filter(v => v.status === 'rejected').length;

  const summaryRowNum = 6 + votes.length + 1;
  const summaryRow = ws.getRow(summaryRowNum);
  summaryRow.values = [
    'TOTALS',
    `Total Ballots: ${votes.length}`,
    '',
    '',
    '',
    `Valid: ${validCount} | Flagged: ${flaggedCount} | Rejected: ${rejectedCount}`,
    '', '', '', '', '', '', ''
  ];
  summaryRow.height = 24;
  summaryRow.eachCell({ includeEmpty: false }, (cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF475569' } },
      bottom: { style: 'double', color: { argb: 'FF475569' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  autoFitColumns(ws);

  // --- SHEET 2: Executive Summary ---
  const sumSheet = workbook.addWorksheet('Executive Summary', {
    views: [{ showGridLines: true }]
  });

  sumSheet.mergeCells('A1:F1');
  const sumTitle = sumSheet.getCell('A1');
  sumTitle.value = 'PETRON SAN PEDRO — VOTING CAMPAIGN EXECUTIVE SUMMARY';
  sumTitle.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  sumTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_NAVY_DARK } };
  sumTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  sumSheet.getRow(1).height = 30;

  // KPI Block
  const kpiData = [
    ['Metric', 'Count', 'Percentage of Total'],
    ['Total Ballots Cast', votes.length, '100.0%'],
    ['Valid Ballots (Counted in Tally)', validCount, votes.length ? `${((validCount / votes.length) * 100).toFixed(1)}%` : '0%'],
    ['Flagged Ballots (Fraud Quarantine)', flaggedCount, votes.length ? `${((flaggedCount / votes.length) * 100).toFixed(1)}%` : '0%'],
    ['Rejected Ballots (Disqualified)', rejectedCount, votes.length ? `${((rejectedCount / votes.length) * 100).toFixed(1)}%` : '0%']
  ];

  kpiData.forEach((rowVals, idx) => {
    const row = sumSheet.getRow(3 + idx);
    row.values = rowVals;
    row.height = 22;
    row.eachCell((cell, colNum) => {
      cell.border = {
        top: { style: 'thin', color: { argb: BORDER_COLOR } },
        bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
        left: { style: 'thin', color: { argb: BORDER_COLOR } },
        right: { style: 'thin', color: { argb: BORDER_COLOR } }
      };
      if (idx === 0) {
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_BLUE } };
        cell.alignment = { horizontal: colNum === 1 ? 'left' : 'center', vertical: 'middle' };
      } else {
        cell.font = { name: 'Segoe UI', size: 9.5, bold: idx === 1, color: { argb: 'FF1E293B' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? ZEBRA_ROW_FILL : WHITE_FILL } };
        cell.alignment = { horizontal: colNum === 1 ? 'left' : 'center', vertical: 'middle' };
      }
    });
  });

  autoFitColumns(sumSheet, 18, 50);

  return workbook.xlsx.writeBuffer();
}

/**
 * 2. Generate Designer Excel Workbook for SM Leaderboard Standings
 */
export async function generateLeaderboardExcel(leaderboard = [], branch = 'All', totalValidVotes = 0) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Petron San Pedro SM Voting System';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Leaderboard Standings', {
    views: [{ showGridLines: true }]
  });

  const lastColLetter = 'I';

  // 1. Header Row
  ws.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = ws.getCell('A1');
  titleCell.value = 'PETRON SAN PEDRO — SERVICE MASTER OF THE MONTH';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_NAVY_DARK } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 32;

  // 2. Subtitle
  ws.mergeCells(`A2:${lastColLetter}2`);
  const subtitleCell = ws.getCell('A2');
  subtitleCell.value = `OFFICIAL LEADERBOARD STANDINGS — ${String(branch).toUpperCase()}`;
  subtitleCell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_NAVY_MID } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 22;

  // 3. Metadata
  ws.mergeCells(`A3:${lastColLetter}3`);
  const metaCell = ws.getCell('A3');
  const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
  metaCell.value = `Filter Branch: ${branch}  •  Active Nominees: ${leaderboard.length}  •  Total Valid Customer Votes: ${totalValidVotes}  •  Exported: ${nowStr}`;
  metaCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF475569' } };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SLATE_HEADER_FILL } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(3).height = 20;

  // Empty row 4
  ws.getRow(4).height = 8;

  // 4. Headers Row 5
  const headers = [
    'Rank',
    'Service Master Name',
    'Branch',
    'Station / Bay',
    'Assigned Shift',
    'Valid Customer Votes',
    'Flagged / Quarantine Votes',
    'Total Received',
    'Vote Share %'
  ];

  const headerRow = ws.getRow(5);
  headerRow.values = headers;
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_BLUE } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    applyCellBorder(cell, 'FF94A3B8');
  });

  // 5. Data Rows
  leaderboard.forEach((item, index) => {
    const rowNum = 6 + index;
    const row = ws.getRow(rowNum);
    const rank = index + 1;

    // Podium fills for top 3
    let rankBg = WHITE_FILL;
    let rankBadge = `#${rank}`;
    if (rank === 1) {
      rankBg = 'FFFEF08A'; // Soft Gold
      rankBadge = '🥇 Rank 1 (Winner)';
    } else if (rank === 2) {
      rankBg = 'FFF1F5F9'; // Soft Silver
      rankBadge = '🥈 Rank 2';
    } else if (rank === 3) {
      rankBg = 'FFFFEDD5'; // Soft Bronze
      rankBadge = '🥉 Rank 3';
    } else if (index % 2 === 1) {
      rankBg = ZEBRA_ROW_FILL;
    }

    const shareStr = totalValidVotes > 0 ? `${((item.valid / totalValidVotes) * 100).toFixed(2)}%` : '0.00%';

    row.values = [
      rankBadge,
      item.name,
      item.branch,
      item.station,
      item.shift || 'Day Shift',
      item.valid || 0,
      item.flagged || 0,
      item.total || 0,
      shareStr
    ];
    row.height = 22;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rankBg } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      applyCellBorder(cell);

      // Col 1: Rank
      if (colNumber === 1) {
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: rank <= 3 ? 'FF854D0E' : 'FF475569' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 2) {
        // Name
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      } else if (colNumber >= 6 && colNumber <= 8) {
        // Numeric counts
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { name: 'Segoe UI', size: 10, bold: colNumber === 6, color: { argb: colNumber === 6 ? 'FF16A34A' : 'FF1E293B' } };
      } else if (colNumber === 9) {
        // Percentage
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF2563EB' } };
      }
    });
  });

  autoFitColumns(ws);

  return workbook.xlsx.writeBuffer();
}

/**
 * 3. Generate Designer Excel Workbook for System Security Audit Trail
 */
export async function generateSystemAuditExcel(logs = [], actionFilter = '') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Petron San Pedro SM Voting System';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('System Audit Trail', {
    views: [{ showGridLines: true }]
  });

  const lastColLetter = 'F';

  // 1. Header
  ws.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = ws.getCell('A1');
  titleCell.value = 'PETRON SAN PEDRO — SYSTEM SECURITY AUDIT TRAIL';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_NAVY_DARK } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 32;

  // 2. Subtitle
  ws.mergeCells(`A2:${lastColLetter}2`);
  const subtitleCell = ws.getCell('A2');
  subtitleCell.value = 'IMMUTABLE SECURITY LOGS & ADMINISTRATIVE ACCESS REGISTRY';
  subtitleCell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_NAVY_MID } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 22;

  // 3. Metadata
  ws.mergeCells(`A3:${lastColLetter}3`);
  const metaCell = ws.getCell('A3');
  const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
  metaCell.value = `Action Filter: ${actionFilter || 'All Actions'}  •  Total Events: ${logs.length}  •  Exported: ${nowStr}`;
  metaCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF475569' } };
  metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SLATE_HEADER_FILL } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(3).height = 20;

  ws.getRow(4).height = 8;

  // 4. Headers Row 5
  const headers = [
    'Log ID',
    'Timestamp (UTC)',
    'Initiator / Actor',
    'Action Type',
    'Target Entity ID',
    'Event Details & Security Parameters'
  ];

  const headerRow = ws.getRow(5);
  headerRow.values = headers;
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_BLUE } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    applyCellBorder(cell, 'FF94A3B8');
  });

  // 5. Data Rows
  logs.forEach((log, index) => {
    const rowNum = 6 + index;
    const row = ws.getRow(rowNum);
    const bgFill = index % 2 === 0 ? WHITE_FILL : ZEBRA_ROW_FILL;

    let parsedDetails = log.details;
    if (typeof log.details === 'object' && log.details !== null) {
      parsedDetails = JSON.stringify(log.details);
    }

    row.values = [
      log.id,
      log.timestamp ? new Date(log.timestamp).toISOString() : '',
      log.admin_id || 'system',
      log.action || 'UNKNOWN',
      log.target_id || '-',
      parsedDetails || '-'
    ];
    row.height = 20;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgFill } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      applyCellBorder(cell);

      if (colNumber === 1) {
        cell.font = { name: 'Consolas', size: 9, bold: true, color: { argb: 'FF2563EB' } };
      } else if (colNumber === 2) {
        cell.font = { name: 'Consolas', size: 9, color: { argb: 'FF475569' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 4) {
        // Action styling
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (log.action === 'VOTE_CAST') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF15803D' } };
        } else if (log.action === 'VOTE_FLAGGED') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFB45309' } };
        } else if (log.action === 'VOTE_BLOCKED') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFB91C1C' } };
        } else if (log.action === 'ADMIN_LOGIN') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF0369A1' } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF4338CA' } };
        }
      }
    });
  });

  autoFitColumns(ws);

  return workbook.xlsx.writeBuffer();
}

export default {
  generateVotesExcel,
  generateLeaderboardExcel,
  generateSystemAuditExcel
};
