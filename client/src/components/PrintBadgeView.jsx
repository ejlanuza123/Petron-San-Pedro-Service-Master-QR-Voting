import React from 'react';
import { Award, QrCode } from 'lucide-react';

/**
 * Printable ID Badge Template (Standard 3.375" x 2.125" CR80 Badge / Lanyard Card)
 */
export default function PrintBadgeView({ sm, qrDataUrl }) {
  if (!sm) return null;

  return (
    <div className="bg-white text-slate-900 w-[340px] h-[480px] rounded-2xl border-2 border-slate-300 shadow-xl p-5 flex flex-col justify-between relative overflow-hidden font-sans mx-auto my-4 print:my-0 print:border-none print:shadow-none">
      {/* Top Header Stripe */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-500" />

      {/* Top Badge Info */}
      <div className="text-center pt-2">
        <div className="flex items-center justify-center gap-1.5 text-blue-900 font-extrabold text-xs uppercase tracking-wider">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Service Master Nominee</span>
        </div>
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
          {sm.branch || 'Service Center'}
        </p>
      </div>

      {/* Photo & Name */}
      <div className="flex flex-col items-center my-auto">
        <div className="w-24 h-24 rounded-full p-1 border-2 border-blue-600 shadow-md mb-2 overflow-hidden bg-slate-100">
          <img
            src={sm.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80'}
            alt={sm.name}
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        <h3 className="font-extrabold text-lg text-slate-900 text-center tracking-tight leading-snug">
          {sm.name}
        </h3>
        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full mt-1 border border-blue-200">
          {sm.station || 'Service Specialist'}
        </span>
      </div>

      {/* QR Code Section */}
      <div className="flex flex-col items-center bg-slate-50 rounded-xl p-3 border border-slate-200">
        <div className="w-28 h-28 bg-white p-1 rounded-lg border border-slate-300 shadow-inner flex items-center justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR Code for ${sm.name}`} className="w-full h-full object-contain" />
          ) : (
            <QrCode className="w-16 h-16 text-slate-400" />
          )}
        </div>
        <div className="mt-1.5 text-center">
          <div className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
            Scan to Vote Directly
          </div>
          <div className="text-[8px] text-slate-500">
            Open camera on your phone
          </div>
        </div>
      </div>

      {/* Footer stripe */}
      <div className="text-[8px] text-center text-slate-400 font-medium">
        Official Voting Badge &bull; SM ID: {sm.id}
      </div>
    </div>
  );
}
