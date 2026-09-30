import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Smartphone, AlertTriangle, CheckCircle2, 
  ArrowLeft, Lock, Info, Sparkles, Loader2 
} from 'lucide-react';
import api from '../services/api';
import useFingerprint from '../hooks/useFingerprint';
import { useToast } from '../context/ToastContext';

export default function PairDevicePage({ onReturnHome }) {
  const [sm, setSm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pairing, setPairing] = useState(false);
  const [pairedSuccess, setPairedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const { fingerprint, loading: fpLoading } = useFingerprint();
  const { success, error, warning } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const smId = searchParams.get('id');
  const token = searchParams.get('token');

  useEffect(() => {
    const fetchSM = async () => {
      if (!smId) {
        setErrorMsg('Missing Service Master ID in pairing link.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await api.getSM(smId);
        setSm(res.sm);
      } catch (err) {
        setErrorMsg(err.message || 'Service Master not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchSM();
  }, [smId]);

  const handleConfirmPairing = async () => {
    if (!smId || !token) {
      error('Invalid pairing request. Please re-scan your staff badge QR code.');
      return;
    }

    if (!fingerprint) {
      warning('Hardware verification in progress. Please wait a second.');
      return;
    }

    try {
      setPairing(true);
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([30, 50, 30]);
      }

      await api.calibrateSMDevice(smId, {
        device_fingerprint: fingerprint,
        token
      });

      if (window.navigator?.vibrate) {
        window.navigator.vibrate([100, 50, 100]);
      }

      setPairedSuccess(true);
      success(`Phone successfully linked to ${sm?.name || 'nominee'}!`);
    } catch (err) {
      error(err.message || 'Failed to complete device pairing');
    } finally {
      setPairing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          Verifying secure staff device pairing link...
        </p>
      </div>
    );
  }

  if (errorMsg || !sm) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-8 backdrop-blur-md">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Invalid Pairing Link</h2>
          <p className="text-xs text-slate-400 mb-6">
            {errorMsg || 'This pairing QR code may have expired or is invalid.'}
          </p>
          <button
            onClick={onReturnHome}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Go to Main Voting Screen
          </button>
        </div>
      </div>
    );
  }

  const isAlreadyPaired = sm.device_fingerprint && sm.device_fingerprint === fingerprint;

  return (
    <div className="max-w-md mx-auto px-4 py-10 sm:py-16 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Header Icon */}
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 mb-4">
            <Smartphone className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Anti-Cheat Staff Pairing</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Register Staff Device
          </h2>

          <p className="text-xs text-slate-300 mt-2 px-2">
            Pair your phone to prevent fraudulent self-voting and guarantee full fair-play compliance.
          </p>

          {/* SM Candidate Card */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-900/90 border border-slate-700/70 text-left flex items-center gap-3.5">
            <img
              src={sm.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt={sm.name}
              className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
            />
            <div className="overflow-hidden">
              <h3 className="font-bold text-white text-sm truncate">{sm.name}</h3>
              <p className="text-xs text-emerald-400 font-medium">{sm.branch}</p>
              <p className="text-[11px] text-slate-400 truncate">{sm.station || 'Petron Service Master'}</p>
            </div>
          </div>

          {/* Success Box or Action Box */}
          {pairedSuccess || isAlreadyPaired ? (
            <div className="mt-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs text-left space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Device Securely Linked!</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                This smartphone is officially recognized as belonging to <strong className="text-white">{sm.name}</strong>. Any votes submitted from this device for this profile will be automatically flagged for administrative quarantine.
              </p>
              <div className="pt-2">
                <button
                  onClick={onReturnHome}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Technical Security Explainer */}
              <div className="mt-5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/50 text-left text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  <span>How This Protects You:</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Legitimate customer votes cast at the island will remain valid. Registering your device ensures transparency during the monthly vote auditing process.
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Device Signature:</span>
                  <span>{fingerprint ? `${fingerprint.substring(0, 16)}...` : 'Generating...'}</span>
                </div>
              </div>

              {/* Confirm Pairing Action Button */}
              <div className="mt-6 space-y-2.5">
                <button
                  onClick={handleConfirmPairing}
                  disabled={pairing || fpLoading || !token}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  {pairing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registering Device Signature...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm & Pair This Phone</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onReturnHome}
                  className="w-full py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel and Return to Home
                </button>
              </div>
            </>
          )}

          <p className="mt-5 text-[11px] text-slate-500">
            Powered by Petron San Pedro Anti-Cheat Fraud Engine
          </p>
        </div>
      </div>
    </div>
  );
}
