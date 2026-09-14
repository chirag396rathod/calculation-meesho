/**
 * skuManager.js — SKU Groups & Costing Module
 * Manages SKU groups, raw cost assignments, and localStorage persistence
 */

const STORAGE_KEY = 'fc_sku_groups';
const COST_STORAGE_KEY = 'fc_sku_costs';

/**
 * SKU Manager class
 */
class SKUManager {
  constructor() {
    this.groups = this.loadGroups();
    this.skuCosts = this.loadCosts();
    this.listeners = [];
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
    this.listeners.forEach(cb => cb(this.groups, this.skuCosts));
  }

  /**
   * Load groups from localStorage
   */
  loadGroups() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save groups to localStorage
   */
  saveGroups() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.groups));
    this._notify();
  }

  /**
   * Load individual SKU costs
   */
  loadCosts() {
    try {
      const data = localStorage.getItem(COST_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  /**
   * Save costs to localStorage
   */
  saveCosts() {
    localStorage.setItem(COST_STORAGE_KEY, JSON.stringify(this.skuCosts));
    this._notify();
  }

  /**
   * Create a new SKU group
   * @param {string} name - Group name
   * @param {number} rawCost - Raw cost per unit for this group
   * @param {string[]} skus - Array of SKU codes
   */
  createGroup(name, rawCost = 0, skus = []) {
    if (!name.trim()) throw new Error('Group name is required');
    if (this.groups.find(g => g.name.toLowerCase() === name.trim().toLowerCase())) {
      throw new Error('A group with this name already exists');
    }

    const group = {
      id: `grp_${Date.now()}`,
      name: name.trim(),
      rawCost: parseFloat(rawCost) || 0,
      skus: [...new Set(skus)],
      createdAt: new Date().toISOString()
    };

    this.groups.push(group);
    
    // Update individual SKU costs
    group.skus.forEach(sku => {
      this.skuCosts[sku] = group.rawCost;
    });

    this.saveGroups();
    this.saveCosts();
    return group;
  }

  /**
   * Update an existing group
   */
  updateGroup(groupId, updates) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found');

    // If name changed, check for duplicates
    if (updates.name && updates.name !== group.name) {
      if (this.groups.find(g => g.id !== groupId && g.name.toLowerCase() === updates.name.trim().toLowerCase())) {
        throw new Error('A group with this name already exists');
      }
      group.name = updates.name.trim();
    }

    if (updates.rawCost !== undefined) {
      group.rawCost = parseFloat(updates.rawCost) || 0;
      // Update all SKU costs in this group
      group.skus.forEach(sku => {
        this.skuCosts[sku] = group.rawCost;
      });
    }

    if (updates.skus) {
      // Remove old SKU costs that are no longer in group
      const removedSkus = group.skus.filter(s => !updates.skus.includes(s));
      removedSkus.forEach(sku => {
        delete this.skuCosts[sku];
      });

      group.skus = [...new Set(updates.skus)];
      // Apply cost to new SKUs
      group.skus.forEach(sku => {
        this.skuCosts[sku] = group.rawCost;
      });
    }

    this.saveGroups();
    this.saveCosts();
    return group;
  }

  /**
   * Delete a group
   */
  deleteGroup(groupId) {
    const group = this.groups.find(g => g.id === groupId);
    if (group) {
      group.skus.forEach(sku => {
        delete this.skuCosts[sku];
      });
      this.groups = this.groups.filter(g => g.id !== groupId);
      this.saveGroups();
      this.saveCosts();
    }
  }

  /**
   * Add SKUs to a group
   */
  addSkusToGroup(groupId, skus) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) throw new Error('Group not found');

    skus.forEach(sku => {
      if (!group.skus.includes(sku)) {
        group.skus.push(sku);
        this.skuCosts[sku] = group.rawCost;
      }
    });

    this.saveGroups();
    this.saveCosts();
  }

  /**
   * Remove a SKU from a group
   */
  removeSkuFromGroup(groupId, sku) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return;
    
    group.skus = group.skus.filter(s => s !== sku);
    delete this.skuCosts[sku];
    
    this.saveGroups();
    this.saveCosts();
  }

  /**
   * Get the group a SKU belongs to
   */
  getGroupForSku(sku) {
    return this.groups.find(g => g.skus.includes(sku)) || null;
  }

  /**
   * Get raw cost for a specific SKU
   */
  getCostForSku(sku) {
    return this.skuCosts[sku] || 0;
  }

  /**
   * Get all unassigned SKUs (from order data)
   */
  getUnassignedSkus(allSkus) {
    const assignedSkus = new Set(this.groups.flatMap(g => g.skus));
    return allSkus.filter(sku => !assignedSkus.has(sku));
  }

  /**
   * Get all groups
   */
  getGroups() {
    return [...this.groups];
  }

  /**
   * Get group by ID
   */
  getGroup(groupId) {
    return this.groups.find(g => g.id === groupId) || null;
  }

  /**
   * Set individual SKU cost (outside of groups)
   */
  setSkuCost(sku, cost) {
    this.skuCosts[sku] = parseFloat(cost) || 0;
    
    // Also update the group's cost if SKU belongs to one
    const group = this.getGroupForSku(sku);
    if (group) {
      group.rawCost = parseFloat(cost) || 0;
      // Apply to all SKUs in group
      group.skus.forEach(s => {
        this.skuCosts[s] = group.rawCost;
      });
      this.saveGroups();
    }
    
    this.saveCosts();
  }

  /**
   * Export group data as JSON
   */
  exportData() {
    return {
      groups: this.groups,
      skuCosts: this.skuCosts,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import group data from JSON
   */
  importData(data) {
    if (data.groups) {
      this.groups = data.groups;
      this.saveGroups();
    }
    if (data.skuCosts) {
      this.skuCosts = data.skuCosts;
      this.saveCosts();
    }
  }
}

export const skuManager = new SKUManager();
export default skuManager;
