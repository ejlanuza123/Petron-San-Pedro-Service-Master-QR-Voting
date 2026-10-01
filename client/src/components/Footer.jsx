import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export default function Footer({ onOpenPrivacy }) {
  return (
    <footer className="no-print border-t border-slate-800/80 bg-slate-950 py-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Cheat-Resistant QR Voting Architecture &copy; 2026. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onOpenPrivacy}
            className="flex items-center gap-1 hover:text-blue-400 transition-colors underline-offset-4 hover:underline"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Voter Privacy & Anti-Fraud Notice</span>
          </button>
          <span className="text-slate-600">&bull;</span>
          <span className="text-slate-500">v1.11.0</span>
        </div>
      </div>
    </footer>
  );
}
