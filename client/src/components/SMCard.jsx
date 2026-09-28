import React from 'react';
import { Award, MapPin, Clock, Check } from 'lucide-react';

export default function SMCard({ sm, onVote, disabled, selected }) {
  return (
    <div
      className={`group relative bg-slate-800/80 hover:bg-slate-800 border rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between shadow-lg ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-blue-500/10'
          : 'border-slate-750 hover:border-slate-600'
      }`}
    >
      <div>
        {/* Photo and Badge */}
        <div className="relative mb-4">
          <div className="w-full h-44 sm:h-48 rounded-xl overflow-hidden bg-slate-900">
            <img
              src={sm.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80'}
              alt={sm.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>

          <div className="absolute top-2.5 right-2.5 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/60 text-[11px] font-semibold text-amber-300 flex items-center gap-1 shadow-md">
            <Award className="w-3 h-3 text-amber-400" />
            <span>Nominee</span>
          </div>

          <div className="absolute bottom-2.5 left-2.5 bg-blue-950/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-blue-500/30 text-[10px] font-bold text-blue-300 uppercase tracking-wider">
            {sm.station || 'Bay 1'}
          </div>
        </div>

        {/* Info */}
        <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">
          {sm.name}
        </h4>

        <div className="mt-2 space-y-1 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{sm.branch}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{sm.shift || 'Regular Shift'}</span>
          </div>
        </div>

        {sm.bio && (
          <p className="mt-3 text-xs text-slate-400/90 line-clamp-2 italic leading-relaxed">
            "{sm.bio}"
          </p>
        )}
      </div>

      {/* Action */}
      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <button
          onClick={() => onVote(sm)}
          disabled={disabled}
          className={`w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            disabled
              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 active:scale-[0.98]'
          }`}
        >
          <Award className="w-4 h-4 text-amber-300" />
          <span>Vote for {sm.name.split(' ')[0]}</span>
        </button>
      </div>
    </div>
  );
}
