import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Printer,
  Download,
  Eye,
  Smartphone,
  Award,
  Users,
  LayoutTemplate,
  Palette,
  Sliders,
  Type,
  Check,
  Sparkles,
  Loader2
} from 'lucide-react';
import { toPng } from 'html-to-image';
import api from '../../services/api';
import PrintBadgeView from '../../components/PrintBadgeView';
import PrintPosterView from '../../components/PrintPosterView';
import { useToast } from '../../context/ToastContext';

export default function QRStudioPage({ sms = [], campaign }) {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'sms' | 'batch'
  const [generalQR, setGeneralQR] = useState(null);
  const [selectedSMId, setSelectedSMId] = useState(sms[0]?.id || '');
  const [smQR, setSmQR] = useState(null);
  const [allQRs, setAllQRs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchLabel, setBranchLabel] = useState('Petron San Pedro Main');

  // Preview DOM refs for full layout PNG capture
  const badgePreviewRef = useRef(null);
  const posterPreviewRef = useRef(null);
  const [downloadingBadge, setDownloadingBadge] = useState(false);
  const [downloadingPoster, setDownloadingPoster] = useState(false);

  // Badge layout & styling customization state
  const [badgeLayout, setBadgeLayout] = useState('full'); // 'full' | 'name_only' | 'qr_only' | 'horizontal'
  const [badgeTheme, setBadgeTheme] = useState('petron'); // 'petron' | 'dark' | 'emerald' | 'amber'
  const [showPhoto, setShowPhoto] = useState(true);
  const [showStation, setShowStation] = useState(true);
  const [showBranch, setShowBranch] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showNomineeRibbon, setShowNomineeRibbon] = useState(true);
  const [customSubtitle, setCustomSubtitle] = useState('');

  const { error, info } = useToast();

  // Keep selected SM in sync when SMs load asynchronously
  useEffect(() => {
    if (sms.length > 0) {
      if (!selectedSMId || !sms.some((s) => s.id === selectedSMId)) {
        setSelectedSMId(sms[0].id);
      }
    }
  }, [sms, selectedSMId]);

  const loadGeneralQR = async () => {
    try {
      setLoading(true);
      const res = await api.getGeneralQR(window.location.origin);
      setGeneralQR(res);
    } catch (err) {
      error('Failed to generate General QR code');
    } finally {
      setLoading(false);
    }
  };

  const loadSMQR = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getSMQR(id, window.location.origin);
      setSmQR(res);
    } catch (err) {
      error('Failed to generate SM QR code');
    } finally {
      setLoading(false);
    }
  };

  const loadAllSMQRs = async () => {
    try {
      setLoading(true);
      const res = await api.getAllSMQRs(window.location.origin);
      setAllQRs(res.batch || []);
    } catch (err) {
      error('Failed to batch generate QR codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeneralQR();
  }, []);

  useEffect(() => {
    if (selectedSMId) {
      loadSMQR(selectedSMId);
    }
  }, [selectedSMId]);

  useEffect(() => {
    if (activeTab === 'batch') {
      loadAllSMQRs();
    }
  }, [activeTab]);

  const handlePrint = () => {
    window.print();
  };

  // Convert SVG Data URL or SVG string to a crisp 1024x1024 PNG file for download
  const downloadAsPNG = (svgContentOrDataUrl, filename = 'qr-code.png', size = 1024) => {
    if (!svgContentOrDataUrl) {
      error('QR code not ready yet');
      return;
    }

    try {
      let svgText = '';
      if (svgContentOrDataUrl.startsWith('data:image/svg+xml;base64,')) {
        svgText = atob(svgContentOrDataUrl.replace('data:image/svg+xml;base64,', ''));
      } else if (svgContentOrDataUrl.startsWith('<svg')) {
        svgText = svgContentOrDataUrl;
      } else {
        svgText = decodeURIComponent(svgContentOrDataUrl.replace(/^data:image\/svg\+xml;?utf8,/, ''));
      }

      // Ensure explicit width and height on SVG
      if (!svgText.includes('width=') || !svgText.includes('height=')) {
        svgText = svgText.replace('<svg', `<svg width="${size}" height="${size}"`);
      }

      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, size, size);

          URL.revokeObjectURL(blobUrl);

          canvas.toBlob((pngBlob) => {
            if (!pngBlob) {
              fallbackDownload(svgContentOrDataUrl, filename);
              return;
            }
            const pngUrl = URL.createObjectURL(pngBlob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(pngUrl), 2000);
            info(`Downloaded ${filename} as PNG image`);
          }, 'image/png');
        } catch (e) {
          console.error('Canvas export error:', e);
          URL.revokeObjectURL(blobUrl);
          fallbackDownload(svgContentOrDataUrl, filename);
        }
      };

      img.onerror = (e) => {
        console.error('Image load error:', e);
        URL.revokeObjectURL(blobUrl);
        fallbackDownload(svgContentOrDataUrl, filename);
      };

      img.src = blobUrl;
    } catch (err) {
      console.error('PNG conversion error:', err);
      fallbackDownload(svgContentOrDataUrl, filename);
    }
  };

  // Download raw SVG vector file
  const downloadAsSVG = (svgContentOrDataUrl, filename = 'qr-code.svg') => {
    if (!svgContentOrDataUrl) {
      error('QR code not ready yet');
      return;
    }
    let url = svgContentOrDataUrl;
    let revoke = false;
    try {
      if (svgContentOrDataUrl.startsWith('data:image/svg+xml;base64,')) {
        const base64 = svgContentOrDataUrl.replace('data:image/svg+xml;base64,', '');
        const svgText = atob(base64);
        const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        url = URL.createObjectURL(blob);
        revoke = true;
      } else if (svgContentOrDataUrl.startsWith('<svg')) {
        const blob = new Blob([svgContentOrDataUrl], { type: 'image/svg+xml;charset=utf-8' });
        url = URL.createObjectURL(blob);
        revoke = true;
      }
    } catch (e) {
      url = svgContentOrDataUrl;
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (revoke) {
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    info(`Downloaded ${filename}`);
  };

  const fallbackDownload = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    info(`Downloaded ${filename}`);
  };

  // Export full customized badge layout (with photo or no-photo, name, theme colors, etc.) as high-res PNG
  const downloadCustomizedBadge = async () => {
    if (!badgePreviewRef.current) {
      error('Badge preview is not loaded yet');
      return;
    }

    try {
      setDownloadingBadge(true);
      const cardEl = badgePreviewRef.current.querySelector('[data-badge-card="true"]') || badgePreviewRef.current;

      const dataUrl = await toPng(cardEl, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: badgeTheme === 'dark' ? '#020617' : '#ffffff'
      });

      const safeName = (selectedSM?.name || 'badge').toLowerCase().replace(/\s+/g, '-');
      const filename = `custom-badge-${safeName}-${badgeLayout}.png`;

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      info(`Downloaded customized ${badgeLayout.replace('_', ' ')} badge layout!`);
    } catch (err) {
      console.warn('Direct badge export encountered an issue, trying filtered export:', err);
      try {
        const cardEl = badgePreviewRef.current.querySelector('[data-badge-card="true"]') || badgePreviewRef.current;
        const dataUrl = await toPng(cardEl, {
          pixelRatio: 2,
          filter: (node) => {
            if (node.tagName === 'IMG' && node.src && !node.src.startsWith('data:') && !node.src.startsWith(window.location.origin)) {
              return false;
            }
            return true;
          }
        });

        const safeName = (selectedSM?.name || 'badge').toLowerCase().replace(/\s+/g, '-');
        const filename = `custom-badge-${safeName}-${badgeLayout}.png`;

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        info(`Downloaded customized badge layout!`);
      } catch (e2) {
        console.error('Badge image generation error:', e2);
        error('Could not generate full card image due to image CORS policy. Downloading raw QR code instead.');
        if (smQR) {
          downloadAsPNG(smQR.qrDataUrl, `badge-qr-${(selectedSM?.name || 'sm').toLowerCase().replace(/\s+/g, '-')}.png`);
        }
      }
    } finally {
      setDownloadingBadge(false);
    }
  };

  // Export full Mode A voting poster as high-res PNG
  const downloadCustomizedPoster = async () => {
    if (!posterPreviewRef.current) {
      error('Poster preview is not loaded yet');
      return;
    }

    try {
      setDownloadingPoster(true);
      const cardEl = posterPreviewRef.current.querySelector('[data-poster-card="true"]') || posterPreviewRef.current;

      const dataUrl = await toPng(cardEl, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff'
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'general-voting-poster.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      info('Downloaded full voting poster image (PNG)!');
    } catch (err) {
      console.error('Poster export error:', err);
      error('Could not export full poster. Downloading raw QR code instead.');
      if (generalQR) {
        downloadAsPNG(generalQR.qrDataUrl, 'general-voting-qr.png');
      }
    } finally {
      setDownloadingPoster(false);
    }
  };

  const selectedSM = sms.find((s) => s.id === selectedSMId) || sms[0];

  return (
    <div className="space-y-6">
      {/* Printable Containers (rendered only when window.print() is executed) */}
      <div className="print-area hidden">
        {activeTab === 'general' && generalQR && (
          <PrintPosterView
            qrDataUrl={generalQR.qrDataUrl}
            campaignName={campaign?.name}
            branchName={branchLabel}
          />
        )}

        {activeTab === 'sms' && smQR && selectedSM && (
          <PrintBadgeView
            sm={selectedSM}
            qrDataUrl={smQR.qrDataUrl}
            layout={badgeLayout}
            theme={badgeTheme}
            showPhoto={showPhoto}
            showStation={showStation}
            showBranch={showBranch}
            showInstructions={showInstructions}
            showNomineeRibbon={showNomineeRibbon}
            customSubtitle={customSubtitle}
          />
        )}

        {activeTab === 'batch' && (
          <div className={badgeLayout === 'horizontal' ? 'grid grid-cols-1 gap-6 p-4' : 'grid grid-cols-2 gap-4 p-4'}>
            {allQRs.map((item) => (
              <PrintBadgeView
                key={item.sm.id}
                sm={item.sm}
                qrDataUrl={item.qrDataUrl}
                layout={badgeLayout}
                theme={badgeTheme}
                showPhoto={showPhoto}
                showStation={showStation}
                showBranch={showBranch}
                showInstructions={showInstructions}
                showNomineeRibbon={showNomineeRibbon}
                customSubtitle={customSubtitle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Screen Interface (no-print) */}
      <div className="no-print space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-400" />
              <span>QR Code Studio & Print Center</span>
            </h2>
            <p className="text-xs text-slate-400">
              Generate, customize, and print high-resolution QR codes for counter posters and employee badges
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Layout Now</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-700/80 pb-3">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'general'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mode A: General Voting Poster</span>
          </button>

          <button
            onClick={() => setActiveTab('sms')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'sms'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Mode B: Individual SM Badge</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'batch'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Batch Print All Badges ({sms.length})</span>
          </button>
        </div>

        {/* Tab 1: General Poster Preview */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white">Poster Customization</h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Branch / Station Title</label>
                <input
                  type="text"
                  value={branchLabel}
                  onChange={(e) => setBranchLabel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Destination Target URL</label>
                <div className="font-mono text-[11px] p-2 bg-slate-900 rounded-xl text-blue-400 break-all border border-slate-700">
                  {generalQR?.targetUrl || `${window.location.origin}/vote`}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/60 space-y-2">
                <button
                  onClick={downloadCustomizedPoster}
                  disabled={downloadingPoster || !generalQR}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30"
                >
                  {downloadingPoster ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>{downloadingPoster ? 'Exporting Poster PNG...' : 'Download Full Poster (PNG)'}</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => generalQR && downloadAsPNG(generalQR.qrDataUrl, 'general-voting-qr.png')}
                    disabled={!generalQR}
                    className="w-full py-2 px-2.5 rounded-xl text-[11px] font-semibold bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Raw QR (PNG)</span>
                  </button>
                  <button
                    onClick={() => generalQR && downloadAsSVG(generalQR.svg || generalQR.qrDataUrl, 'general-voting-qr.svg')}
                    disabled={!generalQR}
                    className="w-full py-2 px-2.5 rounded-xl text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Vector (SVG)</span>
                  </button>
                </div>
                <button
                  onClick={handlePrint}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Full Poster (Letter/A4)</span>
                </button>
              </div>
            </div>

            {/* Poster Preview */}
            <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center overflow-x-auto min-h-[500px]">
              {generalQR ? (
                <div className="scale-90 sm:scale-100 origin-center flex flex-col items-center">
                  <div ref={posterPreviewRef} className="inline-block p-1">
                    <PrintPosterView
                      qrDataUrl={generalQR.qrDataUrl}
                      campaignName={campaign?.name}
                      branchName={branchLabel}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-4 text-center">
                    This exact poster layout will be exported when clicking &ldquo;Download Full Poster (PNG)&rdquo;
                  </p>
                </div>
              ) : (
                <div className="py-20 text-slate-500 text-xs">Generating high-res QR code...</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Individual SM Badge */}
        {activeTab === 'sms' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Service Master Badge Studio</span>
              </h3>

              {/* Service Master Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Service Master</label>
                <select
                  value={selectedSMId}
                  onChange={(e) => setSelectedSMId(e.target.value)}
                  disabled={sms.length === 0}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {sms.length === 0 ? (
                    <option value="">No Service Masters Available</option>
                  ) : (
                    sms.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.branch} - {s.station})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Direct Voting URL */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Direct Voting Target</label>
                <div className="font-mono text-[11px] p-2 bg-slate-900 rounded-xl text-indigo-400 break-all border border-slate-700">
                  {smQR?.targetUrl || (selectedSMId ? `${window.location.origin}/vote/sm/${selectedSMId}` : 'Select a Service Master')}
                </div>
              </div>

              {/* Layout Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-700/60">
                <label className="block text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <LayoutTemplate className="w-3.5 h-3.5 text-blue-400" />
                    Badge Layout Format
                  </span>
                  <span className="text-[10px] font-normal text-blue-400 uppercase tracking-wider">
                    {badgeLayout === 'full' && 'Standard'}
                    {badgeLayout === 'name_only' && 'Name & QR'}
                    {badgeLayout === 'qr_only' && 'Minimal QR'}
                    {badgeLayout === 'horizontal' && 'Desk Tent'}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBadgeLayout('full')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      badgeLayout === 'full'
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                        : 'bg-slate-900/60 border-slate-700/70 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>Standard</span>
                      {badgeLayout === 'full' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Photo + Name + QR</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBadgeLayout('name_only')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      badgeLayout === 'name_only'
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                        : 'bg-slate-900/60 border-slate-700/70 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>Name & QR</span>
                      {badgeLayout === 'name_only' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">No Photo &bull; Ink Saver</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBadgeLayout('qr_only')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      badgeLayout === 'qr_only'
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                        : 'bg-slate-900/60 border-slate-700/70 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>Minimal QR</span>
                      {badgeLayout === 'qr_only' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Sticker / Pump Matrix</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBadgeLayout('horizontal')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      badgeLayout === 'horizontal'
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/50'
                        : 'bg-slate-900/60 border-slate-700/70 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>Desk Tent</span>
                      {badgeLayout === 'horizontal' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Landscape Counter Card</div>
                  </button>
                </div>
              </div>

              {/* Color Theme Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-700/60">
                <label className="block text-xs font-semibold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                    Color Palette
                  </span>
                  <span className="text-[10px] font-normal text-purple-400 capitalize">{badgeTheme}</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'petron', label: 'Petron', color: 'bg-[#003882]' },
                    { id: 'dark', label: 'Obsidian', color: 'bg-slate-950 border border-amber-400' },
                    { id: 'emerald', label: 'Emerald', color: 'bg-emerald-600' },
                    { id: 'amber', label: 'Amber', color: 'bg-amber-500' }
                  ].map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setBadgeTheme(th.id)}
                      className={`px-2 py-1.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        badgeTheme === th.id
                          ? 'bg-slate-700/90 border-blue-400 text-white font-bold ring-1 ring-blue-400/40'
                          : 'bg-slate-900/60 border-slate-700/70 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${th.color} inline-block`} />
                      <span className="text-[10px] truncate max-w-full">{th.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Element Visibility Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-700/60">
                <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Customize Badge Elements</span>
                </label>
                <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-300">
                  {badgeLayout !== 'name_only' && badgeLayout !== 'qr_only' && (
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-700/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={showPhoto}
                        onChange={(e) => setShowPhoto(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span>Show Employee Photo</span>
                    </label>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-700/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={showStation}
                      onChange={(e) => setShowStation(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Show Station Title</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-700/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={showBranch}
                      onChange={(e) => setShowBranch(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Show Branch Name</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-700/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={showNomineeRibbon}
                      onChange={(e) => setShowNomineeRibbon(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Show Nominee Ribbon</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-700/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={showInstructions}
                      onChange={(e) => setShowInstructions(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Show Scan Instructions</span>
                  </label>
                </div>
              </div>

              {/* Custom Tagline */}
              <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
                <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-teal-400" />
                  <span>Custom Scan Tagline</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Scan to Rate My Service!"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Download and Print Actions */}
              <div className="pt-3 border-t border-slate-700/60 space-y-2">
                <button
                  onClick={downloadCustomizedBadge}
                  disabled={downloadingBadge || !selectedSM}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30"
                >
                  {downloadingBadge ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>{downloadingBadge ? 'Exporting Badge PNG...' : 'Download Customized Badge (PNG)'}</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => smQR && downloadAsPNG(smQR.qrDataUrl, `badge-qr-${(selectedSM?.name || 'sm').toLowerCase().replace(/\s+/g, '-')}.png`)}
                    disabled={!smQR}
                    className="w-full py-2 px-2.5 rounded-xl text-[11px] font-semibold bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Raw QR (PNG)</span>
                  </button>
                  <button
                    onClick={() => smQR && downloadAsSVG(smQR.svg || smQR.qrDataUrl, `badge-qr-${(selectedSM?.name || 'sm').toLowerCase().replace(/\s+/g, '-')}.svg`)}
                    disabled={!smQR}
                    className="w-full py-2 px-2.5 rounded-xl text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Vector (SVG)</span>
                  </button>
                </div>
                <button
                  onClick={handlePrint}
                  disabled={!smQR || !selectedSM}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 border border-slate-600 disabled:opacity-50 text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Single Badge</span>
                </button>
              </div>
            </div>

            {/* Badge Preview */}
            <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[500px]">
              {smQR && selectedSM ? (
                <div className="scale-95 sm:scale-100 transition-all flex flex-col items-center">
                  <div ref={badgePreviewRef} className="inline-block p-1">
                    <PrintBadgeView
                      sm={selectedSM}
                      qrDataUrl={smQR.qrDataUrl}
                      layout={badgeLayout}
                      theme={badgeTheme}
                      showPhoto={showPhoto}
                      showStation={showStation}
                      showBranch={showBranch}
                      showInstructions={showInstructions}
                      showNomineeRibbon={showNomineeRibbon}
                      customSubtitle={customSubtitle}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-4 text-center">
                    This exact customized layout will be saved when clicking &ldquo;Download Customized Badge (PNG)&rdquo;
                  </p>
                </div>
              ) : (
                <div className="py-20 text-slate-500 text-xs">
                  {sms.length === 0 ? 'No Service Masters registered yet.' : 'Generating SM badge...'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Batch Print All Badges */}
        {activeTab === 'batch' && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>Batch Lanyard Badges ({allQRs.length} SMs)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a layout below to format all employee badges at once, then print to card stock or stickers
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  disabled={allQRs.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-lg shadow-blue-600/30 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print All {allQRs.length} Badges</span>
                </button>
              </div>
            </div>

            {/* Batch Layout Quick Switcher */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mr-1">
                  <LayoutTemplate className="w-4 h-4 text-blue-400" />
                  <span>Layout Format:</span>
                </span>
                {[
                  { id: 'full', label: 'Standard Portrait' },
                  { id: 'name_only', label: 'Name & QR (Ink Saver)' },
                  { id: 'qr_only', label: 'Minimal Sticker' },
                  { id: 'horizontal', label: 'Desk Tent' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBadgeLayout(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      badgeLayout === item.id
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1 mr-1">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>Theme:</span>
                </span>
                {['petron', 'dark', 'emerald', 'amber'].map((tId) => (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => setBadgeTheme(tId)}
                    className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-all ${
                      badgeTheme === tId
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tId}
                  </button>
                ))}
              </div>
            </div>

            {allQRs.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-xs bg-slate-950 p-6 rounded-2xl border border-slate-800">
                {loading ? 'Generating batch QR codes...' : 'No active Service Masters found to generate badges for.'}
              </div>
            ) : (
              <div className={`grid gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 ${
                badgeLayout === 'horizontal' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {allQRs.map((item) => (
                  <div key={item.sm.id} className="scale-95 origin-top">
                    <PrintBadgeView
                      sm={item.sm}
                      qrDataUrl={item.qrDataUrl}
                      layout={badgeLayout}
                      theme={badgeTheme}
                      showPhoto={showPhoto}
                      showStation={showStation}
                      showBranch={showBranch}
                      showInstructions={showInstructions}
                      showNomineeRibbon={showNomineeRibbon}
                      customSubtitle={customSubtitle}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
