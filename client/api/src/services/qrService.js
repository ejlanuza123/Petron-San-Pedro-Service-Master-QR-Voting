import { generateQRCode } from './qrGenerator.js';

/**
 * QR Service for generating General & SM-Specific Voting QR codes
 */
export class QRService {
  /**
   * Generates General Voting QR code
   * @param {string} baseUrl - Application domain base (e.g. http://localhost:5000)
   * @param {Object} options
   */
  static async generateGeneralVotingQR(baseUrl, options = {}) {
    const targetUrl = `${baseUrl.replace(/\/$/, '')}/vote`;
    const qr = generateQRCode(targetUrl, {
      size: options.size || 350,
      dark: options.darkColor || '#003882',
      light: options.lightColor || '#ffffff',
      margin: options.margin || 4
    });

    return {
      type: 'general',
      targetUrl,
      svg: qr.svg,
      qrDataUrl: qr.dataUrl
    };
  }

  /**
   * Generates SM-Specific Voting QR code
   * @param {string} baseUrl
   * @param {string} smId
   * @param {Object} options
   */
  static async generateSMVotingQR(baseUrl, smId, options = {}) {
    const targetUrl = `${baseUrl.replace(/\/$/, '')}/vote/sm/${encodeURIComponent(smId)}`;
    const qr = generateQRCode(targetUrl, {
      size: options.size || 350,
      dark: options.darkColor || '#003882',
      light: options.lightColor || '#ffffff',
      margin: options.margin || 4
    });

    return {
      type: 'sm_specific',
      smId,
      targetUrl,
      svg: qr.svg,
      qrDataUrl: qr.dataUrl
    };
  }

  /**
   * Generates Staff Device Pairing QR code
   * @param {string} baseUrl
   * @param {string} smId
   * @param {string} token
   * @param {Object} options
   */
  static async generateDevicePairingQR(baseUrl, smId, token = '', options = {}) {
    const targetUrl = `${baseUrl.replace(/\/$/, '')}/pair-device?id=${encodeURIComponent(smId)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
    const qr = generateQRCode(targetUrl, {
      size: options.size || 350,
      dark: options.darkColor || '#059669', // Emerald/green color signifying staff security pairing
      light: options.lightColor || '#ffffff',
      margin: options.margin || 4
    });

    return {
      type: 'device_pairing',
      smId,
      targetUrl,
      svg: qr.svg,
      qrDataUrl: qr.dataUrl
    };
  }
}

export default QRService;

