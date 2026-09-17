/**
 * sessionManager.js — Month-Wise Session Management
 * Handles saving, viewing, updating, and deleting monthly data sessions
 * via REST API (/api/sessions) with local caching.
 * Uses native Gzip compression to ensure payloads easily stay well under
 * Vercel Serverless Function 4.5 MB payload limits.
 */

import { authHeaders, authState } from './auth.js';

const API_BASE = '/api/sessions';
const ACTIVE_SESSION_KEY = 'fc_active_session_id';
const ACTIVE_SESSION_NAME_KEY = 'fc_active_session_name';

/**
 * Compress a string to Base64 using browser native CompressionStream (gzip)
 */
async function compressGzip(str) {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const stream = new Blob([str]).stream();
    const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
    const response = new Response(compressedStream);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();

    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i += 8192) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 8192, len)));
    }
    return btoa(binary);
  } catch (err) {
    console.warn('[SessionManager] Compression error:', err);
    return null;
  }
}

/**
 * Decompress a Base64 gzip string using browser native DecompressionStream (gzip)
 */
async function decompressGzip(base64Str) {
  if (typeof DecompressionStream === 'undefined') return null;
  try {
    const binary = atob(base64Str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const stream = new Blob([bytes]).stream();
    const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
    const response = new Response(decompressedStream);
    return await response.text();
  } catch (err) {
    console.warn('[SessionManager] Decompression error:', err);
    return null;
  }
}

class SessionManager {
  constructor() {
    this.sessions = [];
    this.activeSessionId = localStorage.getItem(ACTIVE_SESSION_KEY) || null;
    this.activeSessionName = localStorage.getItem(ACTIVE_SESSION_NAME_KEY) || null;
    this.listeners = [];
  }

  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  _notify() {
    this.listeners.forEach(cb => {
      try { cb(this.sessions, this.activeSessionId); } catch (e) { console.error(e); }
    });
  }

  getActiveSessionId() {
    return this.activeSessionId;
  }

  getActiveSessionName() {
    return this.activeSessionName;
  }

  setActiveSession(id, name) {
    this.activeSessionId = id;
    this.activeSessionName = name;
    if (id) {
      localStorage.setItem(ACTIVE_SESSION_KEY, id);
      localStorage.setItem(ACTIVE_SESSION_NAME_KEY, name || '');
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      localStorage.removeItem(ACTIVE_SESSION_NAME_KEY);
    }
    this._notify();
  }

  /**
   * Fetch all sessions summary list from API
   */
  async fetchSessions() {
    // If user is not logged in, do not call backend API
    if (!authState.token || !authState.user) {
      this.sessions = [];
      this._notify();
      return [];
    }

    try {
      const res = await fetch(API_BASE, {
        headers: { ...authHeaders() }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        this.sessions = json.data;
        this._notify();
        return this.sessions;
      }
    } catch (err) {
      console.warn('[SessionManager] Error fetching sessions:', err.message);
    }
    return this.sessions;
  }

  /**
   * Fetch full session content (auto-decompresses if gzipped)
   */
  async fetchSession(id) {
    if (!authState.token || !authState.user) {
      throw new Error('Please sign in to view sessions');
    }

    const res = await fetch(`${API_BASE}/${id}`, {
      headers: { ...authHeaders() }
    });
    if (!res.ok) throw new Error(`Session not found (HTTP ${res.status})`);
    const json = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to load session');
    
    let session = json.data;
    if (session.isCompressed && session.compressedData) {
      try {
        const decompressedJson = await decompressGzip(session.compressedData);
        if (decompressedJson) {
          const parsed = JSON.parse(decompressedJson);
          session.orders = parsed.orders || [];
          session.ads = parsed.ads || [];
          session.parsedFiles = parsed.parsedFiles || [];
          session.dateFilter = parsed.dateFilter || null;
        }
      } catch (err) {
        console.error('[SessionManager] Failed to decompress session data:', err);
      }
    }
    return session;
  }

  /**
   * Save a new session (with automatic gzip compression & redundant data cleanup)
   */
  async saveSession(sessionData) {
    let payload = { ...sessionData };

    // Strip nested orders/ads inside parsedFiles to avoid duplicate payload bloat
    if (Array.isArray(payload.parsedFiles)) {
      payload.parsedFiles = payload.parsedFiles.map(f => ({
        id: f.id,
        reportName: f.reportName || f.filename,
        filename: f.filename,
        month: f.month,
        platform: f.platform,
        orderCount: f.orderCount || 0,
        uploadedAt: f.uploadedAt || new Date().toISOString()
      }));
    }

    // Compress heavy arrays (orders, ads, parsedFiles, dateFilter) using gzip
    if (typeof CompressionStream !== 'undefined') {
      try {
        const heavyData = {
          orders: payload.orders || [],
          ads: payload.ads || [],
          parsedFiles: payload.parsedFiles || [],
          dateFilter: payload.dateFilter || null
        };
        const compressedBase64 = await compressGzip(JSON.stringify(heavyData));
        if (compressedBase64) {
          payload = {
            id: payload.id,
            name: payload.name,
            month: payload.month,
            notes: payload.notes,
            orderCount: payload.orderCount,
            fileCount: payload.fileCount,
            netSettlement: payload.netSettlement,
            netProfit: payload.netProfit,
            returnRate: payload.returnRate,
            isCompressed: true,
            compressedData: compressedBase64
          };
        }
      } catch (err) {
        console.warn('[SessionManager] Gzip compression failed, sending uncompressed:', err);
      }
    }

    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to save session');
    }
    await this.fetchSessions();
    this.setActiveSession(json.data.id, json.data.name);
    return json.data;
  }

  /**
   * Update session metadata or content (with automatic gzip compression)
   */
  async updateSession(id, updates) {
    let payload = { ...updates };

    if (Array.isArray(payload.parsedFiles)) {
      payload.parsedFiles = payload.parsedFiles.map(f => ({
        id: f.id,
        reportName: f.reportName || f.filename,
        filename: f.filename,
        month: f.month,
        platform: f.platform,
        orderCount: f.orderCount || 0,
        uploadedAt: f.uploadedAt || new Date().toISOString()
      }));
    }

    if (payload.orders && typeof CompressionStream !== 'undefined') {
      try {
        const heavyData = {
          orders: payload.orders || [],
          ads: payload.ads || [],
          parsedFiles: payload.parsedFiles || [],
          dateFilter: payload.dateFilter || null
        };
        const compressedBase64 = await compressGzip(JSON.stringify(heavyData));
        if (compressedBase64) {
          payload = {
            name: payload.name,
            month: payload.month,
            notes: payload.notes,
            orderCount: payload.orderCount,
            fileCount: payload.fileCount,
            netSettlement: payload.netSettlement,
            netProfit: payload.netProfit,
            returnRate: payload.returnRate,
            isCompressed: true,
            compressedData: compressedBase64
          };
        }
      } catch (err) {
        console.warn('[SessionManager] Update compression failed:', err);
      }
    }

    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to update session');
    }
    await this.fetchSessions();
    if (this.activeSessionId === id && updates.name) {
      this.setActiveSession(id, updates.name);
    }
    return json.data;
  }

  /**
   * Delete session
   */
  async deleteSession(id) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to delete session');
    }
    if (this.activeSessionId === id) {
      this.setActiveSession(null, null);
    }
    await this.fetchSessions();
    return true;
  }
}

export const sessionManager = new SessionManager();
export default sessionManager;
