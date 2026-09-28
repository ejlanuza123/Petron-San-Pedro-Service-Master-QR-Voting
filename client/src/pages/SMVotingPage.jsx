import React, { useState, useEffect } from 'react';
import { Award, MapPin, Clock, CheckCircle2, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import useFingerprint from '../hooks/useFingerprint';
import { useToast } from '../context/ToastContext';

export default function SMVotingPage({ smId, onVoteSuccess, onBackToGeneral, campaignStatus }) {
  const [sm, setSm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const { fingerprint } = useFingerprint();
  const { error, warning } = useToast();

  useEffect(() => {
    const fetchSMDetails = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await api.getSM(smId);
        setSm(res.sm);
      } catch (err) {
        setErrorMsg(err.message || 'Service Master not found');
      } finally {
        setLoading(false);
      }
    };

    if (smId) {
      fetchSMDetails();
    }
  }, [smId]);

  const handleConfirmVote = async () => {
    if (!sm) return;

    if (!campaignStatus?.is_voting_open) {
      if (campaignStatus?.kill_switch_active) {
        warning('Voting is currently suspended by system administrators.');
      } else if (!campaignStatus?.is_within_hours) {
        warning('Voting is currently closed. Operating hours: 06:00 to 22:00.');
      } else {
        warning('Voting campaign is currently not open.');
      }
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.submitVote({
        sm_id: sm.id,
        voter_fingerprint: fingerprint,
        mode: 'sm_specific'
      });

      onVoteSuccess({
        vote_id: res.vote_id,
        sm_name: sm.name,
        sm_branch: sm.branch,
        sm_photo: sm.photo_url,
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
        error(err.message || 'Failed to submit vote. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading Service Master information...</p>
      </div>
    );
  }

  if (errorMsg || !sm) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-8">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Service Master Not Found</h2>
          <p className="text-xs text-slate-400 mb-6">{errorMsg || 'The QR code may be outdated or invalid.'}</p>
          <button
            onClick={onBackToGeneral}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            View All Service Masters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-14">
      {/* Back button */}
      <button
        onClick={onBackToGeneral}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>View all nominees</span>
      </button>

      {/* Main Mode B Confirmation Card */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Glow background */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 mb-5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Direct QR Scan &bull; Mode B</span>
          </div>

          {/* SM Photo with outer ring */}
          <div className="w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-tr from-amber-400 via-blue-500 to-indigo-600 shadow-xl mb-4">
            <img
              src={sm.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80'}
              alt={sm.name}
              className="w-full h-full object-cover rounded-full bg-slate-900"
            />
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
            {sm.name}
          </h2>

          <div className="mt-2 flex items-center justify-center gap-2 text-xs font-medium text-blue-400">
            <span>{sm.branch}</span>
            <span>&bull;</span>
            <span>{sm.station}</span>
          </div>

          {sm.bio && (
            <p className="mt-4 text-xs text-slate-300/90 italic bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
              "{sm.bio}"
            </p>
          )}

          {/* Prompt */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 text-slate-300">
            <p className="text-sm font-semibold text-white">
              Confirm your vote for {sm.name.split(' ')[0]}?
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Your vote will be immediately recorded for this month's recognition.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="mt-6 space-y-2.5">
            <button
              onClick={handleConfirmVote}
              disabled={submitting || (campaignStatus && !campaignStatus.is_voting_open)}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>Confirm Vote</span>
                </>
              )}
            </button>

            <button
              onClick={onBackToGeneral}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Not who served you? Browse other SMs
            </button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Anti-fraud protected &bull; 1 vote per customer per day</span>
          </div>
        </div>
      </div>
    </div>
  );
}
