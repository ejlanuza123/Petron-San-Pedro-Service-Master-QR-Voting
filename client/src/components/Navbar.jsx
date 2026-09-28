import React from 'react';
import { Award, QrCode, Shield, Camera, Home, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ currentRoute, setCurrentRoute, campaignStatus }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="no-print bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => setCurrentRoute({ name: 'home' })}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white shadow-lg shadow-blue-900/30 group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                <span>Service Master</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  MONTHLY
                </span>
              </div>
              <div className="text-[11px] text-slate-400">QR Voting & Recognition</div>
            </div>
          </div>

          {/* Status pill (if kill switch or test mode) */}
          <div className="hidden md:flex items-center gap-2">
            {campaignStatus?.kill_switch_active && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Voting Paused
              </span>
            )}
            {campaignStatus?.test_mode && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Test Mode Active
              </span>
            )}
            {campaignStatus?.is_voting_open && !campaignStatus?.test_mode && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Voting Live
              </span>
            )}
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => setCurrentRoute({ name: 'home' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentRoute.name === 'home' || currentRoute.name === 'vote'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Vote List</span>
            </button>

            <button
              onClick={() => setCurrentRoute({ name: 'scanner' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentRoute.name === 'scanner'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Open QR Scanner"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <button
                  onClick={() => setCurrentRoute({ name: 'admin' })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    currentRoute.name === 'admin'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>

                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentRoute({ name: 'admin-login' })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
