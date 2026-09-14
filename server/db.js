import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@libsql/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env first, then allow .env.local to override if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });

const DATA_FILE = path.resolve(__dirname, '../data/sku_groups.json');
const SESSIONS_DIR = path.resolve(__dirname, '../data/sessions');

const DEFAULT_TURSO_URL = 'libsql://fc-analytics-chirag-rathod-8866.aws-ap-south-1.turso.io';
const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkzODM5OTQsImlkIjoiMDFhMDlmOTgtMDUwMS03MTAyLTljZDYtMGEzMjgxNjY2N2FiIiwia2lkIjoiVGpBQ0syTnRGVHVPS0Nqd2YybHlHQjViWEJHb0F6amZ0RXQ1cVFLNVZCTSIsInJpZCI6IjkwOTE5YjMxLThhMzQtNDVhNi1iYTRhLThjMDhlN2UxYmU4MCJ9.MZqTuMOTlO2k1Zp9at_eXN6iLeQoUJ5ehcAXJU4qvH43xAKL0SqTa1AslX80ZSOAQIxKI5C8q_-3USLdpEjQCQ';

const databaseUrl = process.env.DATABASE_URL || DEFAULT_TURSO_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN || DEFAULT_TURSO_TOKEN;
const useLocalDbOnly = process.env.USE_LOCAL_DB === 'true';

let client = null;
let isInitialized = false;

// ── Local File Fallback Helpers (safe for read-only serverless filesystems) ──
function ensureLocalDirs() {
  try {
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ groups: [], skuCosts: {}, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
    }
  } catch (err) {
    // Read-only filesystem on Vercel
  }
}

function readLocalSkuData() {
  ensureLocalDirs();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[DB-Local] Error reading SKU JSON:', err);
  }
  return { groups: [], skuCosts: {} };
}

function writeLocalSkuData(data) {
  try {
    ensureLocalDirs();
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // Read-only filesystem on Vercel
  }
  return data;
}

function listLocalSessions() {
  ensureLocalDirs();
  try {
    if (!fs.existsSync(SESSIONS_DIR)) return [];
    const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'));
    const sessions = [];
    for (const file of files) {
      try {
        const full = path.join(SESSIONS_DIR, file);
        const data = JSON.parse(fs.readFileSync(full, 'utf8'));
        sessions.push({
          id: data.id,
          name: data.name || 'Untitled Session',
          month: data.month || '',
          notes: data.notes || '',
          orderCount: data.orderCount ?? (data.orders ? data.orders.length : 0),
          fileCount: data.fileCount ?? (data.parsedFiles ? data.parsedFiles.length : 0),
          netSettlement: data.netSettlement || 0,
          netProfit: data.netProfit || 0,
          returnRate: data.returnRate || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      } catch (e) {
        console.error('[DB-Local] Error reading session:', file, e);
      }
    }
    return sessions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } catch (err) {
    return [];
  }
}

function getLocalSession(id) {
  ensureLocalDirs();
  try {
    const safeId = path.basename(id);
    const filePath = path.join(SESSIONS_DIR, `${safeId}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return null;
  }
}

function saveLocalSession(sessionData) {
  try {
    ensureLocalDirs();
    const id = sessionData.id || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    sessionData.id = id;
    sessionData.updatedAt = new Date().toISOString();
    if (!sessionData.createdAt) sessionData.createdAt = sessionData.updatedAt;
    const safeId = path.basename(id);
    fs.writeFileSync(path.join(SESSIONS_DIR, `${safeId}.json`), JSON.stringify(sessionData, null, 2), 'utf8');
  } catch (err) {
    // Read-only filesystem on Vercel
  }
  return sessionData;
}

function deleteLocalSession(id) {
  try {
    ensureLocalDirs();
    const safeId = path.basename(id);
    const filePath = path.join(SESSIONS_DIR, `${safeId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (err) {
    // Read-only filesystem on Vercel
  }
  return false;
}

/**
 * Initialize Database connection and create tables
 */
export async function initDatabase() {
  if (isInitialized) return client;

  if (useLocalDbOnly || !databaseUrl) {
    console.log('[Database] Operating in Local File Storage mode (no Turso URL or USE_LOCAL_DB=true)');
    isInitialized = true;
    return null;
  }

  try {
    console.log('[Database] Connecting to Turso Database:', databaseUrl);
    client = createClient({
      url: databaseUrl,
      authToken: authToken
    });

    // Create tables
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sku_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        raw_cost REAL DEFAULT 0,
        skus TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS sku_costs (
        sku TEXT PRIMARY KEY,
        cost REAL NOT NULL,
        updated_at TEXT
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        month TEXT,
        notes TEXT,
        order_count INTEGER DEFAULT 0,
        file_count INTEGER DEFAULT 0,
        net_settlement REAL DEFAULT 0,
        net_profit REAL DEFAULT 0,
        return_rate REAL DEFAULT 0,
        data_json TEXT,
        created_at TEXT,
        updated_at TEXT
      );
    `);

    console.log('[Database] Turso tables verified/created successfully.');

    // Auto-migrate from local files if Turso tables are empty
    await autoMigrateIfEmpty();

    isInitialized = true;
    return client;
  } catch (err) {
    console.error('[Database] Failed to connect to Turso. Falling back to local file storage:', err.message);
    client = null;
    isInitialized = true;
    return null;
  }
}

/**
 * Auto-migrate existing local JSON data to Turso if Turso tables are empty
 */
async function autoMigrateIfEmpty() {
  if (!client) return;

  try {
    // 1. Check SKU groups
    const groupCountRes = await client.execute('SELECT COUNT(*) as cnt FROM sku_groups');
    const groupCount = groupCountRes.rows[0]?.cnt || 0;

    if (groupCount === 0) {
      const localData = readLocalSkuData();
      const groups = localData.groups || [];
      const skuCosts = localData.skuCosts || {};

      if (groups.length > 0) {
        console.log(`[Database] Seeding Turso with ${groups.length} existing SKU groups from disk...`);
        const now = new Date().toISOString();

        for (const g of groups) {
          await client.execute({
            sql: `INSERT OR REPLACE INTO sku_groups (id, name, raw_cost, skus, created_at, updated_at) 
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
              g.id || `grp_${Date.now()}`,
              g.name,
              parseFloat(g.rawCost) || 0,
              JSON.stringify(g.skus || []),
              g.createdAt || now,
              now
            ]
          });
        }

        for (const [sku, cost] of Object.entries(skuCosts)) {
          await client.execute({
            sql: `INSERT OR REPLACE INTO sku_costs (sku, cost, updated_at) VALUES (?, ?, ?)`,
            args: [sku, parseFloat(cost) || 0, now]
          });
        }
        console.log('[Database] SKU groups and costs successfully migrated to Turso.');
      }
    }

    // 2. Check Sessions
    const sessionCountRes = await client.execute('SELECT COUNT(*) as cnt FROM sessions');
    const sessionCount = sessionCountRes.rows[0]?.cnt || 0;

    if (sessionCount === 0) {
      const localSessions = listLocalSessions();
      if (localSessions.length > 0) {
        console.log(`[Database] Seeding Turso with ${localSessions.length} existing monthly sessions from disk...`);
        for (const s of localSessions) {
          const fullSession = getLocalSession(s.id);
          if (fullSession) {
            const dataJson = JSON.stringify({
              orders: fullSession.orders || [],
              ads: fullSession.ads || [],
              parsedFiles: fullSession.parsedFiles || [],
              dateFilter: fullSession.dateFilter || null
            });

            await client.execute({
              sql: `INSERT OR REPLACE INTO sessions 
                    (id, name, month, notes, order_count, file_count, net_settlement, net_profit, return_rate, data_json, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [
                fullSession.id,
                fullSession.name,
                fullSession.month || '',
                fullSession.notes || '',
                fullSession.orderCount || 0,
                fullSession.fileCount || 0,
                fullSession.netSettlement || 0,
                fullSession.netProfit || 0,
                fullSession.returnRate || 0,
                dataJson,
                fullSession.createdAt || new Date().toISOString(),
                fullSession.updatedAt || new Date().toISOString()
              ]
            });
          }
        }
        console.log('[Database] Monthly sessions successfully migrated to Turso.');
      }
    }
  } catch (err) {
    console.error('[Database] Migration check error:', err);
  }
}

// ═════════════════════════════════════════════════════
//  SKU GROUPS & COSTING DB OPERATIONS
// ═════════════════════════════════════════════════════

export async function dbGetSkuData() {
  await initDatabase();

  if (!client) {
    return readLocalSkuData();
  }

  try {
    const groupsRes = await client.execute('SELECT * FROM sku_groups ORDER BY created_at ASC');
    const costsRes = await client.execute('SELECT * FROM sku_costs');

    const groups = groupsRes.rows.map(row => ({
      id: row.id,
      name: row.name,
      rawCost: Number(row.raw_cost),
      skus: typeof row.skus === 'string' ? JSON.parse(row.skus) : (row.skus || []),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    const skuCosts = {};
    costsRes.rows.forEach(row => {
      skuCosts[row.sku] = Number(row.cost);
    });

    // Mirror to local disk as instant cache
    writeLocalSkuData({ groups, skuCosts });

    return { groups, skuCosts };
  } catch (err) {
    console.error('[Database] Error reading SKU data from Turso:', err);
    return readLocalSkuData();
  }
}

export async function dbCreateSkuGroup({ name, rawCost = 0, skus = [] }) {
  await initDatabase();
  const id = `grp_${Date.now()}`;
  const now = new Date().toISOString();
  const numCost = parseFloat(rawCost) || 0;
  const uniqueSkus = [...new Set(skus)];

  if (!client) {
    const current = readLocalSkuData();
    if (current.groups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('A group with this name already exists');
    }
    const newGroup = { id, name, rawCost: numCost, skus: uniqueSkus, createdAt: now };
    current.groups.push(newGroup);
    current.skuCosts = current.skuCosts || {};
    uniqueSkus.forEach(s => { current.skuCosts[s] = numCost; });
    writeLocalSkuData(current);
    return newGroup;
  }

  try {
    // Check name collision
    const existing = await client.execute({
      sql: 'SELECT id FROM sku_groups WHERE LOWER(name) = LOWER(?)',
      args: [name]
    });
    if (existing.rows.length > 0) {
      throw new Error('A group with this name already exists');
    }

    await client.execute({
      sql: `INSERT INTO sku_groups (id, name, raw_cost, skus, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, name, numCost, JSON.stringify(uniqueSkus), now, now]
    });

    // Update sku costs in batch
    for (const sku of uniqueSkus) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO sku_costs (sku, cost, updated_at) VALUES (?, ?, ?)`,
        args: [sku, numCost, now]
      });
    }

    const newGroup = { id, name, rawCost: numCost, skus: uniqueSkus, createdAt: now, updatedAt: now };
    
    // Sync local disk backup
    const local = readLocalSkuData();
    local.groups.push(newGroup);
    local.skuCosts = local.skuCosts || {};
    uniqueSkus.forEach(s => { local.skuCosts[s] = numCost; });
    writeLocalSkuData(local);

    return newGroup;
  } catch (err) {
    console.error('[Database] Error creating group in Turso:', err);
    throw err;
  }
}

export async function dbUpdateSkuGroup(id, updates) {
  await initDatabase();
  const now = new Date().toISOString();

  if (!client) {
    const current = readLocalSkuData();
    const group = current.groups.find(g => g.id === id);
    if (!group) throw new Error('Group not found');
    if (updates.name && updates.name.trim() !== group.name) {
      const newName = updates.name.trim();
      if (current.groups.some(g => g.id !== id && g.name.toLowerCase() === newName.toLowerCase())) {
        throw new Error('A group with this name already exists');
      }
      group.name = newName;
    }
    if (updates.rawCost !== undefined) {
      group.rawCost = parseFloat(updates.rawCost) || 0;
      group.skus.forEach(sku => { current.skuCosts[sku] = group.rawCost; });
    }
    if (Array.isArray(updates.skus)) {
      const oldSkus = group.skus || [];
      const newSkus = [...new Set(updates.skus)];
      oldSkus.filter(s => !newSkus.includes(s)).forEach(s => delete current.skuCosts[s]);
      group.skus = newSkus;
      newSkus.forEach(sku => { current.skuCosts[sku] = group.rawCost; });
    }
    writeLocalSkuData(current);
    return group;
  }

  try {
    const groupRes = await client.execute({
      sql: 'SELECT * FROM sku_groups WHERE id = ?',
      args: [id]
    });
    if (groupRes.rows.length === 0) throw new Error('Group not found');

    const currentGroup = {
      ...groupRes.rows[0],
      rawCost: Number(groupRes.rows[0].raw_cost),
      skus: JSON.parse(groupRes.rows[0].skus || '[]')
    };

    let newName = currentGroup.name;
    if (updates.name && updates.name.trim() !== currentGroup.name) {
      newName = updates.name.trim();
      const dup = await client.execute({
        sql: 'SELECT id FROM sku_groups WHERE id != ? AND LOWER(name) = LOWER(?)',
        args: [id, newName]
      });
      if (dup.rows.length > 0) throw new Error('A group with this name already exists');
    }

    const newCost = updates.rawCost !== undefined ? (parseFloat(updates.rawCost) || 0) : currentGroup.rawCost;
    const newSkus = Array.isArray(updates.skus) ? [...new Set(updates.skus)] : currentGroup.skus;

    await client.execute({
      sql: 'UPDATE sku_groups SET name = ?, raw_cost = ?, skus = ?, updated_at = ? WHERE id = ?',
      args: [newName, newCost, JSON.stringify(newSkus), now, id]
    });

    // Remove deleted SKUs costs
    const removedSkus = currentGroup.skus.filter(s => !newSkus.includes(s));
    for (const s of removedSkus) {
      await client.execute({ sql: 'DELETE FROM sku_costs WHERE sku = ?', args: [s] });
    }

    // Set updated SKUs costs
    for (const s of newSkus) {
      await client.execute({
        sql: 'INSERT OR REPLACE INTO sku_costs (sku, cost, updated_at) VALUES (?, ?, ?)',
        args: [s, newCost, now]
      });
    }

    const updated = { id, name: newName, rawCost: newCost, skus: newSkus, updatedAt: now };

    // Update local cache
    const local = readLocalSkuData();
    const gIdx = local.groups.findIndex(g => g.id === id);
    if (gIdx !== -1) local.groups[gIdx] = updated;
    removedSkus.forEach(s => delete local.skuCosts[s]);
    newSkus.forEach(s => { local.skuCosts[s] = newCost; });
    writeLocalSkuData(local);

    return updated;
  } catch (err) {
    console.error('[Database] Error updating group in Turso:', err);
    throw err;
  }
}

export async function dbDeleteSkuGroup(id) {
  await initDatabase();

  if (!client) {
    const current = readLocalSkuData();
    const idx = current.groups.findIndex(g => g.id === id);
    if (idx === -1) throw new Error('Group not found');
    const [deleted] = current.groups.splice(idx, 1);
    (deleted.skus || []).forEach(sku => delete current.skuCosts[sku]);
    writeLocalSkuData(current);
    return deleted;
  }

  try {
    const groupRes = await client.execute({ sql: 'SELECT * FROM sku_groups WHERE id = ?', args: [id] });
    if (groupRes.rows.length === 0) throw new Error('Group not found');

    const group = {
      ...groupRes.rows[0],
      skus: JSON.parse(groupRes.rows[0].skus || '[]')
    };

    await client.execute({ sql: 'DELETE FROM sku_groups WHERE id = ?', args: [id] });
    for (const sku of group.skus) {
      await client.execute({ sql: 'DELETE FROM sku_costs WHERE sku = ?', args: [sku] });
    }

    // Mirror to local disk
    const local = readLocalSkuData();
    local.groups = local.groups.filter(g => g.id !== id);
    group.skus.forEach(sku => delete local.skuCosts[sku]);
    writeLocalSkuData(local);

    return group;
  } catch (err) {
    console.error('[Database] Error deleting group in Turso:', err);
    throw err;
  }
}

export async function dbBulkSyncSku({ groups, skuCosts }) {
  await initDatabase();
  const now = new Date().toISOString();

  if (!client) {
    const current = readLocalSkuData();
    if (Array.isArray(groups)) current.groups = groups;
    if (skuCosts) current.skuCosts = { ...(current.skuCosts || {}), ...skuCosts };
    writeLocalSkuData(current);
    return current;
  }

  try {
    if (Array.isArray(groups)) {
      for (const g of groups) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO sku_groups (id, name, raw_cost, skus, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            g.id || `grp_${Date.now()}`,
            g.name,
            parseFloat(g.rawCost) || 0,
            JSON.stringify(g.skus || []),
            g.createdAt || now,
            now
          ]
        });
      }
    }

    if (skuCosts && typeof skuCosts === 'object') {
      for (const [sku, cost] of Object.entries(skuCosts)) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO sku_costs (sku, cost, updated_at) VALUES (?, ?, ?)`,
          args: [sku, parseFloat(cost) || 0, now]
        });
      }
    }

    return await dbGetSkuData();
  } catch (err) {
    console.error('[Database] Error in bulk sync:', err);
    throw err;
  }
}

export async function dbUpdateSkuCost(sku, cost) {
  await initDatabase();
  const numCost = parseFloat(cost) || 0;
  const now = new Date().toISOString();

  if (!client) {
    const current = readLocalSkuData();
    current.skuCosts = current.skuCosts || {};
    current.skuCosts[sku] = numCost;
    const group = current.groups.find(g => (g.skus || []).includes(sku));
    if (group) {
      group.rawCost = numCost;
      group.skus.forEach(s => { current.skuCosts[s] = numCost; });
    }
    writeLocalSkuData(current);
    return { sku, cost: numCost };
  }

  try {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO sku_costs (sku, cost, updated_at) VALUES (?, ?, ?)',
      args: [sku, numCost, now]
    });

    // Update parent group if exists
    const groupsRes = await client.execute('SELECT * FROM sku_groups');
    for (const row of groupsRes.rows) {
      const skus = JSON.parse(row.skus || '[]');
      if (skus.includes(sku)) {
        await client.execute({
          sql: 'UPDATE sku_groups SET raw_cost = ?, updated_at = ? WHERE id = ?',
          args: [numCost, now, row.id]
        });
        for (const s of skus) {
          await client.execute({
            sql: 'INSERT OR REPLACE INTO sku_costs (sku, cost, updated_at) VALUES (?, ?, ?)',
            args: [s, numCost, now]
          });
        }
      }
    }

    return { sku, cost: numCost };
  } catch (err) {
    console.error('[Database] Error updating SKU cost in Turso:', err);
    throw err;
  }
}

// ═════════════════════════════════════════════════════
//  MONTHLY SESSIONS DB OPERATIONS
// ═════════════════════════════════════════════════════

export async function dbListSessions() {
  await initDatabase();

  if (!client) {
    return listLocalSessions();
  }

  try {
    const res = await client.execute(`
      SELECT id, name, month, notes, order_count, file_count, net_settlement, net_profit, return_rate, created_at, updated_at 
      FROM sessions 
      ORDER BY created_at DESC
    `);

    return res.rows.map(row => ({
      id: row.id,
      name: row.name,
      month: row.month || '',
      notes: row.notes || '',
      orderCount: Number(row.order_count || 0),
      fileCount: Number(row.file_count || 0),
      netSettlement: Number(row.net_settlement || 0),
      netProfit: Number(row.net_profit || 0),
      returnRate: Number(row.return_rate || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (err) {
    console.error('[Database] Error listing sessions from Turso:', err);
    return listLocalSessions();
  }
}

export async function dbGetSession(id) {
  await initDatabase();

  if (!client) {
    return getLocalSession(id);
  }

  try {
    const res = await client.execute({
      sql: 'SELECT * FROM sessions WHERE id = ?',
      args: [id]
    });

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    const data = row.data_json ? JSON.parse(row.data_json) : {};

    return {
      id: row.id,
      name: row.name,
      month: row.month || '',
      notes: row.notes || '',
      orderCount: Number(row.order_count || 0),
      fileCount: Number(row.file_count || 0),
      netSettlement: Number(row.net_settlement || 0),
      netProfit: Number(row.net_profit || 0),
      returnRate: Number(row.return_rate || 0),
      isCompressed: !!data.isCompressed,
      compressedData: data.compressedData || null,
      orders: data.orders || [],
      ads: data.ads || [],
      parsedFiles: data.parsedFiles || [],
      dateFilter: data.dateFilter || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (err) {
    console.error('[Database] Error getting session from Turso:', err);
    return getLocalSession(id);
  }
}

export async function dbSaveSession(sessionData) {
  await initDatabase();
  const id = sessionData.id || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const now = new Date().toISOString();
  const createdAt = sessionData.createdAt || now;

  sessionData.id = id;
  sessionData.createdAt = createdAt;
  sessionData.updatedAt = now;

  const dataJson = JSON.stringify({
    isCompressed: !!sessionData.isCompressed,
    compressedData: sessionData.compressedData || null,
    orders: sessionData.isCompressed ? [] : (sessionData.orders || []),
    ads: sessionData.isCompressed ? [] : (sessionData.ads || []),
    parsedFiles: sessionData.isCompressed ? [] : (sessionData.parsedFiles || []),
    dateFilter: sessionData.isCompressed ? null : (sessionData.dateFilter || null)
  });

  // Always mirror to local backup
  saveLocalSession(sessionData);

  if (!client) {
    return sessionData;
  }

  try {
    await client.execute({
      sql: `INSERT OR REPLACE INTO sessions 
            (id, name, month, notes, order_count, file_count, net_settlement, net_profit, return_rate, data_json, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        sessionData.name || 'Untitled Session',
        sessionData.month || '',
        sessionData.notes || '',
        sessionData.orderCount ?? (sessionData.orders ? sessionData.orders.length : 0),
        sessionData.fileCount ?? (sessionData.parsedFiles ? sessionData.parsedFiles.length : 0),
        sessionData.netSettlement || 0,
        sessionData.netProfit || 0,
        sessionData.returnRate || 0,
        dataJson,
        createdAt,
        now
      ]
    });

    return sessionData;
  } catch (err) {
    console.error('[Database] Error saving session to Turso:', err);
    return sessionData;
  }
}

export async function dbUpdateSession(id, updates) {
  await initDatabase();
  const existing = await dbGetSession(id);
  if (!existing) throw new Error('Session not found');

  const merged = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  if (updates.orders) merged.orderCount = updates.orders.length;
  if (updates.parsedFiles) merged.fileCount = updates.parsedFiles.length;

  return await dbSaveSession(merged);
}

export async function dbDeleteSession(id) {
  await initDatabase();

  deleteLocalSession(id);

  if (!client) {
    return true;
  }

  try {
    await client.execute({
      sql: 'DELETE FROM sessions WHERE id = ?',
      args: [id]
    });
    return true;
  } catch (err) {
    console.error('[Database] Error deleting session from Turso:', err);
    return true;
  }
}
