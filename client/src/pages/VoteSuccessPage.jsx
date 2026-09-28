import React, { useEffect } from 'react';
import { Award, CheckCircle, Home, ShieldCheck, Share2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function VoteSuccessPage({ voteData, onReturnHome }) {
  useEffect(() => {
    // Fire festive celebratory confetti on vote completion
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#6366f1']
      });
    } catch {
      // ignore if confetti unsupported
    }
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Success Check Icon */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-900/30 mb-5">
            <CheckCircle className="w-9 h-9 stroke-[2.5]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Vote Recorded!</span>
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Thank You for Voting!
          </h2>

          <p className="text-xs text-slate-300 mt-2 px-2">
            Your appreciation directly empowers our Service Masters to deliver top-tier service.
          </p>

          {/* Voted Details Card */}
          {voteData && (
            <div className="mt-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-700/60 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Recipient:</span>
                <span className="font-bold text-white text-sm">{voteData.sm_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Station / Branch:</span>
                <span className="font-medium text-blue-400">{voteData.sm_branch}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Audit Verification ID:</span>
                <span className="font-mono text-[11px] text-slate-300">{voteData.vote_id || 'AUDIT-PENDING'}</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-[11px]">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authenticated</span>
                </span>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-2.5">
            <button
              onClick={onReturnHome}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Return to Main Voting Page</span>
            </button>
          </div>

          <p className="mt-5 text-[11px] text-slate-500">
            Remember: You can vote again tomorrow during operating hours!
          </p>
        </div>
      </div>
    </div>
  );
}
