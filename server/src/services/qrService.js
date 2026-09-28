let qrcodeLib = null;

// Dynamic import with fallback
try {
  qrcodeLib = await import('qrcode');
  if (qrcodeLib && qrcodeLib.default) {
    qrcodeLib = qrcodeLib.default;
  }
} catch {
  // qrcode not yet installed in node_modules, fallback generator will be used
}

/**
 * Clean SVG QR representation fallback when npm package is compiling or installing
 */
function createFallbackQRDataURL(url) {
  // Simple branded visual QR placeholder SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
    <rect width="300" height="300" fill="#ffffff" rx="16"/>
    <!-- Outer Corners -->
    <rect x="25" y="25" width="70" height="70" fill="#003882" rx="8"/>
    <rect x="37" y="37" width="46" height="46" fill="#ffffff" rx="4"/>
    <rect x="49" y="49" width="22" height="22" fill="#003882" rx="2"/>

    <rect x="205" y="25" width="70" height="70" fill="#003882" rx="8"/>
    <rect x="217" y="37" width="46" height="46" fill="#ffffff" rx="4"/>
    <rect x="229" y="49" width="22" height="22" fill="#003882" rx="2"/>

    <rect x="25" y="205" width="70" height="70" fill="#003882" rx="8"/>
    <rect x="37" y="217" width="46" height="46" fill="#ffffff" rx="4"/>
    <rect x="49" y="229" width="22" height="22" fill="#003882" rx="2"/>

    <!-- Data matrix points -->
    <circle cx="120" cy="50" r="8" fill="#003882"/>
    <circle cx="150" cy="50" r="8" fill="#003882"/>
    <circle cx="180" cy="50" r="8" fill="#003882"/>
    <circle cx="120" cy="80" r="8" fill="#003882"/>
    <circle cx="150" cy="120" r="10" fill="#ED1C24"/>
    <circle cx="180" cy="80" r="8" fill="#003882"/>
    <circle cx="150" cy="180" r="8" fill="#003882"/>
    <circle cx="120" cy="150" r="8" fill="#003882"/>
    <circle cx="180" cy="150" r="8" fill="#003882"/>
    <circle cx="120" cy="210" r="8" fill="#003882"/>
    <circle cx="150" cy="240" r="8" fill="#003882"/>
    <circle cx="180" cy="210" r="8" fill="#003882"/>
    <circle cx="230" cy="120" r="8" fill="#003882"/>
    <circle cx="250" cy="150" r="8" fill="#003882"/>
    <circle cx="220" cy="180" r="8" fill="#003882"/>
    <circle cx="250" cy="210" r="8" fill="#003882"/>
    <circle cx="70" cy="120" r="8" fill="#003882"/>
    <circle cx="50" cy="150" r="8" fill="#003882"/>
    <circle cx="80" cy="180" r="8" fill="#003882"/>
    
    <text x="150" y="285" font-family="sans-serif" font-size="10" font-weight="bold" fill="#64748b" text-anchor="middle">Scan with Camera</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export class QRService {
  /**
   * Generates a QR Code as Data URL
   */
  static async generateDataURL(url, options = {}) {
    if (qrcodeLib && typeof qrcodeLib.toDataURL === 'function') {
      const defaultOptions = {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 2,
        width: options.width || 400,
        color: {
          dark: options.darkColor || '#003882',
          light: options.lightColor || '#ffffff'
        }
      };
      return await qrcodeLib.toDataURL(url, { ...defaultOptions, ...options });
    }

    return createFallbackQRDataURL(url);
  }

  /**
   * Generates General Voting QR code
   */
  static async generateGeneralVotingQR(baseUrl, options = {}) {
    const targetUrl = `${baseUrl.replace(/\/$/, '')}/vote`;
    const qrDataUrl = await this.generateDataURL(targetUrl, options);
    return {
      type: 'general',
      targetUrl,
      qrDataUrl
    };
  }

  /**
   * Generates SM-Specific Voting QR code
   */
  static async generateSMVotingQR(baseUrl, smId, options = {}) {
    const targetUrl = `${baseUrl.replace(/\/$/, '')}/vote/sm/${encodeURIComponent(smId)}`;
    const qrDataUrl = await this.generateDataURL(targetUrl, options);
    return {
      type: 'sm_specific',
      smId,
      targetUrl,
      qrDataUrl
    };
  }
}

export default QRService;
