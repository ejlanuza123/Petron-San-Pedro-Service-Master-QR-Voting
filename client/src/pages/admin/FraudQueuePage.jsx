import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, AlertTriangle, Eye, RefreshCw, Cpu, Globe } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function FraudQueuePage({ flaggedVotes = [], onVoteReviewed }) {
  const [selectedVote, setSelectedVote] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { success, error } = useToast();

  const handleApprove = async (voteId) => {
    try {
      setSubmitting(true);
      await api.approveVote(voteId, reviewNotes || 'Verified legitimate by supervisor');
      success('Vote approved and added to official tally!');
      setSelectedVote(null);
      setReviewNotes('');
      onVoteReviewed();
    } catch (err) {
      error(err.message || 'Failed to approve vote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (voteId) => {
    try {
      setSubmitting(true);
      await api.rejectVote(voteId, reviewNotes || 'Rejected: confirmed policy violation');
      success('Vote rejected and permanently excluded.');
      setSelectedVote(null);
      setReviewNotes('');
      onVoteReviewed();
    } catch (err) {
      error(err.message || 'Failed to reject vote');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Fraud Detection & Review Queue</span>
          </h2>
          <p className="text-xs text-slate-400">
            Automated anti-cheat detection flags suspicious self-votes, rapid-fire spam, and hardware mismatches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300">
            {flaggedVotes.length} Pending Investigation
          </span>
          <button
            onClick={onVoteReviewed}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {flaggedVotes.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Fraud Queue Clean!</h3>
          <p className="text-xs text-slate-400 mt-1">
            No suspicious or flagged votes currently require manual review. All recent ballots comply with anti-cheat policies.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {flaggedVotes.map((vote) => (
            <div
              key={vote.id}
              className="bg-slate-800/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">Vote for {vote.sm_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        FLAGGED
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {vote.sm_branch} &bull; Mode: <span className="font-mono text-slate-300">{vote.mode}</span> &bull; {new Date(vote.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(vote.id)}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve Vote</span>
                  </button>

                  <button
                    onClick={() => handleReject(vote.id)}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              {/* Fraud Reason Alert Box */}
              <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-600/30 text-amber-200 text-xs">
                <span className="font-bold text-amber-300 block mb-0.5">Detection Rule Triggered:</span>
                {vote.flag_reason || 'Automated anomaly detection'}
              </div>

              {/* Forensic Details Grid */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-300">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                  <div className="text-slate-400 flex items-center gap-1 mb-1">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span>Device Fingerprint</span>
                  </div>
                  <div className="font-mono text-slate-200 truncate" title={vote.voter_fingerprint}>
                    {vote.voter_fingerprint}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                  <div className="text-slate-400 flex items-center gap-1 mb-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>IP Address</span>
                  </div>
                  <div className="font-mono text-slate-200 truncate">
                    {vote.ip_address}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                  <div className="text-slate-400 mb-1">Client User Agent</div>
                  <div className="text-slate-200 truncate" title={vote.user_agent}>
                    {vote.user_agent}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
