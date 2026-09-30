import React, { useEffect } from 'react';
import { Award, Check, X, ShieldAlert } from 'lucide-react';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, sm, loading }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !sm) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl text-center relative overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow circles */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors z-20 disabled:opacity-50"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 overscroll-contain relative">
          <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-amber-400 to-blue-600 shadow-xl mb-4">
            <img
              src={sm.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80'}
              alt={sm.name}
              className="w-full h-full object-cover rounded-full bg-slate-800"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Confirm Your Vote</span>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight mb-1">{sm.name}</h3>
          <p className="text-xs text-blue-400 font-medium">{sm.branch} &bull; {sm.station}</p>
          <p className="text-xs text-slate-400 mt-2 px-2">
            You are casting your official vote for Service Master of the Month. Each customer can cast 1 vote per day.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={onConfirm}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirm Vote</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
