import React, { useState } from 'react';
import { Award, Download, Search, MapPin, Clock, Filter, Loader2 } from 'lucide-react';
import api, { triggerFileDownload } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function LeaderboardView({ leaderboard = [], branches = [] }) {
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [exporting, setExporting] = useState(false);
  const { success, error, info } = useToast();

  const filtered = leaderboard.filter((item) => {
    const matchesBranch = selectedBranch === 'All' || item.branch === selectedBranch;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.station.toLowerCase().includes(search.toLowerCase()) ||
      item.branch.toLowerCase().includes(search.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await api.exportLeaderboardCSV(selectedBranch);
      const branchSlug = selectedBranch !== 'All' ? `-${selectedBranch.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '';
      const dateStr = new Date().toISOString().split('T')[0];
      triggerFileDownload(blob, `sm-leaderboard${branchSlug}-${dateStr}.csv`);
      success(`Leaderboard report exported successfully (${selectedBranch})`);
    } catch (err) {
      error(err.message || 'Failed to export leaderboard');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Official Leaderboard</span>
          </h2>
          <p className="text-xs text-slate-400">
            Ranked by authenticated valid customer votes in the active monthly campaign
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 transition-colors shadow-sm"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          ) : (
            <Download className="w-4 h-4 text-blue-400" />
          )}
          <span>{exporting ? 'Exporting...' : 'Export Leaderboard (CSV)'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Service Master..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Branch:</span>
          </span>
          {['All', ...branches].map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBranch(b)}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedBranch === b
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                <th className="py-3.5 px-4">Service Master</th>
                <th className="py-3.5 px-4">Branch & Station</th>
                <th className="py-3.5 px-4">Shift</th>
                <th className="py-3.5 px-4 text-center">Valid Votes</th>
                <th className="py-3.5 px-4 text-center">Flagged</th>
                <th className="py-3.5 px-4 text-right">Vote Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filtered.map((sm, index) => {
                const isTop1 = sm.rank === 1;
                const isTop2 = sm.rank === 2;
                const isTop3 = sm.rank === 3;

                return (
                  <tr
                    key={sm.sm_id}
                    className={`hover:bg-slate-750/50 transition-colors ${
                      isTop1 ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      {isTop1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                          1
                        </span>
                      ) : isTop2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs shadow-md">
                          2
                        </span>
                      ) : isTop3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs shadow-md">
                          3
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-400">{sm.rank}</span>
                      )}
                    </td>

                    {/* SM Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={sm.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80'}
                          alt={sm.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{sm.name}</div>
                          <div className="text-[10px] text-slate-400">ID: {sm.sm_id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Branch & Station */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{sm.branch}</div>
                      <div className="text-[11px] text-slate-400">{sm.station}</div>
                    </td>

                    {/* Shift */}
                    <td className="py-3.5 px-4 text-slate-300 text-[11px]">
                      {sm.shift || 'Regular'}
                    </td>

                    {/* Valid Votes */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-sm text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        {sm.valid_votes}
                      </span>
                    </td>

                    {/* Flagged */}
                    <td className="py-3.5 px-4 text-center">
                      {sm.flagged_votes > 0 ? (
                        <span className="font-semibold text-amber-400 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px]">
                          {sm.flagged_votes}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Share */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-blue-400">{sm.percentage}%</div>
                      <div className="w-20 bg-slate-700 rounded-full h-1.5 ml-auto mt-1 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${Math.min(sm.percentage, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
