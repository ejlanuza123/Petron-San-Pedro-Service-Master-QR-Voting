import React, { useEffect } from 'react';
import { ShieldCheck, Lock, EyeOff, Cpu, X } from 'lucide-react';

export default function PrivacyModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl relative text-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900 shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Voter Privacy & Audit Notice</h3>
              <p className="text-xs text-slate-400">Compliance with Data Privacy Act of 2012 & Anti-Fraud Standards</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed overscroll-contain">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block mb-0.5">No Personal Identification Required</span>
              We do not request your name, phone number, email address, or credit card to vote. Your vote is confidential and anonymous.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <Cpu className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block mb-0.5">Cryptographic Device Fingerprint</span>
              To prevent ballot box stuffing, multiple votes per day, and self-voting by station staff, a one-way irreversible cryptographic hash is computed from your browser properties.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <EyeOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block mb-0.5">Audit Logging & Protection</span>
              Network connection metadata (IP address, timestamp, device user agent) is logged strictly for fraud prevention, rate limiting, and vote validation. Data is never sold or shared with third parties.
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900 shrink-0 flex justify-end z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-md shadow-blue-600/30"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
