import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, ShieldCheck, Smartphone, Check, 
  X, MapPin, Award, Copy, Loader2 
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import useFingerprint from '../../hooks/useFingerprint';

export default function SMManagementPage({ sms = [], onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSM, setEditingSM] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Pairing state
  const [pairingSM, setPairingSM] = useState(null);
  const [pairingQRData, setPairingQRData] = useState(null);
  const [loadingPairing, setLoadingPairing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [branch, setBranch] = useState('San Pedro Main');
  const [station, setStation] = useState('Bay 1');
  const [shift, setShift] = useState('Day Shift (6AM - 2PM)');
  const [bio, setBio] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState('');
  const [ipRegistered, setIpRegistered] = useState('');

  const { fingerprint } = useFingerprint();
  const { success, error } = useToast();

  const handleOpenPairing = async (sm) => {
    setPairingSM(sm);
    setPairingQRData(null);
    setCopiedLink(false);
    try {
      setLoadingPairing(true);
      const res = await api.getSMPairingQR(sm.id, window.location.origin);
      setPairingQRData(res);
    } catch (err) {
      error(err.message || 'Failed to generate staff pairing QR');
    } finally {
      setLoadingPairing(false);
    }
  };

  const handleCopyPairingLink = () => {
    if (!pairingQRData?.targetUrl) return;
    navigator.clipboard.writeText(pairingQRData.targetUrl);
    setCopiedLink(true);
    success('Pairing link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleUnregisterDevice = async (smId, smName) => {
    if (!confirm(`Are you sure you want to unlink the registered smartphone for ${smName}?`)) return;
    try {
      await api.unregisterSMDevice(smId);
      success(`Unlinked phone registration for ${smName}`);
      setPairingSM(null);
      onRefresh();
    } catch (err) {
      error(err.message || 'Failed to unlink device');
    }
  };

  const handleOpenAdd = () => {
    setEditingSM(null);
    setName('');
    setPhotoUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80');
    setBranch('San Pedro Main');
    setStation('Bay 1');
    setShift('Day Shift (6AM - 2PM)');
    setBio('');
    setDeviceFingerprint('');
    setIpRegistered('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sm) => {
    setEditingSM(sm);
    setName(sm.name);
    setPhotoUrl(sm.photo_url || '');
    setBranch(sm.branch);
    setStation(sm.station);
    setShift(sm.shift || 'Day Shift');
    setBio(sm.bio || '');
    setDeviceFingerprint(sm.device_fingerprint || '');
    setIpRegistered(sm.ip_registered || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !branch) {
      error('Name and Branch are required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name,
        photo_url: photoUrl,
        branch,
        station,
        shift,
        bio,
        device_fingerprint: deviceFingerprint || null,
        ip_registered: ipRegistered || null
      };

      if (editingSM) {
        await api.updateSM(editingSM.id, payload);
        success(`Updated Service Master: ${name}`);
      } else {
        await api.createSM(payload);
        success(`Added new Service Master: ${name}`);
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      error(err.message || 'Failed to save Service Master');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, smName) => {
    if (!confirm(`Are you sure you want to remove ${smName}?`)) return;
    try {
      await api.deleteSM(id);
      success(`Removed ${smName}`);
      onRefresh();
    } catch (err) {
      error(err.message || 'Failed to delete Service Master');
    }
  };

  const handleToggleActive = async (sm) => {
    try {
      await api.updateSM(sm.id, { active: !sm.active });
      success(`${sm.name} is now ${!sm.active ? 'Active' : 'Inactive'}`);
      onRefresh();
    } catch (err) {
      error('Failed to toggle status');
    }
  };

  const handleCalibrateCurrentDevice = () => {
    setDeviceFingerprint(fingerprint);
    success('Captured current device fingerprint for anti-self-vote protection');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-400" />
            <span>Service Masters Directory</span>
          </h2>
          <p className="text-xs text-slate-400">
            Manage nominees, assign stations, and register anti-self-voting hardware profiles
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Service Master</span>
        </button>
      </div>

      {/* SM Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sms.map((sm) => (
          <div
            key={sm.id}
            className={`bg-slate-800/80 border rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all ${
              sm.active ? 'border-slate-700/80' : 'border-slate-800 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  sm.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'
                }`}>
                  {sm.active ? 'Eligible for Voting' : 'Inactive'}
                </span>
                <span className="font-mono text-[10px] text-slate-400">ID: {sm.id}</span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <img
                  src={sm.photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80'}
                  alt={sm.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shrink-0"
                />
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">{sm.name}</h3>
                  <div className="text-xs text-blue-400 font-medium">{sm.branch}</div>
                  <div className="text-[11px] text-slate-400">{sm.station} &bull; {sm.shift}</div>
                </div>
              </div>

              {/* Anti-cheat status pill & Quick Pair button */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-[11px] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <ShieldCheck className={`w-3.5 h-3.5 ${sm.device_fingerprint ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span>Anti-Cheat Shield:</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    sm.device_fingerprint
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {sm.device_fingerprint ? 'Phone Linked' : 'Unpaired'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPairing(sm)}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    sm.device_fingerprint
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-900/30'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{sm.device_fingerprint ? 'View / Change Paired Phone' : 'Pair Staff Smartphone (QR)'}</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <button
                onClick={() => handleToggleActive(sm)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                  sm.active
                    ? 'text-amber-400 hover:bg-amber-500/10'
                    : 'text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                {sm.active ? 'Pause' : 'Activate'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(sm)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  title="Edit SM"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(sm.id, sm.name)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                  title="Delete SM"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-base text-white">
                {editingSM ? `Edit: ${editingSM.name}` : 'Add Service Master'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Carlos Mendoza"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Branch *</label>
                  <input
                    type="text"
                    required
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="San Pedro Main"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bay / Station</label>
                  <input
                    type="text"
                    value={station}
                    onChange={(e) => setStation(e.target.value)}
                    placeholder="Lube Bay 1"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shift</label>
                  <input
                    type="text"
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    placeholder="Day Shift (6AM - 2PM)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Photo URL</label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Bio / Highlight</label>
                <textarea
                  rows="2"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Specialist credentials, certifications, customer compliments..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Anti-cheat calibration box */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Anti-Self-Voting Shield Calibration</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCalibrateCurrentDevice}
                    className="text-[10px] text-blue-400 hover:underline"
                  >
                    Use This Device Fingerprint
                  </button>
                </div>
                <input
                  type="text"
                  value={deviceFingerprint}
                  onChange={(e) => setDeviceFingerprint(e.target.value)}
                  placeholder="Registered Device Fingerprint Hash"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-300"
                />
                <input
                  type="text"
                  value={ipRegistered}
                  onChange={(e) => setIpRegistered(e.target.value)}
                  placeholder="Registered Station/Home IP (optional)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30"
                >
                  {submitting ? 'Saving...' : 'Save Service Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Phone Pairing QR Modal */}
      {pairingSM && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Pair Staff Smartphone</h3>
                  <p className="text-xs text-slate-400 font-medium">{pairingSM.name} &bull; {pairingSM.branch}</p>
                </div>
              </div>
              <button
                onClick={() => setPairingSM(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-4 text-center">
              {/* Device Status */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-left">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Anti-Cheat Pairing Status</div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                    {pairingSM.device_fingerprint ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-400">Smartphone Registered</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-amber-400">Unpaired / Not Registered</span>
                      </>
                    )}
                  </div>
                  {pairingSM.device_fingerprint && (
                    <div className="text-[10px] font-mono text-slate-500 mt-1 truncate max-w-[220px]">
                      FP: {pairingSM.device_fingerprint}
                    </div>
                  )}
                </div>

                {pairingSM.device_fingerprint && (
                  <button
                    type="button"
                    onClick={() => handleUnregisterDevice(pairingSM.id, pairingSM.name)}
                    className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-500/30 transition-colors"
                  >
                    Unlink
                  </button>
                )}
              </div>

              {/* Instructions */}
              <div className="text-xs text-slate-300 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-left space-y-1">
                <div className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>How Staff Phone Pairing Works:</span>
                </div>
                <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-0.5">
                  <li>Ask <span className="font-semibold text-white">{pairingSM.name}</span> to open camera on their personal phone.</li>
                  <li>Scan the emerald QR code below directly from your computer monitor.</li>
                  <li>Tap the link and hit <span className="font-semibold text-white">"Confirm &amp; Pair This Phone"</span>.</li>
                </ol>
                <div className="text-[10px] text-blue-200/80 pt-1 border-t border-blue-500/20">
                  ⚡ Once paired, any self-votes cast from this phone for {pairingSM.name} are quarantined in the Fraud Queue. Regular customer votes remain completely unaffected.
                </div>
              </div>

              {/* QR Container */}
              <div className="bg-white p-4 rounded-2xl inline-block shadow-xl shadow-black/40 border-4 border-emerald-500/30 relative">
                {loadingPairing ? (
                  <div className="w-52 h-52 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    <span className="text-xs text-slate-600 font-medium">Generating secure pairing key...</span>
                  </div>
                ) : pairingQRData?.qrDataUrl ? (
                  <img
                    src={pairingQRData.qrDataUrl}
                    alt="Staff Pairing QR"
                    className="w-52 h-52 object-contain"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-xs text-rose-500">
                    Failed to load pairing QR
                  </div>
                )}
              </div>

              {/* Copy URL fallback */}
              {pairingQRData?.targetUrl && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleCopyPairingLink}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-lg border border-slate-700"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Pairing Link (or send via chat)'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setPairingSM(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
