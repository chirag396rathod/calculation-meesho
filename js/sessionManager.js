/**
 * sessionManager.js — Month-Wise Session Management
 * Handles saving, viewing, updating, and deleting monthly data sessions
 * via REST API (/api/sessions) with local caching.
 */

const API_BASE = '/api/sessions';
const ACTIVE_SESSION_KEY = 'fc_active_session_id';
const ACTIVE_SESSION_NAME_KEY = 'fc_active_session_name';

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
    try {
      const res = await fetch(API_BASE);
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
   * Fetch full session content
   */
  async fetchSession(id) {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error(`Session not found (HTTP ${res.status})`);
    const json = await res.json();
    if (!json.success || !json.data) throw new Error(json.error || 'Failed to load session');
    return json.data;
  }

  /**
   * Save a new session
   */
  async saveSession(sessionData) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
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
   * Update session metadata or content
   */
  async updateSession(id, updates) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
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
      method: 'DELETE'
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
