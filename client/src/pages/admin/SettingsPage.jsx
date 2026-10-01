import React, { useState, useEffect } from 'react';
import { 
  Settings, Shield, Clock, Zap, Power, AlertTriangle, Save, Sparkles,
  KeyRound, Lock, Eye, EyeOff, CheckCircle2, ShieldCheck, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function SettingsPage({ campaign, onRefresh }) {
  const [form, setForm] = useState({
    name: campaign?.name || '',
    start_date: campaign?.start_date ? campaign.start_date.substring(0, 10) : '',
    end_date: campaign?.end_date ? campaign.end_date.substring(0, 10) : '',
    enforce_operating_hours: campaign?.enforce_operating_hours ?? true,
    operating_hours_start: campaign?.operating_hours_start || '06:00',
    operating_hours_end: campaign?.operating_hours_end || '22:00',
    rapid_fire_minutes: campaign?.rapid_fire_minutes || 10,
    rapid_fire_max_votes: campaign?.rapid_fire_max_votes || 5,
    duplicate_window: campaign?.duplicate_window || 'daily',
    kill_switch: campaign?.kill_switch || false,
    test_mode: campaign?.test_mode || false
  });

  const [saving, setSaving] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    if (campaign) {
      setForm({
        name: campaign.name || '',
        start_date: campaign.start_date ? campaign.start_date.substring(0, 10) : '',
        end_date: campaign.end_date ? campaign.end_date.substring(0, 10) : '',
        enforce_operating_hours: campaign.enforce_operating_hours ?? true,
        operating_hours_start: campaign.operating_hours_start || '06:00',
        operating_hours_end: campaign.operating_hours_end || '22:00',
        rapid_fire_minutes: campaign.rapid_fire_minutes || 10,
        rapid_fire_max_votes: campaign.rapid_fire_max_votes || 5,
        duplicate_window: campaign.duplicate_window || 'daily',
        kill_switch: campaign.kill_switch || false,
        test_mode: campaign.test_mode || false
      });
    }
  }, [campaign]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateCampaign(form);
      success('Campaign configuration and fraud detection rules saved!');
      onRefresh();
    } catch (err) {
      error(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      return error('Please enter your current password.');
    }
    if (!newPassword.trim()) {
      return error('Please enter a new password.');
    }
    if (newPassword.length < 6) {
      return error('New password must be at least 6 characters long.');
    }
    if (newPassword === currentPassword) {
      return error('New password must be different from current password.');
    }
    if (newPassword !== confirmPassword) {
      return error('New password and confirmation do not match.');
    }

    try {
      setUpdatingPassword(true);
      const res = await api.changePassword(currentPassword, newPassword);
      success(res.message || 'Admin password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      error(err.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const isLengthValid = newPassword.length >= 6;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <span>Campaign & Fraud Rules Configuration</span>
        </h2>
        <p className="text-xs text-slate-400">
          Fine-tune anti-cheat sensitivity, station operating hours, and emergency controls
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Emergency & Test Modes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Emergency Kill Switch */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${form.kill_switch ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-400'}`}>
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Emergency Kill Switch</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Immediately halts all customer voting across all QR codes and channels.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <span className={`text-xs font-semibold ${form.kill_switch ? 'text-rose-400' : 'text-slate-400'}`}>
                {form.kill_switch ? 'VOTING IS CURRENTLY DISABLED' : 'Voting Is Enabled'}
              </span>
              <button
                type="button"
                onClick={() => handleChange('kill_switch', !form.kill_switch)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  form.kill_switch
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {form.kill_switch ? 'Turn Off' : 'Engage Kill Switch'}
              </button>
            </div>
          </div>

          {/* Test Mode */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${form.test_mode ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Test Simulation Mode</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Allows simulating votes without triggering duplicate rate limits or affecting official totals.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <span className={`text-xs font-semibold ${form.test_mode ? 'text-amber-400' : 'text-slate-400'}`}>
                {form.test_mode ? 'SIMULATION MODE ACTIVE' : 'Production Live Mode'}
              </span>
              <button
                type="button"
                onClick={() => handleChange('test_mode', !form.test_mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  form.test_mode
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {form.test_mode ? 'Disable Test Mode' : 'Enable Test Mode'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Campaign Parameters */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Campaign Schedule & Operating Hours</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-3">
              <label className="block text-slate-300 font-semibold mb-1">Campaign Title</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Enforce Station Hours</label>
              <div className="flex items-center gap-2 h-9">
                <input
                  type="checkbox"
                  id="enforce_hours"
                  checked={form.enforce_operating_hours}
                  onChange={(e) => handleChange('enforce_operating_hours', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                />
                <label htmlFor="enforce_hours" className="text-xs text-slate-300">
                  Allow votes only during shift
                </label>
              </div>
            </div>

            {form.enforce_operating_hours && (
              <>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Opening Time</label>
                  <input
                    type="time"
                    value={form.operating_hours_start}
                    onChange={(e) => handleChange('operating_hours_start', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Closing Time</label>
                  <input
                    type="time"
                    value={form.operating_hours_end}
                    onChange={(e) => handleChange('operating_hours_end', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 3: Anti-Cheat & Fraud Thresholds */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Fraud Engine Thresholds</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Duplicate Policy</label>
              <select
                value={form.duplicate_window}
                onChange={(e) => handleChange('duplicate_window', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="daily">1 Vote Per Day per Device</option>
                <option value="campaign">1 Vote Per Entire Month Campaign</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Enforced by cryptographic device fingerprint hash
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Rapid-Fire Time Window (Minutes)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={form.rapid_fire_minutes}
                onChange={(e) => handleChange('rapid_fire_minutes', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Window to monitor consecutive ballots from same IP
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Rapid-Fire Max Allowed Votes</label>
              <input
                type="number"
                min="2"
                max="50"
                value={form.rapid_fire_max_votes}
                onChange={(e) => handleChange('rapid_fire_max_votes', Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Any excess votes from the same IP are flagged
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Section 4: Admin Account Security & Password */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-t-0 sm:border-b sm:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Administrator Account Security</h3>
              <p className="text-xs text-slate-400 mt-0.5">Change your admin credentials to maintain system security</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audited Action</span>
          </span>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 text-xs pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Password */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Current Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-9 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                New Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-9 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {newPassword && (
                <p className={`text-[10px] mt-1 ${isLengthValid ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {isLengthValid ? '✓ Minimum length satisfied' : 'Must be at least 6 characters'}
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Confirm New Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-9 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-[10px] mt-1 ${passwordsMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {passwordsMatch ? '✓ Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Password change events are permanently logged in the audit trail.</span>
            </p>
            <button
              type="submit"
              disabled={updatingPassword || !currentPassword || !newPassword || !confirmPassword || !passwordsMatch || !isLengthValid}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md shadow-blue-600/30 transition-all"
            >
              {updatingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
