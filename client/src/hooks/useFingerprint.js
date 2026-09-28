import { useState, useEffect } from 'react';

/**
 * Generate a non-invasive SHA-256 browser/device fingerprint
 */
async function generateDeviceFingerprint() {
  try {
    // 1. Check local storage cache for stable identification
    const cached = localStorage.getItem('voter_device_fingerprint');
    if (cached && cached.startsWith('fp_')) {
      return cached;
    }

    // 2. Gather device entropy
    const screenData = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const language = navigator.language || navigator.userLanguage || '';
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const userAgent = navigator.userAgent;

    // 3. Canvas fingerprinting
    let canvasData = '';
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px "Arial", sans-serif';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('ServiceMaster🏆2026', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('QR-Vote-Validation', 4, 17);
        canvasData = canvas.toDataURL();
      }
    } catch {
      canvasData = 'canvas_blocked';
    }

    // 4. Combine components
    const rawEntropy = [screenData, timezone, language, hardwareConcurrency, userAgent, canvasData].join(':::');

    // 5. Hash with SHA-256 via SubtleCrypto
    const encoder = new TextEncoder();
    const data = encoder.encode(rawEntropy);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const fingerprint = `fp_${hashHex.substring(0, 24)}`;
    localStorage.setItem('voter_device_fingerprint', fingerprint);
    return fingerprint;
  } catch (err) {
    // Fallback: Random persistent identifier
    const fallback = `fp_fb_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 8)}`;
    localStorage.setItem('voter_device_fingerprint', fallback);
    return fallback;
  }
}

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState(localStorage.getItem('voter_device_fingerprint') || '');
  const [loading, setLoading] = useState(!fingerprint);

  useEffect(() => {
    let mounted = true;
    generateDeviceFingerprint().then((fp) => {
      if (mounted) {
        setFingerprint(fp);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Helper for admin/testing to simulate different devices
  const setTestFingerprint = (newFp) => {
    localStorage.setItem('voter_device_fingerprint', newFp);
    setFingerprint(newFp);
  };

  const resetFingerprint = async () => {
    localStorage.removeItem('voter_device_fingerprint');
    setLoading(true);
    const fp = await generateDeviceFingerprint();
    setFingerprint(fp);
    setLoading(false);
  };

  return { fingerprint, loading, setTestFingerprint, resetFingerprint };
}

export default useFingerprint;
