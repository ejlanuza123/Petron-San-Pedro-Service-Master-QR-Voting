import React, { useEffect, useState } from 'react';
import { Camera, AlertCircle, ArrowLeft, QrCode } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useToast } from '../context/ToastContext';

export default function ScannerPage({ onScanSuccess, onBack }) {
  const [scannerError, setScannerError] = useState(null);
  const { info, warning } = useToast();

  useEffect(() => {
    let html5QrcodeScanner;
    try {
      html5QrcodeScanner = new Html5QrcodeScanner(
        'qr-reader-container',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true
        },
        /* verbose= */ false
      );

      html5QrcodeScanner.render(
        (decodedText) => {
          // Check if decoded text is an SM vote URL or SM ID
          console.log('Scanned QR:', decodedText);
          html5QrcodeScanner.clear().catch(() => {});

          // Parse sm id from URL: e.g. /vote/sm/sm-001 or raw sm-001
          const match = decodedText.match(/\/vote\/sm\/([^/?#]+)/i);
          if (match && match[1]) {
            onScanSuccess(decodeURIComponent(match[1]));
          } else if (decodedText.startsWith('sm-')) {
            onScanSuccess(decodedText);
          } else if (decodedText.includes('/vote')) {
            onBack();
          } else {
            info(`Scanned: ${decodedText}`);
          }
        },
        (error) => {
          // ignore scan frame errors
        }
      );
    } catch (err) {
      setScannerError('Camera access not supported or permission denied.');
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(() => {});
      }
    };
  }, [onScanSuccess, onBack, info]);

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Voting</span>
      </button>

      <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 mb-3">
          <Camera className="w-3.5 h-3.5" />
          <span>In-Browser QR Scanner</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-1">Scan SM Badge or Poster</h2>
        <p className="text-xs text-slate-400 mb-6">
          Align the QR code within the camera frame below to open the voting confirmation screen automatically.
        </p>

        {scannerError ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <AlertCircle className="w-5 h-5 mx-auto mb-1 text-amber-400" />
            <p>{scannerError}</p>
            <p className="mt-2 text-slate-400">
              Note: Most smartphone cameras can scan QR codes directly using the native Camera app!
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 min-h-[300px] flex items-center justify-center">
            <div id="qr-reader-container" className="w-full" />
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-700/60 text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <QrCode className="w-4 h-4 text-blue-400" />
          <span>Supports standard SM ID badges and station posters</span>
        </div>
      </div>
    </div>
  );
}
