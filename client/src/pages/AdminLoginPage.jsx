import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function AdminLoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { success, error } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      error('Please enter both username and password');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login(username, password);
      login(res.token, res.user);
      success(`Welcome back, ${res.user.name}`);
      onLoginSuccess();
    } catch (err) {
      error(err.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-lg mb-3">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Admin Portal</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time monitoring, audit logs, and fraud detection queue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Quick preset banner */}
          <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-300 flex items-center gap-2">
            <KeyRound className="w-4 h-4 shrink-0 text-blue-400" />
            <span>Default demo: <b>admin</b> / <b>admin123</b></span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
