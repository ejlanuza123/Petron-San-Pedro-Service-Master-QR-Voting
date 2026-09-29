import React from 'react';
import { Award, QrCode, Smartphone, Sparkles } from 'lucide-react';

/**
 * Printable ID Badge Template with Dynamic Layout & Customization
 * Supports:
 * - 'full': Standard CR80 Portrait Badge with Photo, Name, Station, and QR
 * - 'name_only': Clean layout removing photo, highlighting Name + large QR
 * - 'qr_only': Minimalist sticker / table-tent focusing on the QR code with name label
 * - 'horizontal': Landscape counter / desktop display card
 */
export default function PrintBadgeView({
  sm,
  qrDataUrl,
  layout = 'full', // 'full' | 'name_only' | 'qr_only' | 'horizontal'
  showPhoto = true,
  showStation = true,
  showBranch = true,
  showInstructions = true,
  showNomineeRibbon = true,
  theme = 'petron', // 'petron' | 'dark' | 'emerald' | 'amber'
  customSubtitle = ''
}) {
  if (!sm) return null;

  // Theme styling helpers
  const themes = {
    petron: {
      isDark: false,
      cardBg: 'bg-white text-slate-900 border-slate-300',
      topStripe: 'bg-gradient-to-r from-[#003882] via-[#0052b4] to-[#e31837]',
      ribbonText: 'text-[#003882]',
      ribbonIcon: 'text-amber-500',
      photoBorder: 'border-[#003882]',
      stationPill: 'text-[#003882] bg-blue-50 border-blue-200',
      qrBox: 'bg-slate-50 border-slate-200',
      qrInner: 'bg-white border-slate-300',
      instructionHead: 'text-slate-800',
      instructionSub: 'text-slate-500',
      footerText: 'text-slate-400'
    },
    dark: {
      isDark: true,
      cardBg: 'bg-slate-950 text-white border-slate-800 shadow-2xl',
      topStripe: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600',
      ribbonText: 'text-amber-400',
      ribbonIcon: 'text-amber-400',
      photoBorder: 'border-amber-400',
      stationPill: 'text-amber-300 bg-amber-400/10 border-amber-400/30',
      qrBox: 'bg-slate-900 border-slate-800',
      qrInner: 'bg-white border-slate-700',
      instructionHead: 'text-white',
      instructionSub: 'text-slate-400',
      footerText: 'text-slate-500'
    },
    emerald: {
      isDark: false,
      cardBg: 'bg-white text-slate-900 border-slate-300',
      topStripe: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600',
      ribbonText: 'text-emerald-800',
      ribbonIcon: 'text-emerald-500',
      photoBorder: 'border-emerald-600',
      stationPill: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      qrBox: 'bg-emerald-50/50 border-emerald-100',
      qrInner: 'bg-white border-slate-300',
      instructionHead: 'text-slate-800',
      instructionSub: 'text-slate-500',
      footerText: 'text-slate-400'
    },
    amber: {
      isDark: false,
      cardBg: 'bg-white text-slate-900 border-slate-300',
      topStripe: 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500',
      ribbonText: 'text-amber-900',
      ribbonIcon: 'text-amber-500',
      photoBorder: 'border-amber-500',
      stationPill: 'text-amber-800 bg-amber-50 border-amber-200',
      qrBox: 'bg-amber-50/50 border-amber-100',
      qrInner: 'bg-white border-slate-300',
      instructionHead: 'text-slate-800',
      instructionSub: 'text-slate-500',
      footerText: 'text-slate-400'
    }
  };

  const t = themes[theme] || themes.petron;
  const effectiveShowPhoto = layout === 'full' && showPhoto;

  // LAYOUT 1: QR ONLY / MINIMAL STICKER
  if (layout === 'qr_only') {
    return (
      <div
        data-badge-card="true"
        className={`${t.cardBg} w-[280px] h-[350px] rounded-2xl border-2 shadow-xl p-5 flex flex-col justify-between relative overflow-hidden font-sans mx-auto print:my-0 print:border-none print:shadow-none print:break-inside-avoid`}
      >
        {/* Top Header Stripe */}
        <div className={`absolute top-0 left-0 right-0 h-3.5 ${t.topStripe}`} />

        {/* Header Tag */}
        {showNomineeRibbon && (
          <div className="text-center pt-2">
            <div className={`flex items-center justify-center gap-1.5 ${t.ribbonText} font-extrabold text-[11px] uppercase tracking-wider`}>
              <Award className={`w-3.5 h-3.5 ${t.ribbonIcon}`} />
              <span>Vote For Service Master</span>
            </div>
          </div>
        )}

        {/* Center QR Matrix */}
        <div className="flex flex-col items-center my-auto">
          <div className={`p-2.5 rounded-2xl ${t.qrInner} shadow-md flex items-center justify-center`}>
            <div className="w-40 h-40 bg-white flex items-center justify-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`QR Code for ${sm.name}`} className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-24 h-24 text-slate-400" />
              )}
            </div>
          </div>
          <h3 className="font-extrabold text-base text-center tracking-tight mt-2.5 leading-tight">
            {sm.name}
          </h3>
          {(showStation || showBranch) && (
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              {[showStation ? sm.station : null, showBranch ? sm.branch : null].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>

        {/* Bottom Tag */}
        <div className="text-center">
          {showInstructions && (
            <div className={`text-[10px] font-extrabold ${t.instructionHead} uppercase tracking-wider`}>
              {customSubtitle || 'Scan with Camera to Vote'}
            </div>
          )}
          <div className={`text-[8px] ${t.footerText} font-mono mt-0.5`}>
            SM ID: {sm.id}
          </div>
        </div>
      </div>
    );
  }

  // LAYOUT 2: NAME ONLY / PHOTO-FREE (Just QR with Names)
  if (layout === 'name_only') {
    return (
      <div
        data-badge-card="true"
        className={`${t.cardBg} w-[340px] h-[480px] rounded-2xl border-2 shadow-xl p-5 flex flex-col justify-between relative overflow-hidden font-sans mx-auto print:my-0 print:border-none print:shadow-none print:break-inside-avoid`}
      >
        {/* Top Header Stripe */}
        <div className={`absolute top-0 left-0 right-0 h-4 ${t.topStripe}`} />

        {/* Top Badge Info */}
        {showNomineeRibbon && (
          <div className="text-center pt-2">
            <div className={`flex items-center justify-center gap-1.5 ${t.ribbonText} font-extrabold text-xs uppercase tracking-wider`}>
              <Award className={`w-4 h-4 ${t.ribbonIcon}`} />
              <span>Service Master Nominee</span>
            </div>
            {showBranch && (
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
                {sm.branch || 'Petron Service Station'}
              </p>
            )}
          </div>
        )}

        {/* Prominent Name Header (No Photo) */}
        <div className="text-center my-1 space-y-1.5">
          <div className="inline-block p-1">
            <h2 className="font-black text-2xl tracking-tight leading-tight">
              {sm.name}
            </h2>
          </div>
          {showStation && (
            <div>
              <span className={`inline-block text-[11px] font-bold px-3 py-0.5 rounded-full border ${t.stationPill}`}>
                {sm.station || 'Service Specialist'}
              </span>
            </div>
          )}
        </div>

        {/* High-Visibility Large QR Code */}
        <div className={`flex flex-col items-center rounded-2xl p-4 border ${t.qrBox}`}>
          <div className={`p-2 rounded-xl ${t.qrInner} shadow-inner flex items-center justify-center`}>
            <div className="w-36 h-36 bg-white flex items-center justify-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`QR Code for ${sm.name}`} className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-20 h-20 text-slate-400" />
              )}
            </div>
          </div>
          {showInstructions && (
            <div className="mt-2 text-center">
              <div className={`text-[11px] font-extrabold ${t.instructionHead} uppercase tracking-wider`}>
                {customSubtitle || 'Scan to Vote Directly'}
              </div>
              <div className={`text-[9px] ${t.instructionSub} mt-0.5`}>
                Point phone camera &bull; Fast 10-sec ballot
              </div>
            </div>
          )}
        </div>

        {/* Footer stripe */}
        <div className={`text-[8px] text-center ${t.footerText} font-medium`}>
          Official Voting Badge &bull; SM ID: {sm.id}
        </div>
      </div>
    );
  }

  // LAYOUT 3: HORIZONTAL / COUNTER TENT
  if (layout === 'horizontal') {
    return (
      <div
        data-badge-card="true"
        className={`${t.cardBg} w-[480px] h-[270px] rounded-2xl border-2 shadow-xl p-5 flex flex-col justify-between relative overflow-hidden font-sans mx-auto print:my-0 print:border-none print:shadow-none print:break-inside-avoid`}
      >
        {/* Top Header Stripe */}
        <div className={`absolute top-0 left-0 right-0 h-3.5 ${t.topStripe}`} />

        <div className="grid grid-cols-2 gap-4 h-full pt-2">
          {/* Left Column: SM Info */}
          <div className="flex flex-col justify-between">
            <div>
              {showNomineeRibbon && (
                <div className={`flex items-center gap-1.5 ${t.ribbonText} font-extrabold text-[10px] uppercase tracking-wider mb-2`}>
                  <Award className={`w-3.5 h-3.5 ${t.ribbonIcon}`} />
                  <span>Service Master</span>
                </div>
              )}
              {showPhoto && sm.photo_url && (
                <div className={`w-16 h-16 rounded-full p-0.5 border-2 ${t.photoBorder} shadow-sm overflow-hidden mb-2`}>
                  <img
                    crossOrigin="anonymous"
                    src={sm.photo_url}
                    alt={sm.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              )}
              <h3 className="font-extrabold text-lg tracking-tight leading-snug">
                {sm.name}
              </h3>
              {showStation && (
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${t.stationPill}`}>
                  {sm.station || 'Service Specialist'}
                </span>
              )}
            </div>

            {showBranch && (
              <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                {sm.branch || 'Petron San Pedro'}
              </p>
            )}
          </div>

          {/* Right Column: QR & Action */}
          <div className={`flex flex-col items-center justify-center rounded-xl p-3 border ${t.qrBox}`}>
            <div className={`p-1.5 rounded-lg ${t.qrInner} shadow-inner flex items-center justify-center`}>
              <div className="w-28 h-28 bg-white flex items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt={`QR Code for ${sm.name}`} className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-16 h-16 text-slate-400" />
                )}
              </div>
            </div>
            {showInstructions && (
              <div className="mt-1.5 text-center">
                <div className={`text-[10px] font-extrabold ${t.instructionHead} uppercase tracking-wider`}>
                  {customSubtitle || 'Scan to Vote'}
                </div>
                <div className={`text-[8px] ${t.instructionSub}`}>
                  Point camera &bull; Instant vote
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer stripe */}
        <div className={`text-[8px] text-right ${t.footerText} font-mono pt-1`}>
          SM ID: {sm.id}
        </div>
      </div>
    );
  }

  // DEFAULT / LAYOUT 4: STANDARD FULL PORTRAIT BADGE
  return (
    <div
      data-badge-card="true"
      className={`${t.cardBg} w-[340px] h-[480px] rounded-2xl border-2 shadow-xl p-5 flex flex-col justify-between relative overflow-hidden font-sans mx-auto print:my-0 print:border-none print:shadow-none print:break-inside-avoid`}
    >
      {/* Top Header Stripe */}
      <div className={`absolute top-0 left-0 right-0 h-4 ${t.topStripe}`} />

      {/* Top Badge Info */}
      {showNomineeRibbon && (
        <div className="text-center pt-2">
          <div className={`flex items-center justify-center gap-1.5 ${t.ribbonText} font-extrabold text-xs uppercase tracking-wider`}>
            <Award className={`w-4 h-4 ${t.ribbonIcon}`} />
            <span>Service Master Nominee</span>
          </div>
          {showBranch && (
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
              {sm.branch || 'Service Center'}
            </p>
          )}
        </div>
      )}

      {/* Photo & Name */}
      <div className="flex flex-col items-center my-auto">
        {effectiveShowPhoto && (
          <div className={`w-24 h-24 rounded-full p-1 border-2 ${t.photoBorder} shadow-md mb-2 overflow-hidden bg-slate-100`}>
            <img
              crossOrigin="anonymous"
              src={sm.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80'}
              alt={sm.name}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        )}
        <h3 className="font-extrabold text-lg text-center tracking-tight leading-snug">
          {sm.name}
        </h3>
        {showStation && (
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1 border ${t.stationPill}`}>
            {sm.station || 'Service Specialist'}
          </span>
        )}
      </div>

      {/* QR Code Section */}
      <div className={`flex flex-col items-center rounded-xl p-3 border ${t.qrBox}`}>
        <div className={`w-28 h-28 p-1 rounded-lg ${t.qrInner} shadow-inner flex items-center justify-center`}>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR Code for ${sm.name}`} className="w-full h-full object-contain" />
          ) : (
            <QrCode className="w-16 h-16 text-slate-400" />
          )}
        </div>
        {showInstructions && (
          <div className="mt-1.5 text-center">
            <div className={`text-[10px] font-extrabold ${t.instructionHead} uppercase tracking-wider`}>
              {customSubtitle || 'Scan to Vote Directly'}
            </div>
            <div className={`text-[8px] ${t.instructionSub}`}>
              Open camera on your phone
            </div>
          </div>
        )}
      </div>

      {/* Footer stripe */}
      <div className={`text-[8px] text-center ${t.footerText} font-medium`}>
        Official Voting Badge &bull; SM ID: {sm.id}
      </div>
    </div>
  );
}
