import React, { useState, useEffect } from 'react';
import { QrCode, Printer, Download, Eye, Smartphone, Award, Users } from 'lucide-react';
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

  const { error, info } = useToast();

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
    if (activeTab === 'batch' && allQRs.length === 0) {
      loadAllSMQRs();
    }
  }, [activeTab]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    info(`Downloaded ${filename}`);
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
          />
        )}

        {activeTab === 'batch' && (
          <div className="grid grid-cols-2 gap-4 p-4">
            {allQRs.map((item) => (
              <PrintBadgeView
                key={item.sm.id}
                sm={item.sm}
                qrDataUrl={item.qrDataUrl}
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
                  onClick={() => generalQR && handleDownload(generalQR.qrDataUrl, 'general-voting-qr.png')}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR Image (PNG)</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Full Poster (Letter/A4)</span>
                </button>
              </div>
            </div>

            {/* Poster Preview */}
            <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex items-center justify-center overflow-x-auto">
              {generalQR ? (
                <div className="scale-90 sm:scale-100 origin-center">
                  <PrintPosterView
                    qrDataUrl={generalQR.qrDataUrl}
                    campaignName={campaign?.name}
                    branchName={branchLabel}
                  />
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
              <h3 className="text-sm font-bold text-white">Select Service Master</h3>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Service Master</label>
                <select
                  value={selectedSMId}
                  onChange={(e) => setSelectedSMId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {sms.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.branch} - {s.station})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Direct Voting Link</label>
                <div className="font-mono text-[11px] p-2 bg-slate-900 rounded-xl text-indigo-400 break-all border border-slate-700">
                  {smQR?.targetUrl || `${window.location.origin}/vote/sm/${selectedSMId}`}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/60 space-y-2">
                <button
                  onClick={() => smQR && handleDownload(smQR.qrDataUrl, `badge-qr-${selectedSM?.name.toLowerCase().replace(/\s+/g, '-')}.png`)}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Badge QR Image</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Single Badge</span>
                </button>
              </div>
            </div>

            {/* Badge Preview */}
            <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex items-center justify-center">
              {smQR && selectedSM ? (
                <PrintBadgeView sm={selectedSM} qrDataUrl={smQR.qrDataUrl} />
              ) : (
                <div className="py-20 text-slate-500 text-xs">Generating SM badge...</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Batch Print All Badges */}
        {activeTab === 'batch' && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/80">
              <div>
                <h3 className="text-base font-bold text-white">Batch Lanyard Badges ({allQRs.length} SMs)</h3>
                <p className="text-xs text-slate-400">
                  Ready to print on standard card stock or sticker sheets for employee lanyards
                </p>
              </div>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
              >
                <Printer className="w-4 h-4" />
                <span>Print All {allQRs.length} Badges</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              {allQRs.map((item) => (
                <div key={item.sm.id} className="scale-95 origin-top">
                  <PrintBadgeView sm={item.sm} qrDataUrl={item.qrDataUrl} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
