import React from 'react';
import { Award, Smartphone, CheckCircle, ShieldCheck } from 'lucide-react';

/**
 * Printable Mode A General Voting Poster / Counter Display (Letter / A4)
 */
export default function PrintPosterView({ qrDataUrl, campaignName, branchName }) {
  return (
    <div className="bg-white text-slate-900 w-[550px] min-h-[750px] rounded-3xl border-4 border-blue-900 shadow-2xl p-8 flex flex-col justify-between relative overflow-hidden font-sans mx-auto my-6 print:m-0 print:border-none print:shadow-none">
      {/* Top Banner */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-500" />

      {/* Header */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-100 text-blue-900 font-extrabold text-xs tracking-wider uppercase mb-3">
          <Award className="w-4 h-4 text-amber-600" />
          <span>Customer Choice Recognition</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Vote for Service Master of the Month
        </h1>
        <p className="text-sm font-semibold text-blue-700 mt-1">
          {branchName ? `${branchName} &bull; ` : ''}{campaignName || 'Official Monthly Campaign'}
        </p>
      </div>

      {/* Center QR Display */}
      <div className="my-auto flex flex-col items-center">
        <div className="w-64 h-64 bg-slate-50 p-4 rounded-3xl border-2 border-slate-300 shadow-xl flex items-center justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="General Voting QR Code" className="w-full h-full object-contain" />
          ) : (
            <div className="text-sm text-slate-400">Loading QR...</div>
          )}
        </div>

        <div className="mt-4 text-center">
          <div className="text-sm font-extrabold text-slate-900 uppercase tracking-widest flex items-center justify-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Point Your Phone Camera to Scan</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            No app download required &bull; Takes less than 15 seconds
          </p>
        </div>
      </div>

      {/* 3 Simple Steps */}
      <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
        <div className="flex flex-col items-center">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-1">
            1
          </span>
          <span className="text-[11px] font-bold text-slate-800">Scan QR</span>
          <span className="text-[9px] text-slate-500">With your mobile camera</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-1">
            2
          </span>
          <span className="text-[11px] font-bold text-slate-800">Select SM</span>
          <span className="text-[9px] text-slate-500">Pick who served you</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-1">
            3
          </span>
          <span className="text-[11px] font-bold text-slate-800">Confirm</span>
          <span className="text-[9px] text-slate-500">Vote recorded instantly</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>One authenticated vote per customer per day</span>
        </span>
        <span>Secure & Anonymous</span>
      </div>
    </div>
  );
}
