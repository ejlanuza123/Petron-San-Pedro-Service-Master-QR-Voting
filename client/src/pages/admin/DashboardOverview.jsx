import React from 'react';
import { 
  Users, CheckCircle2, AlertTriangle, XCircle, TrendingUp, 
  Award, QrCode, Power, ShieldAlert, Sparkles, Smartphone 
} from 'lucide-react';

export default function DashboardOverview({ stats, campaign, onToggleKillSwitch, onToggleTestMode, onNavigateTab }) {
  const kpis = stats?.kpis || {};
  const leaderboard = stats?.leaderboard || [];

  return (
    <div className="space-y-6">
      {/* Top Banner if Kill Switch is ACTIVE */}
      {campaign?.kill_switch && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <div className="font-bold text-sm text-white">Emergency Kill Switch Engaged</div>
              <div className="text-xs text-rose-300">Customer voting is completely closed across all QR codes and branches.</div>
            </div>
          </div>
          <button
            onClick={onToggleKillSwitch}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
          >
            Deactivate Kill Switch
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Votes */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Votes Cast</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            {kpis.total_votes || 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {kpis.today_votes || 0} cast today
          </div>
        </div>

        {/* Valid Votes */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Valid Votes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {kpis.valid_votes || 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {kpis.total_votes > 0 ? (((kpis.valid_votes || 0) / kpis.total_votes) * 100).toFixed(0) : 0}% validity rate
          </div>
        </div>

        {/* Flagged Votes (Queue) */}
        <div 
          onClick={() => onNavigateTab('fraud')}
          className="bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
            <span>Flagged for Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-400">
            {kpis.flagged_votes || 0}
          </div>
          <div className="mt-1 text-[11px] text-amber-400/80 underline underline-offset-2">
            Click to review queue &rarr;
          </div>
        </div>

        {/* Rejected Votes */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Rejected Cheats</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-400">
            {kpis.rejected_votes || 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Blocked by fraud engine
          </div>
        </div>
      </div>

      {/* Control Switch Bar & Voting Mode Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Voting Mode Distribution */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-blue-400" />
              <span>Voting Channel Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400">Valid votes only</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <div className="text-[11px] text-slate-400 font-medium">Mode A (General QR)</div>
              <div className="text-xl font-bold text-blue-400 mt-1">
                {kpis.modes?.general || 0}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Counter / Table Tents</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50">
              <div className="text-[11px] text-slate-400 font-medium">Mode B (SM Specific)</div>
              <div className="text-xl font-bold text-indigo-400 mt-1">
                {kpis.modes?.sm_specific || 0}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Personal Badges / ID</div>
            </div>
          </div>
        </div>

        {/* Quick System Actions */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Power className="w-4 h-4 text-amber-400" />
              <span>Emergency Controls & Diagnostics</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Kill Switch Toggle */}
            <button
              onClick={onToggleKillSwitch}
              className={`p-3 rounded-xl text-left border transition-all ${
                campaign?.kill_switch
                  ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-900/40'
                  : 'bg-slate-900/80 hover:bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Kill Switch</span>
                <span className={`w-2 h-2 rounded-full ${campaign?.kill_switch ? 'bg-white' : 'bg-slate-600'}`} />
              </div>
              <p className="text-[10px] mt-1 opacity-80">
                {campaign?.kill_switch ? 'Voting Disabled' : 'Normal Operation'}
              </p>
            </button>

            {/* Test Mode Toggle */}
            <button
              onClick={onToggleTestMode}
              className={`p-3 rounded-xl text-left border transition-all ${
                campaign?.test_mode
                  ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-900/40'
                  : 'bg-slate-900/80 hover:bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Test Mode</span>
                <span className={`w-2 h-2 rounded-full ${campaign?.test_mode ? 'bg-white' : 'bg-slate-600'}`} />
              </div>
              <p className="text-[10px] mt-1 opacity-80">
                {campaign?.test_mode ? 'Simulations Tagged' : 'Live Production'}
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Leaderboard Spotlight */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Top Performing Service Masters</span>
          </h3>
          <button
            onClick={() => onNavigateTab('leaderboard')}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View Full Leaderboard &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {leaderboard.slice(0, 3).map((sm, index) => {
            let medalColor = 'from-amber-400 to-amber-600 text-amber-900';
            let rankLabel = '1st Place';
            if (index === 1) {
              medalColor = 'from-slate-300 to-slate-400 text-slate-900';
              rankLabel = '2nd Place';
            } else if (index === 2) {
              medalColor = 'from-amber-700 to-amber-800 text-amber-100';
              rankLabel = '3rd Place';
            }

            return (
              <div
                key={sm.sm_id}
                className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-4 flex items-center gap-3 relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-blue-500 to-amber-400 shrink-0 overflow-hidden">
                  <img
                    src={sm.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80'}
                    alt={sm.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-gradient-to-r ${medalColor}`}>
                      #{index + 1}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{sm.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {sm.branch}
                  </div>
                  <div className="text-xs font-extrabold text-blue-400 mt-1">
                    {sm.valid_votes} votes <span className="text-[10px] font-normal text-slate-500">({sm.percentage}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
