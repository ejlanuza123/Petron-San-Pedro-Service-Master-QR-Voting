/**
 * API Service for Service Master QR Voting System
 */

const getAuthHeaders = () => {
  const token = localStorage.getItem('sm_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'API request failed');
    error.status = response.status;
    error.code = data.error || 'UNKNOWN_ERROR';
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  // Public voter endpoints
  getSMs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/sms${query ? `?${query}` : ''}`);
    return handleResponse(res);
  },

  getSM: async (id) => {
    const res = await fetch(`/api/sms/${id}`);
    return handleResponse(res);
  },

  submitVote: async ({ sm_id, voter_fingerprint, mode }) => {
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sm_id, voter_fingerprint, mode })
    });
    return handleResponse(res);
  },

  getCampaign: async () => {
    const res = await fetch('/api/campaign');
    return handleResponse(res);
  },

  // Auth endpoints
  login: async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  getMe: async () => {
    const res = await fetch('/api/auth/me', {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return handleResponse(res);
  },

  // QR endpoints
  getGeneralQR: async (baseUrl) => {
    const params = new URLSearchParams({ format: 'json' });
    if (baseUrl) params.set('baseUrl', baseUrl);
    const res = await fetch(`/api/qr/general?${params.toString()}`, {
      headers: { Accept: 'application/json' }
    });
    return handleResponse(res);
  },

  getSMQR: async (id, baseUrl) => {
    const params = new URLSearchParams({ format: 'json' });
    if (baseUrl) params.set('baseUrl', baseUrl);
    const res = await fetch(`/api/qr/sm/${id}?${params.toString()}`, {
      headers: { Accept: 'application/json' }
    });
    return handleResponse(res);
  },

  getAllSMQRs: async (baseUrl) => {
    const params = new URLSearchParams({ format: 'json' });
    if (baseUrl) params.set('baseUrl', baseUrl);
    const res = await fetch(`/api/qr/all-sms?${params.toString()}`, {
      headers: { Accept: 'application/json' }
    });
    return handleResponse(res);
  },

  getAuditLogs: async () => {
    const res = await fetch('/api/votes/audit-logs', {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // Admin Dashboard endpoints
  getVotes: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'null') {
        queryParams.set(k, v);
      }
    });
    const query = queryParams.toString();
    const res = await fetch(`/api/votes${query ? `?${query}` : ''}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  getFlaggedVotes: async () => {
    const res = await fetch('/api/votes/flagged', {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  approveVote: async (id, notes = '') => {
    const res = await fetch(`/api/votes/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ notes })
    });
    return handleResponse(res);
  },

  rejectVote: async (id, notes = '') => {
    const res = await fetch(`/api/votes/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ notes })
    });
    return handleResponse(res);
  },

  getStats: async () => {
    const res = await fetch('/api/votes/stats', {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // Admin SM Management
  createSM: async (smData) => {
    const res = await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(smData)
    });
    return handleResponse(res);
  },

  updateSM: async (id, updates) => {
    const res = await fetch(`/api/sms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  deleteSM: async (id) => {
    const res = await fetch(`/api/sms/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  calibrateSMDevice: async (id, data) => {
    const res = await fetch(`/api/sms/${id}/register-device`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getSMPairingToken: async (id) => {
    const res = await fetch(`/api/sms/${id}/pair-token`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  getSMPairingQR: async (id, baseUrl) => {
    const query = baseUrl ? `?baseUrl=${encodeURIComponent(baseUrl)}` : '';
    const res = await fetch(`/api/qr/pair/${id}${query}`, {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  unregisterSMDevice: async (id) => {
    const res = await fetch(`/api/sms/${id}/unregister-device`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // Campaign & Rules Settings
  updateCampaign: async (settings) => {
    const res = await fetch('/api/campaign', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(settings)
    });
    return handleResponse(res);
  },

  toggleKillSwitch: async () => {
    const res = await fetch('/api/campaign/toggle-kill-switch', {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  toggleTestMode: async () => {
    const res = await fetch('/api/campaign/toggle-test-mode', {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // Database & Cloud Persistence
  getDatabaseStatus: async () => {
    const res = await fetch('/api/database/status', {
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  syncDatabase: async () => {
    const res = await fetch('/api/database/sync', {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    return handleResponse(res);
  },

  // Data Exports (CSV & Designer XLSX)
  exportVotes: async (filters = {}) => {
    const format = filters.format || 'csv';
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'null') query.set(k, v);
    });
    const res = await fetch(`/api/export/csv?${query.toString()}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to export votes ${format.toUpperCase()}`);
    }
    return res.blob();
  },

  exportVotesCSV: async (filters = {}) => {
    return api.exportVotes({ ...filters, format: 'csv' });
  },

  exportVotesXLSX: async (filters = {}) => {
    return api.exportVotes({ ...filters, format: 'xlsx' });
  },

  exportLeaderboard: async (branch, format = 'csv') => {
    const query = new URLSearchParams();
    if (branch && branch !== 'All') query.set('branch', branch);
    if (format) query.set('format', format);
    const res = await fetch(`/api/export/leaderboard?${query.toString()}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to export leaderboard ${format.toUpperCase()}`);
    }
    return res.blob();
  },

  exportLeaderboardCSV: async (branch) => {
    return api.exportLeaderboard(branch, 'csv');
  },

  exportLeaderboardXLSX: async (branch) => {
    return api.exportLeaderboard(branch, 'xlsx');
  },

  exportSystemLogs: async (action, format = 'csv') => {
    const query = new URLSearchParams();
    if (action) query.set('action', action);
    if (format) query.set('format', format);
    const res = await fetch(`/api/export/system-logs?${query.toString()}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to export system logs ${format.toUpperCase()}`);
    }
    return res.blob();
  },

  exportSystemLogsCSV: async (action) => {
    return api.exportSystemLogs(action, 'csv');
  },

  exportSystemLogsXLSX: async (action) => {
    return api.exportSystemLogs(action, 'xlsx');
  }
};

export function triggerFileDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

export default api;

