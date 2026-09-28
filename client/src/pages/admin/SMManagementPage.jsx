import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, Smartphone, Check, X, MapPin, Award } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import useFingerprint from '../../hooks/useFingerprint';

export default function SMManagementPage({ sms = [], onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSM, setEditingSM] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

              {/* Anti-cheat status pill */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Anti-Self-Voting Shield:</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Fingerprint: {sm.device_fingerprint ? 'Registered' : 'None (click Edit to calibrate)'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  IP: {sm.ip_registered || 'None'}
                </div>
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
    </div>
  );
}
