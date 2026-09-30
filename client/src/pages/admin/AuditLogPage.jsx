import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Search, Filter, ShieldCheck, 
  AlertTriangle, XCircle, RefreshCw, Calendar, Loader2, RotateCcw 
} from 'lucide-react';
import api, { triggerFileDownload } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AuditLogPage({ branches = [] }) {
  const [logView, setLogView] = useState('ballots'); // 'ballots' | 'system'
  const [votes, setVotes] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSystem, setLoadingSystem] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { success, error, info } = useToast();

  const loadVotes = async () => {
    try {
      setLoading(true);
      const res = await api.getVotes({
        status: statusFilter || undefined,
        branch: branchFilter || undefined,
        mode: modeFilter || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined
      });
      setVotes(res.votes || []);
    } catch (err) {
      error(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const loadSystemLogs = async () => {
    try {
      setLoadingSystem(true);
      const res = await api.getAuditLogs();
      setSystemLogs(res.logs || []);
    } catch (err) {
      error(err.message || 'Failed to load system audit logs');
    } finally {
      setLoadingSystem(false);
    }
  };

  useEffect(() => {
    if (logView === 'ballots') {
      loadVotes();
    }
  }, [logView, statusFilter, branchFilter, modeFilter, startDate, endDate]);

  useEffect(() => {
    if (logView === 'system') {
      loadSystemLogs();
    }
  }, [logView]);

  useEffect(() => {
    // Populate system logs on mount for tab counter badge
    loadSystemLogs();
  }, []);

  const handleRefresh = () => {
    if (logView === 'ballots') loadVotes();
    else loadSystemLogs();
  };

  const hasActiveFilters = Boolean(search || statusFilter || branchFilter || modeFilter || startDate || endDate);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setBranchFilter('');
    setModeFilter('');
    setStartDate('');
    setEndDate('');
  };

  const filtered = votes.filter((v) => {
    const q = search.toLowerCase();
    return (
      (v.id && v.id.toLowerCase().includes(q)) ||
      (v.sm_name && v.sm_name.toLowerCase().includes(q)) ||
      (v.sm_branch && v.sm_branch.toLowerCase().includes(q)) ||
      (v.branch && v.branch.toLowerCase().includes(q)) ||
      (v.ip_address && v.ip_address.toLowerCase().includes(q)) ||
      (v.flag_reason && v.flag_reason.toLowerCase().includes(q)) ||
      (v.voter_fingerprint && v.voter_fingerprint.toLowerCase().includes(q))
    );
  });

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const blob = await api.exportVotesCSV({
        status: statusFilter || undefined,
        branch: branchFilter || undefined,
        mode: modeFilter || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined
      });
      const dateStr = new Date().toISOString().split('T')[0];
      triggerFileDownload(blob, `votes-audit-${dateStr}.csv`);
      success('Audit logs CSV downloaded successfully');
    } catch (err) {
      error(err.message || 'Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  const handleExportSystemLogs = async () => {
    try {
      setExporting(true);
      const blob = await api.exportSystemLogsCSV();
      const dateStr = new Date().toISOString().split('T')[0];
      triggerFileDownload(blob, `system-audit-logs-${dateStr}.csv`);
      success('System security audit trail downloaded successfully');
    } catch (err) {
      error(err.message || 'Failed to export system audit logs');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Audit Trail & Ballot Registry</span>
          </h2>
          <p className="text-xs text-slate-400">
            Immutable log of all cast ballots with cryptographic device hashes, timestamps, and IP addresses
          </p>
        </div>

        <div className="flex items-center gap-2">
          {logView === 'ballots' ? (
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md shadow-blue-600/20 transition-colors"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{exporting ? 'Exporting...' : 'Export to CSV'}</span>
            </button>
          ) : (
            <button
              onClick={handleExportSystemLogs}
              disabled={exporting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md shadow-blue-600/20 transition-colors"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{exporting ? 'Exporting...' : 'Export System Audit (CSV)'}</span>
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${(loading || loadingSystem) ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700/80 pb-3">
        <button
          onClick={() => setLogView('ballots')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            logView === 'ballots'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Voter Ballot Registry ({votes.length})</span>
        </button>
        <button
          onClick={() => setLogView('system')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            logView === 'system'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>System & Security Audit Logs ({systemLogs.length})</span>
        </button>
      </div>

      {logView === 'ballots' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by ID, SM, IP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="valid">Valid Only</option>
                <option value="flagged">Flagged Only</option>
                <option value="rejected">Rejected Only</option>
              </select>

              {/* Branch Filter */}
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              {/* Mode Filter */}
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">All Modes</option>
                <option value="general">Mode A: General QR</option>
                <option value="sm_specific">Mode B: SM Specific QR</option>
              </select>
            </div>

            {/* Date Range & Reset Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-700/50">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Date Range:</span>
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  title="From Date"
                />
                <span className="text-slate-500 text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  title="To Date"
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700/80 transition-colors shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Ballot Table */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Vote ID</th>
                    <th className="py-3 px-4">Nominee SM</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Device Fingerprint</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 font-mono text-[11px]">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center font-sans text-xs text-slate-400">
                        Loading audit trail...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center font-sans text-xs text-slate-400">
                        No vote records match the specified filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-750/50 transition-colors">
                        <td className="py-3 px-4 text-blue-400 font-medium">
                          {v.id.substring(0, 16)}...
                        </td>
                        <td className="py-3 px-4 font-sans font-bold text-white">
                          {v.sm_name}
                          <span className="block text-[10px] text-slate-400 font-normal">{v.sm_branch}</span>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-400">
                          {new Date(v.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-300">
                            {v.mode === 'sm_specific' ? 'Mode B (Direct)' : 'Mode A (General)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          {v.status === 'valid' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Valid</span>
                            </span>
                          )}
                          {v.status === 'flagged' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Flagged</span>
                            </span>
                          )}
                          {v.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <XCircle className="w-3 h-3" />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 truncate max-w-[120px]" title={v.voter_fingerprint}>
                          {v.voter_fingerprint}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {v.ip_address}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* System Activity Audit Logs Table */
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 font-mono text-[11px]">
                {loadingSystem ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center font-sans text-xs text-slate-400">
                      Loading system audit events...
                    </td>
                  </tr>
                ) : systemLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center font-sans text-xs text-slate-400">
                      No system audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  systemLogs.map((log) => {
                    const isVoteAction = log.action === 'VOTE_CAST' || log.action === 'VOTE_FLAGGED';
                    let parsedDetails = log.details;
                    try {
                      if (typeof log.details === 'string' && (log.details.startsWith('{') || log.details.startsWith('['))) {
                        parsedDetails = JSON.stringify(JSON.parse(log.details), null, 1);
                      }
                    } catch {}

                    return (
                      <tr key={log.id} className="hover:bg-slate-750/50 transition-colors">
                        <td className="py-3 px-4 font-sans">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.action === 'VOTE_CAST'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : log.action === 'VOTE_FLAGGED'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : log.action === 'VOTE_BLOCKED'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : log.action === 'ADMIN_LOGIN'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-sans">
                          {log.admin_id}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-400">
                          {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3 px-4 text-blue-400 truncate max-w-[140px]" title={log.target_id}>
                          {log.target_id || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-[280px] break-words text-[10px] font-mono">
                          {parsedDetails}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
