import { authHeaders, authState } from './auth.js';

const API_BASE = '/api/sku-groups';

function getUserStorageKeys() {
  const uid = authState.user?.id || 'guest';
  return {
    groupKey: `fc_sku_groups_${uid}`,
    costKey: `fc_sku_costs_${uid}`
  };
}

/**
 * SKU Manager class — Isolated per business / tenant
 */
class SKUManager {
  constructor() {
    // Purge old global shared cache keys if present
    try {
      localStorage.removeItem('fc_sku_groups');
      localStorage.removeItem('fc_sku_costs');
    } catch (e) {}

    this.groups = this.loadLocalGroups();
    this.skuCosts = this.loadLocalCosts();
    this.listeners = [];
    this.isInitialized = false;
  }

  /**
   * Subscribe to changes
   */
  onChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  _notify() {
    this.listeners.forEach(cb => {
      try {
        cb(this.groups, this.skuCosts);
      } catch (err) {
        console.error('[SKUManager] Listener error:', err);
      }
    });
  }

  /**
   * Load from per-user localStorage
   */
  loadLocalGroups() {
    try {
      const { groupKey } = getUserStorageKeys();
      const data = localStorage.getItem(groupKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  loadLocalCosts() {
    try {
      const { costKey } = getUserStorageKeys();
      const data = localStorage.getItem(costKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  saveLocalCache() {
    try {
      const { groupKey, costKey } = getUserStorageKeys();
      localStorage.setItem(groupKey, JSON.stringify(this.groups));
      localStorage.setItem(costKey, JSON.stringify(this.skuCosts));
    } catch (e) {
      console.warn('[SKUManager] Failed to write local cache:', e);
    }
  }

  /**
   * Initialize and fetch from backend API (per authenticated business)
   */
  async init() {
    // If user is not logged in, do not call backend API
    if (!authState.token || !authState.user) {
      this.groups = [];
      this.skuCosts = {};
      this.isInitialized = true;
      this._notify();
      return [];
    }

    try {
      const res = await fetch(API_BASE, {
        headers: {
          ...authHeaders()
        }
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();

      if (json.success && json.data) {
        // Business starts with their own data (or empty array if new)
        this.groups = json.data.groups || [];
        this.skuCosts = json.data.skuCosts || {};
        this.saveLocalCache();
      }
    } catch (err) {
      console.warn('[SKUManager] Could not connect to API, using user local storage:', err.message);
      this.groups = this.loadLocalGroups();
      this.skuCosts = this.loadLocalCosts();
    } finally {
      this.isInitialized = true;
      this._notify();
    }
    return this.groups;
  }

  /**
   * Reload for active user (e.g. after login or user switch)
   */
  async reloadForUser() {
    if (!authState.token || !authState.user) {
      this.groups = [];
      this.skuCosts = {};
      this.isInitialized = true;
      this._notify();
      return [];
    }
    this.groups = this.loadLocalGroups();
    this.skuCosts = this.loadLocalCosts();
    this._notify();
    return await this.init();
  }

  /**
   * Sync local data to backend
   */
  async syncToBackend(groups, skuCosts) {
    try {
      const res = await fetch(`${API_BASE}/bulk-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({ groups, skuCosts })
      });
      const json = await res.json();
      if (json.success && json.data) {
        this.groups = json.data.groups || [];
        this.skuCosts = json.data.skuCosts || {};
        this.saveLocalCache();
      }
    } catch (err) {
      console.error('[SKUManager] Bulk sync error:', err);
    }
  }

  /**
   * Create a new SKU group via API
   */
  async createGroup(name, rawCost = 0, skus = []) {
    const trimmedName = (name || '').trim();
    if (!trimmedName) throw new Error('Group name is required');

    if (this.groups.some(g => g.name.toLowerCase() === trimmedName.toLowerCase())) {
      throw new Error('A group with this name already exists');
    }

    const payload = {
      name: trimmedName,
      rawCost: parseFloat(rawCost) || 0,
      skus: [...new Set(skus)]
    };

    let newGroup = null;

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create group on server');
      }

      newGroup = json.data;
    } catch (err) {
      console.warn('[SKUManager] API create failed, falling back to local:', err.message);
      // Fallback local creation
      newGroup = {
        id: `grp_${Date.now()}`,
        name: payload.name,
        rawCost: payload.rawCost,
        skus: payload.skus,
        createdAt: new Date().toISOString()
      };
    }

    this.groups.push(newGroup);
    newGroup.skus.forEach(sku => {
      this.skuCosts[sku] = newGroup.rawCost;
    });

    this.saveLocalCache();
    this._notify();
    return newGroup;
  }

  /**
   * Update an existing group via API
   */
  async updateGroup(groupId, updates) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found');

    if (updates.name && updates.name.trim() !== group.name) {
      const newName = updates.name.trim();
      if (this.groups.some(g => g.id !== groupId && g.name.toLowerCase() === newName.toLowerCase())) {
        throw new Error('A group with this name already exists');
      }
    }

    let updatedGroup = null;

    try {
      const res = await fetch(`${API_BASE}/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(updates)
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update group on server');
      }

      updatedGroup = json.data;
    } catch (err) {
      console.warn('[SKUManager] API update failed, applying locally:', err.message);
      updatedGroup = { ...group };
      if (updates.name) updatedGroup.name = updates.name.trim();
      if (updates.rawCost !== undefined) updatedGroup.rawCost = parseFloat(updates.rawCost) || 0;
      if (updates.skus) updatedGroup.skus = [...new Set(updates.skus)];
    }

    // Update in-memory state
    const index = this.groups.findIndex(g => g.id === groupId);
    if (index !== -1) {
      this.groups[index] = updatedGroup;
    }

    // Reconcile skuCosts
    if (updates.skus) {
      const removed = (group.skus || []).filter(s => !updatedGroup.skus.includes(s));
      removed.forEach(sku => { delete this.skuCosts[sku]; });
    }
    (updatedGroup.skus || []).forEach(sku => {
      this.skuCosts[sku] = updatedGroup.rawCost;
    });

    this.saveLocalCache();
    this._notify();
    return updatedGroup;
  }

  /**
   * Delete a group via API
   */
  async deleteGroup(groupId) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return;

    try {
      const res = await fetch(`${API_BASE}/${groupId}`, {
        method: 'DELETE',
        headers: { ...authHeaders() }
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        console.warn('[SKUManager] Server delete failed:', json.error);
      }
    } catch (err) {
      console.warn('[SKUManager] API delete request error, removing locally:', err.message);
    }

    (group.skus || []).forEach(sku => {
      delete this.skuCosts[sku];
    });
    this.groups = this.groups.filter(g => g.id !== groupId);

    this.saveLocalCache();
    this._notify();
  }

  /**
   * Set cost for an individual SKU via API
   */
  async setSkuCost(sku, cost) {
    const numCost = parseFloat(cost) || 0;
    this.skuCosts[sku] = numCost;

    const group = this.getGroupForSku(sku);
    if (group) {
      group.rawCost = numCost;
      (group.skus || []).forEach(s => {
        this.skuCosts[s] = numCost;
      });
    }

    try {
      await fetch(`/api/sku-costs/${encodeURIComponent(sku)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ cost: numCost })
      });
    } catch (err) {
      console.warn('[SKUManager] API SKU cost update failed:', err.message);
    }

    this.saveLocalCache();
    this._notify();
  }

  // ═══════════════════════════════════════════
  //  SYNCHRONOUS GETTERS (Used by analytics.js)
  // ═══════════════════════════════════════════

  getGroups() {
    return [...this.groups];
  }

  getGroup(groupId) {
    return this.groups.find(g => g.id === groupId) || null;
  }

  getGroupForSku(sku) {
    return this.groups.find(g => (g.skus || []).includes(sku)) || null;
  }

  getCostForSku(sku) {
    return this.skuCosts[sku] || 0;
  }

  getUnassignedSkus(allSkus) {
    const assignedSkus = new Set(this.groups.flatMap(g => g.skus || []));
    return allSkus.filter(sku => !assignedSkus.has(sku));
  }

  exportData() {
    return {
      groups: this.groups,
      skuCosts: this.skuCosts,
      exportedAt: new Date().toISOString()
    };
  }

  async importData(data) {
    if (data.groups && Array.isArray(data.groups)) {
      await this.syncToBackend(data.groups, data.skuCosts || {});
      this._notify();
    }
  }
}

export const skuManager = new SKUManager();
export default skuManager;
