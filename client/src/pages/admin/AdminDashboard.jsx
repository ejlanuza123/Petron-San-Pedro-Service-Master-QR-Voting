import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  LayoutDashboard, Award, BarChart3, ShieldAlert, FileText, 
  QrCode, Users, Settings, RefreshCw, Power, Sparkles, Database, KeyRound 
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ChangePasswordModal from '../../components/ChangePasswordModal';

// Subviews - Eagerly loaded for instant first render
import DashboardOverview from './DashboardOverview';
import LeaderboardView from './LeaderboardView';

// Subviews - Code-split & lazily loaded to minimize mobile bundle size
const AnalyticsView = lazy(() => import('./AnalyticsView'));
const FraudQueuePage = lazy(() => import('./FraudQueuePage'));
const AuditLogPage = lazy(() => import('./AuditLogPage'));
const QRStudioPage = lazy(() => import('./QRStudioPage'));
const SMManagementPage = lazy(() => import('./SMManagementPage'));
const SettingsPage = lazy(() => import('./SettingsPage'));

function TabLoadingFallback() {
  return (
    <div className="py-20 text-center flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs text-slate-400">Loading module...</p>
    </div>
  );
}

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [sms, setSms] = useState([]);
  const [flaggedVotes, setFlaggedVotes] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(15);
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [statsRes, campRes, smsRes, flaggedRes, dbRes] = await Promise.all([
        api.getStats(),
        api.getCampaign(),
        api.getSMs({ all: true }),
        api.getFlaggedVotes(),
        api.getDatabaseStatus().catch(() => null)
      ]);

      setStats(statsRes);
      setCampaign(campRes.campaign);
      setSms(smsRes.sms || []);
      setFlaggedVotes(flaggedRes.flagged || []);
      if (dbRes) setDbStatus(dbRes);
    } catch (err) {
      if (!silent) error(err.message || 'Failed to refresh admin data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      loadData(true);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  const handleToggleKillSwitch = async () => {
    try {
      const res = await api.toggleKillSwitch();
      warning(res.message);
      loadData(true);
    } catch (err) {
      error(err.message || 'Failed to toggle kill switch');
    }
  };

  const handleToggleTestMode = async () => {
    try {
      const res = await api.toggleTestMode();
      success(res.message);
      loadData(true);
    } catch (err) {
      error(err.message || 'Failed to toggle test mode');
    }
  };

  const branches = [...new Set(sms.map(s => s.branch))];

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'leaderboard', label: 'Leaderboard', icon: Award },
    { id: 'analytics', label: 'Visual Charts', icon: BarChart3 },
    { 
      id: 'fraud', 
      label: 'Fraud Queue', 
      icon: ShieldAlert,
      badge: flaggedVotes.length > 0 ? flaggedVotes.length : null 
    },
    { id: 'audit', label: 'Audit Trail', icon: FileText },
    { id: 'qr', label: 'QR Studio', icon: QrCode },
    { id: 'sms', label: 'SM Directory', icon: Users },
    { id: 'settings', label: 'Settings & Rules', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Top Admin Header Bar */}
      <div className="no-print bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Vote Monitoring & Fraud Audit System
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              REAL-TIME
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Logged in as <span className="text-white font-semibold">{user?.name || 'Administrator'}</span> &bull; {campaign?.name || 'Monthly Recognition Campaign'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dbStatus && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                dbStatus.connected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
              title={`Provider: ${dbStatus.provider || 'local'}\nHost: ${dbStatus.database_url || 'local'}\nVotes in Store: ${dbStatus.votes_count ?? 0}\nSMs in Store: ${dbStatus.sms_count ?? 0}`}
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="hidden sm:inline">{dbStatus.connected ? 'Supabase Cloud' : 'Local Fallback'}</span>
            </div>
          )}

          {/* Auto Refresh Cadence Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-300">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                autoRefreshInterval > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="text-[11px] text-slate-400 hidden md:inline">Sync:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1"
              title="Automatic background polling cadence"
            >
              <option value={0} className="bg-slate-900 text-slate-300">Paused</option>
              <option value={10} className="bg-slate-900 text-slate-300">10s (Fast)</option>
              <option value={15} className="bg-slate-900 text-slate-300">15s (Standard)</option>
              <option value={30} className="bg-slate-900 text-slate-300">30s (Balanced)</option>
              <option value={60} className="bg-slate-900 text-slate-300">60s (Slow)</option>
            </select>
          </div>

          <button
            onClick={() => loadData(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refresh All Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors"
            title="Change Administrator Password"
          >
            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Password</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Responsive overflow) */}
      <div className="no-print flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {loading && !stats ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-slate-400">Loading live monitoring dashboard...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <DashboardOverview
              stats={stats}
              campaign={campaign}
              onToggleKillSwitch={handleToggleKillSwitch}
              onToggleTestMode={handleToggleTestMode}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardView
              leaderboard={stats?.leaderboard || []}
              branches={branches}
            />
          )}

          <Suspense fallback={<TabLoadingFallback />}>
            {activeTab === 'analytics' && (
              <AnalyticsView stats={stats} />
            )}

            {activeTab === 'fraud' && (
              <FraudQueuePage
                flaggedVotes={flaggedVotes}
                onVoteReviewed={() => loadData(true)}
              />
            )}

            {activeTab === 'audit' && (
              <AuditLogPage branches={branches} />
            )}

            {activeTab === 'qr' && (
              <QRStudioPage
                sms={sms}
                campaign={campaign}
              />
            )}

            {activeTab === 'sms' && (
              <SMManagementPage
                sms={sms}
                onRefresh={() => loadData(true)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPage
                campaign={campaign}
                onRefresh={() => loadData(true)}
              />
            )}
          </Suspense>
        </>
      )}

      {/* Admin Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
