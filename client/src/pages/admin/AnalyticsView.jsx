import React from 'react';
import { BarChart3, PieChart, TrendingUp, Award, MapPin, Calendar } from 'lucide-react';

export default function AnalyticsView({ stats }) {
  const leaderboard = stats?.leaderboard || [];
  const branchDist = stats?.branch_distribution || {};
  const timelineTrend = stats?.timeline_trend || {};

  const totalValidVotes = stats?.kpis?.valid_votes || 1;
  const maxVotesSM = Math.max(...leaderboard.map(s => s.valid_votes), 1);
  const maxTrend = Math.max(...Object.values(timelineTrend), 1);

  const branchEntries = Object.entries(branchDist);
  const branchColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <span>Visual Analytics & Vote Trends</span>
        </h2>
        <p className="text-xs text-slate-400">
          Data visualization for Service Master tallies, branch performance, and voting activity
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Top SMs Comparison (Horizontal Bar Chart) */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Service Master Vote Distribution</span>
            </h3>
            <span className="text-[11px] text-slate-400">Top Nominees</span>
          </div>

          <div className="space-y-3.5">
            {leaderboard.slice(0, 6).map((sm, index) => {
              const widthPct = ((sm.valid_votes / maxVotesSM) * 100).toFixed(0);
              return (
                <div key={sm.sm_id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-400 w-4">#{index + 1}</span>
                      <span className="font-semibold text-white">{sm.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({sm.branch})</span>
                    </div>
                    <span className="font-bold text-blue-400">
                      {sm.valid_votes} <span className="text-[10px] font-normal text-slate-400">({sm.percentage}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-700"
                      style={{ width: `${Math.max(widthPct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Branch Vote Share (Donut / Card Breakdown) */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Votes by Station / Branch</span>
              </h3>
              <span className="text-[11px] text-slate-400">Geographic footprint</span>
            </div>

            {/* Visual Bar Stack */}
            <div className="h-4 w-full bg-slate-900 rounded-xl overflow-hidden flex mb-5 border border-slate-700/60">
              {branchEntries.map(([branch, count], idx) => {
                const pct = ((count / totalValidVotes) * 100).toFixed(1);
                return (
                  <div
                    key={branch}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: branchColors[idx % branchColors.length]
                    }}
                    className="h-full transition-all duration-500"
                    title={`${branch}: ${count} votes (${pct}%)`}
                  />
                );
              })}
            </div>

            {/* Branch Legend Grid */}
            <div className="space-y-2.5">
              {branchEntries.map(([branch, count], idx) => {
                const pct = ((count / totalValidVotes) * 100).toFixed(1);
                return (
                  <div
                    key={branch}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/50 border border-slate-750 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-md shrink-0 shadow-sm"
                        style={{ backgroundColor: branchColors[idx % branchColors.length] }}
                      />
                      <span className="font-semibold text-slate-200">{branch}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">{count} votes</span>
                      <span className="text-slate-400 text-[11px] w-12 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Chart 3: Timeline Trend over Time */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>7-Day Voting Volume Trend</span>
          </h3>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily activity</span>
          </span>
        </div>

        {/* Bar chart representation of daily trend */}
        <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
          {Object.entries(timelineTrend).map(([dateStr, count]) => {
            const heightPct = Math.round((count / maxTrend) * 100);
            return (
              <div key={dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[11px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  {count}
                </div>
                <div className="w-full bg-slate-900 rounded-t-lg h-32 flex items-end p-1 border border-slate-700/40">
                  <div
                    style={{ height: `${Math.max(heightPct, 8)}%` }}
                    className="w-full rounded-t-md bg-gradient-to-t from-blue-700 to-indigo-500 group-hover:from-blue-600 group-hover:to-indigo-400 transition-all duration-300"
                  />
                </div>
                <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                  {dateStr}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
