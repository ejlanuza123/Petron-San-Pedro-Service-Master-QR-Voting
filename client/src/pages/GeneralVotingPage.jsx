import React, { useState, useEffect } from 'react';
import { Search, MapPin, Award, AlertTriangle, ShieldCheck, Flame, RefreshCw } from 'lucide-react';
import SMCard from '../components/SMCard';
import ConfirmationModal from '../components/ConfirmationModal';
import api from '../services/api';
import useFingerprint from '../hooks/useFingerprint';
import { useToast } from '../context/ToastContext';

export default function GeneralVotingPage({ onVoteSuccess, campaignStatus }) {
  const [sms, setSms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedSM, setSelectedSM] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { fingerprint, loading: fpLoading } = useFingerprint();
  const { error, warning, info } = useToast();

  const loadSMs = async () => {
    try {
      setLoading(true);
      const res = await api.getSMs({ active: true });
      setSms(res.sms || []);
    } catch (err) {
      error(err.message || 'Failed to load Service Masters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSMs();
  }, []);

  const branches = ['All', ...new Set(sms.map(s => s.branch))];

  const filteredSMs = sms.filter(sm => {
    const matchesBranch = selectedBranch === 'All' || sm.branch === selectedBranch;
    const matchesSearch =
      sm.name.toLowerCase().includes(search.toLowerCase()) ||
      sm.station.toLowerCase().includes(search.toLowerCase()) ||
      sm.branch.toLowerCase().includes(search.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  const handleOpenVoteModal = (sm) => {
    if (!campaignStatus?.is_voting_open) {
      if (campaignStatus?.kill_switch_active) {
        warning('Voting is temporarily suspended by the administrator.');
      } else if (!campaignStatus?.is_within_hours) {
        warning('Voting is currently closed. Please cast your vote during operating hours.');
      } else {
        warning('Voting is currently closed.');
      }
      return;
    }
    setSelectedSM(sm);
    setIsModalOpen(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedSM) return;
    try {
      setSubmitting(true);
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([30, 40, 30]);
      }
      const res = await api.submitVote({
        sm_id: selectedSM.id,
        voter_fingerprint: fingerprint,
        mode: 'general'
      });

      if (window.navigator?.vibrate) {
        window.navigator.vibrate([100, 40, 100]);
      }

      setIsModalOpen(false);
      onVoteSuccess({
        vote_id: res.vote_id,
        sm_name: selectedSM.name,
        sm_branch: selectedSM.branch,
        sm_photo: selectedSM.photo_url,
        status: res.status,
        flagged: res.flagged,
        message: res.message
      });
    } catch (err) {
      if (err.code === 'ALREADY_VOTED') {
        warning(err.message, 'Vote Limit');
      } else if (err.code === 'VOTING_SUSPENDED' || err.code === 'OUTSIDE_OPERATING_HOURS') {
        error(err.message, 'Voting Closed');
      } else {
        error(err.message || 'Submission failed. Please try again.');
      }
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Alert Banner if voting is paused / outside hours */}
      {campaignStatus && !campaignStatus.is_voting_open && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="text-xs sm:text-sm">
            {campaignStatus.kill_switch_active
              ? 'Notice: Voting is currently on hold by station management. Please check back shortly.'
              : !campaignStatus.is_within_hours
              ? 'Notice: Voting is only open during station operating hours (06:00 to 22:00).'
              : 'Notice: Voting campaign is currently inactive.'}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>General Customer Ballot &bull; Mode A</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Vote for Service Master of the Month
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Recognize outstanding service, speed, and safety. Select your Service Master below to submit your daily vote.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-8">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Service Master or Bay..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Branch Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {branches.map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBranch(b)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedBranch === b
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/50'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of SM Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading Service Masters...</p>
        </div>
      ) : filteredSMs.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center max-w-md mx-auto">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Service Masters Found</h3>
          <p className="text-xs text-slate-400 mt-1">Try clearing your search query or choosing another branch.</p>
          <button
            onClick={() => { setSearch(''); setSelectedBranch('All'); }}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSMs.map((sm) => (
            <SMCard
              key={sm.id}
              sm={sm}
              onVote={handleOpenVoteModal}
              disabled={campaignStatus && !campaignStatus.is_voting_open}
            />
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmVote}
        sm={selectedSM}
        loading={submitting}
      />
    </div>
  );
}
