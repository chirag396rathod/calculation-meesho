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
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const useLocalDbOnly = !isVercel && process.env.USE_LOCAL_DB === 'true';

let client = null;
let isInitialized = false;

// ── Per-User Local File Storage ──────────────────────────────────────────────
// Each user gets their own directory: data/users/{userId}/
//   data/users/{userId}/sku_groups.json
//   data/users/{userId}/sessions/{sessionId}.json
// ─────────────────────────────────────────────────────────────────────────────

const USERS_DATA_DIR = path.resolve(__dirname, '../data/users');

function userDataDir(userId) {
  return path.join(USERS_DATA_DIR, userId || 'legacy');
}

function userSkuFile(userId) {
  return path.join(userDataDir(userId), 'sku_groups.json');
}

function userSessionsDir(userId) {
  return path.join(userDataDir(userId), 'sessions');
}

function ensureUserDirs(userId) {
  try {
    const dir     = userDataDir(userId);
    const sessDir = userSessionsDir(userId);
    if (!fs.existsSync(dir))     fs.mkdirSync(dir,     { recursive: true });
    if (!fs.existsSync(sessDir)) fs.mkdirSync(sessDir, { recursive: true });
    const skuFile = userSkuFile(userId);
    if (!fs.existsSync(skuFile)) {
      fs.writeFileSync(skuFile, JSON.stringify({ groups: [], skuCosts: {}, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
    }
  } catch (err) { /* read-only on Vercel */ }
}

// Legacy shared dirs (kept for migration only)
const LEGACY_DATA_FILE  = path.resolve(__dirname, '../data/sku_groups.json');
const LEGACY_SESS_DIR   = path.resolve(__dirname, '../data/sessions');

function ensureLocalDirs() {
  // Keep legacy dirs intact — only ensure they exist if already present
}

function readLocalSkuData(userId = 'legacy') {
  ensureUserDirs(userId);
  try {
    const file = userSkuFile(userId);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) { console.error('[DB-Local] Error reading SKU JSON:', err); }
  return { groups: [], skuCosts: {} };
}

function writeLocalSkuData(userId = 'legacy', data) {
  try {
    ensureUserDirs(userId);
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(userSkuFile(userId), JSON.stringify(data, null, 2), 'utf8');
  } catch (err) { /* read-only */ }
  return data;
}

function listLocalSessions(userId = 'legacy') {
  ensureUserDirs(userId);
  try {
    const dir = userSessionsDir(userId);
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    const sessions = [];
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
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
      } catch (e) { console.error('[DB-Local] Error reading session:', file, e); }
    }
    return sessions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } catch (err) { return []; }
}

function getLocalSession(userId = 'legacy', id) {
  ensureUserDirs(userId);
  try {
    const safeId   = path.basename(id);
    const filePath = path.join(userSessionsDir(userId), `${safeId}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) { return null; }
}

function saveLocalSession(userId = 'legacy', sessionData) {
  try {
    ensureUserDirs(userId);
    const id = sessionData.id || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    sessionData.id = id;
    sessionData.userId = userId;
    sessionData.updatedAt = new Date().toISOString();
    if (!sessionData.createdAt) sessionData.createdAt = sessionData.updatedAt;
    const safeId = path.basename(id);
    fs.writeFileSync(path.join(userSessionsDir(userId), `${safeId}.json`), JSON.stringify(sessionData, null, 2), 'utf8');
  } catch (err) { /* read-only */ }
  return sessionData;
}

function deleteLocalSession(userId = 'legacy', id) {
  try {
    ensureUserDirs(userId);
    const safeId   = path.basename(id);
    const filePath = path.join(userSessionsDir(userId), `${safeId}.json`);
    if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); return true; }
  } catch (err) { /* read-only */ }
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

    // ── Users table (multi-tenant) ──
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id         TEXT PRIMARY KEY,
        mobile     TEXT NOT NULL UNIQUE,
        name       TEXT DEFAULT '',
        email      TEXT DEFAULT '',
        created_at TEXT,
        last_login TEXT
      );
    `);

    // ── OTP requests table (short-lived tokens) ──
    await client.execute(`
      CREATE TABLE IF NOT EXISTS otp_requests (
        id         TEXT PRIMARY KEY,
        mobile     TEXT NOT NULL,
        otp_hash   TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        attempts   INTEGER DEFAULT 0,
        verified   INTEGER DEFAULT 0
      );
    `);

    // ── SKU Groups (with user_id for multi-tenancy) ──
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sku_groups (
        id       TEXT PRIMARY KEY,
        user_id  TEXT NOT NULL DEFAULT 'legacy',
        name     TEXT NOT NULL,
        raw_cost REAL DEFAULT 0,
        skus     TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT
      );
    `);

    // ── SKU Costs (with user_id) ──
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sku_costs (
        sku        TEXT NOT NULL,
        user_id    TEXT NOT NULL DEFAULT 'legacy',
        cost       REAL NOT NULL,
        updated_at TEXT,
        PRIMARY KEY (sku, user_id)
      );
    `);

    // ── Sessions (with user_id) ──
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id           TEXT PRIMARY KEY,
        user_id      TEXT NOT NULL DEFAULT 'legacy',
        name         TEXT NOT NULL,
        month        TEXT,
        notes        TEXT,
        order_count  INTEGER DEFAULT 0,
        file_count   INTEGER DEFAULT 0,
        net_settlement REAL DEFAULT 0,
        net_profit   REAL DEFAULT 0,
        return_rate  REAL DEFAULT 0,
        data_json    TEXT,
        created_at   TEXT,
        updated_at   TEXT
      );
    `);

    // ── Safe column migration for existing deployments ──
    // Adds user_id column to tables created before multi-tenant support
    const migrations = [
      `ALTER TABLE sku_groups ADD COLUMN user_id TEXT NOT NULL DEFAULT 'legacy'`,
      `ALTER TABLE sku_costs  ADD COLUMN user_id TEXT NOT NULL DEFAULT 'legacy'`,
      `ALTER TABLE sessions   ADD COLUMN user_id TEXT NOT NULL DEFAULT 'legacy'`,
    ];
    for (const sql of migrations) {
      try { await client.execute(sql); } catch (e) { /* column already exists */ }
    }

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

export async function dbGetSkuData(userId = 'legacy') {
  await initDatabase();

  if (!client) {
    return readLocalSkuData(userId);
  }

  try {
    const groupsRes = await client.execute({
      sql: 'SELECT * FROM sku_groups WHERE user_id = ? ORDER BY created_at ASC',
      args: [userId]
    });
    const costsRes = await client.execute({
      sql: 'SELECT * FROM sku_costs WHERE user_id = ?',
      args: [userId]
    });

    const groups = groupsRes.rows.map(row => ({
      id: row.id,
      name: row.name,
      rawCost: Number(row.raw_cost),
      skus: typeof row.skus === 'string' ? JSON.parse(row.skus) : (row.skus || []),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    const skuCosts = {};
    costsRes.rows.forEach(row => { skuCosts[row.sku] = Number(row.cost); });

    writeLocalSkuData(userId, { groups, skuCosts });
    return { groups, skuCosts };
  } catch (err) {
    console.error('[Database] Error reading SKU data from Turso:', err);
    return readLocalSkuData(userId);
  }
}

export async function dbCreateSkuGroup({ name, rawCost = 0, skus = [], userId = 'legacy' }) {
  await initDatabase();
  const id = `grp_${Date.now()}`;
  const now = new Date().toISOString();
  const numCost = parseFloat(rawCost) || 0;
  const uniqueSkus = [...new Set(skus)];

  if (!client) {
    const current = readLocalSkuData(userId);
    if (current.groups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('A group with this name already exists');
    }
    const newGroup = { id, name, rawCost: numCost, skus: uniqueSkus, createdAt: now };
    current.groups.push(newGroup);
    current.skuCosts = current.skuCosts || {};
    uniqueSkus.forEach(s => { current.skuCosts[s] = numCost; });
    writeLocalSkuData(userId, current);
    return newGroup;
  }

  try {
    const existing = await client.execute({
      sql: 'SELECT id FROM sku_groups WHERE user_id = ? AND LOWER(name) = LOWER(?)',
      args: [userId, name]
    });
    if (existing.rows.length > 0) throw new Error('A group with this name already exists');

    await client.execute({
      sql: `INSERT INTO sku_groups (id, user_id, name, raw_cost, skus, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, userId, name, numCost, JSON.stringify(uniqueSkus), now, now]
    });
    for (const sku of uniqueSkus) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO sku_costs (sku, user_id, cost, updated_at) VALUES (?, ?, ?, ?)`,
        args: [sku, userId, numCost, now]
      });
    }

    const newGroup = { id, name, rawCost: numCost, skus: uniqueSkus, createdAt: now, updatedAt: now };
    const local = readLocalSkuData(userId);
    local.groups.push(newGroup);
    local.skuCosts = local.skuCosts || {};
    uniqueSkus.forEach(s => { local.skuCosts[s] = numCost; });
    writeLocalSkuData(userId, local);
    return newGroup;
  } catch (err) {
    console.error('[Database] Error creating group in Turso:', err);
    throw err;
  }
}

export async function dbUpdateSkuGroup(id, updates, userId = 'legacy') {
  await initDatabase();
  const now = new Date().toISOString();

  if (!client) {
    const current = readLocalSkuData(userId);
    const group = current.groups.find(g => g.id === id);
    if (!group) throw new Error('Group not found');
    if (updates.name && updates.name.trim() !== group.name) {
      const newName = updates.name.trim();
      if (current.groups.some(g => g.id !== id && g.name.toLowerCase() === newName.toLowerCase()))
        throw new Error('A group with this name already exists');
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
    writeLocalSkuData(userId, current);
    return group;
  }

  try {
    const groupRes = await client.execute({
      sql: 'SELECT * FROM sku_groups WHERE id = ? AND user_id = ?',
      args: [id, userId]
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
        sql: 'SELECT id FROM sku_groups WHERE user_id = ? AND id != ? AND LOWER(name) = LOWER(?)',
        args: [userId, id, newName]
      });
      if (dup.rows.length > 0) throw new Error('A group with this name already exists');
    }
    const newCost = updates.rawCost !== undefined ? (parseFloat(updates.rawCost) || 0) : currentGroup.rawCost;
    const newSkus = Array.isArray(updates.skus) ? [...new Set(updates.skus)] : currentGroup.skus;
    await client.execute({
      sql: 'UPDATE sku_groups SET name = ?, raw_cost = ?, skus = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      args: [newName, newCost, JSON.stringify(newSkus), now, id, userId]
    });
    const removedSkus = currentGroup.skus.filter(s => !newSkus.includes(s));
    for (const s of removedSkus) {
      await client.execute({ sql: 'DELETE FROM sku_costs WHERE sku = ? AND user_id = ?', args: [s, userId] });
    }
    for (const s of newSkus) {
      await client.execute({
        sql: 'INSERT OR REPLACE INTO sku_costs (sku, user_id, cost, updated_at) VALUES (?, ?, ?, ?)',
        args: [s, userId, newCost, now]
      });
    }
    const updated = { id, name: newName, rawCost: newCost, skus: newSkus, updatedAt: now };
    const local = readLocalSkuData(userId);
    const gIdx = local.groups.findIndex(g => g.id === id);
    if (gIdx !== -1) local.groups[gIdx] = updated;
    removedSkus.forEach(s => delete local.skuCosts[s]);
    newSkus.forEach(s => { local.skuCosts[s] = newCost; });
    writeLocalSkuData(userId, local);
    return updated;
  } catch (err) {
    console.error('[Database] Error updating group in Turso:', err);
    throw err;
  }
}

export async function dbDeleteSkuGroup(id, userId = 'legacy') {
  await initDatabase();

  if (!client) {
    const current = readLocalSkuData(userId);
    const idx = current.groups.findIndex(g => g.id === id);
    if (idx === -1) throw new Error('Group not found');
    const [deleted] = current.groups.splice(idx, 1);
    (deleted.skus || []).forEach(sku => delete current.skuCosts[sku]);
    writeLocalSkuData(userId, current);
    return deleted;
  }

  try {
    const groupRes = await client.execute({ sql: 'SELECT * FROM sku_groups WHERE id = ? AND user_id = ?', args: [id, userId] });
    if (groupRes.rows.length === 0) throw new Error('Group not found');
    const group = { ...groupRes.rows[0], skus: JSON.parse(groupRes.rows[0].skus || '[]') };
    await client.execute({ sql: 'DELETE FROM sku_groups WHERE id = ? AND user_id = ?', args: [id, userId] });
    for (const sku of group.skus) {
      await client.execute({ sql: 'DELETE FROM sku_costs WHERE sku = ? AND user_id = ?', args: [sku, userId] });
    }
    const local = readLocalSkuData(userId);
    local.groups = local.groups.filter(g => g.id !== id);
    group.skus.forEach(sku => delete local.skuCosts[sku]);
    writeLocalSkuData(userId, local);
    return group;
  } catch (err) {
    console.error('[Database] Error deleting group in Turso:', err);
    throw err;
  }
}

export async function dbBulkSyncSku({ groups, skuCosts, userId = 'legacy' }) {
  await initDatabase();
  const now = new Date().toISOString();

  if (!client) {
    const current = readLocalSkuData(userId);
    if (Array.isArray(groups)) current.groups = groups;
    if (skuCosts) current.skuCosts = { ...(current.skuCosts || {}), ...skuCosts };
    writeLocalSkuData(userId, current);
    return current;
  }

  try {
    if (Array.isArray(groups)) {
      for (const g of groups) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO sku_groups (id, user_id, name, raw_cost, skus, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [g.id || `grp_${Date.now()}`, userId, g.name, parseFloat(g.rawCost) || 0, JSON.stringify(g.skus || []), g.createdAt || now, now]
        });
      }
    }
    if (skuCosts && typeof skuCosts === 'object') {
      for (const [sku, cost] of Object.entries(skuCosts)) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO sku_costs (sku, user_id, cost, updated_at) VALUES (?, ?, ?, ?)`,
          args: [sku, userId, parseFloat(cost) || 0, now]
        });
      }
    }
    return await dbGetSkuData(userId);
  } catch (err) {
    console.error('[Database] Error in bulk sync:', err);
    throw err;
  }
}

export async function dbUpdateSkuCost(sku, cost, userId = 'legacy') {
  await initDatabase();
  const numCost = parseFloat(cost) || 0;
  const now = new Date().toISOString();

  if (!client) {
    const current = readLocalSkuData(userId);
    current.skuCosts = current.skuCosts || {};
    current.skuCosts[sku] = numCost;
    const group = current.groups.find(g => (g.skus || []).includes(sku));
    if (group) {
      group.rawCost = numCost;
      group.skus.forEach(s => { current.skuCosts[s] = numCost; });
    }
    writeLocalSkuData(userId, current);
    return { sku, cost: numCost };
  }

  try {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO sku_costs (sku, user_id, cost, updated_at) VALUES (?, ?, ?, ?)',
      args: [sku, userId, numCost, now]
    });
    const groupsRes = await client.execute({
      sql: 'SELECT * FROM sku_groups WHERE user_id = ?',
      args: [userId]
    });
    for (const row of groupsRes.rows) {
      const skus = JSON.parse(row.skus || '[]');
      if (skus.includes(sku)) {
        await client.execute({
          sql: 'UPDATE sku_groups SET raw_cost = ?, updated_at = ? WHERE id = ? AND user_id = ?',
          args: [numCost, now, row.id, userId]
        });
        for (const s of skus) {
          await client.execute({
            sql: 'INSERT OR REPLACE INTO sku_costs (sku, user_id, cost, updated_at) VALUES (?, ?, ?, ?)',
            args: [s, userId, numCost, now]
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

export async function dbListSessions(userId = 'legacy') {
  await initDatabase();

  if (!client) {
    return listLocalSessions(userId);
  }

  try {
    const res = await client.execute({
      sql: `SELECT id, name, month, notes, order_count, file_count, net_settlement, net_profit, return_rate, created_at, updated_at 
            FROM sessions WHERE user_id = ? ORDER BY created_at DESC`,
      args: [userId]
    });
    return res.rows.map(row => ({
      id: row.id, name: row.name, month: row.month || '', notes: row.notes || '',
      orderCount: Number(row.order_count || 0), fileCount: Number(row.file_count || 0),
      netSettlement: Number(row.net_settlement || 0), netProfit: Number(row.net_profit || 0),
      returnRate: Number(row.return_rate || 0), createdAt: row.created_at, updatedAt: row.updated_at
    }));
  } catch (err) {
    console.error('[Database] Error listing sessions from Turso:', err);
    return listLocalSessions(userId);
  }
}

export async function dbGetSession(id, userId = 'legacy') {
  await initDatabase();

  if (!client) {
    return getLocalSession(userId, id);
  }

  try {
    const res = await client.execute({
      sql: 'SELECT * FROM sessions WHERE id = ? AND user_id = ?',
      args: [id, userId]
    });
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    const data = row.data_json ? JSON.parse(row.data_json) : {};
    return {
      id: row.id, name: row.name, month: row.month || '', notes: row.notes || '',
      orderCount: Number(row.order_count || 0), fileCount: Number(row.file_count || 0),
      netSettlement: Number(row.net_settlement || 0), netProfit: Number(row.net_profit || 0),
      returnRate: Number(row.return_rate || 0),
      isCompressed: !!data.isCompressed, compressedData: data.compressedData || null,
      orders: data.orders || [], ads: data.ads || [], parsedFiles: data.parsedFiles || [],
      dateFilter: data.dateFilter || null, createdAt: row.created_at, updatedAt: row.updated_at
    };
  } catch (err) {
    console.error('[Database] Error getting session from Turso:', err);
    return getLocalSession(userId, id);
  }
}

export async function dbSaveSession(sessionData) {
  await initDatabase();
  const userId = sessionData.userId || 'legacy';
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

  // Always mirror to local per-user backup
  saveLocalSession(userId, sessionData);

  if (!client) return sessionData;

  try {
    await client.execute({
      sql: `INSERT OR REPLACE INTO sessions 
            (id, user_id, name, month, notes, order_count, file_count, net_settlement, net_profit, return_rate, data_json, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, userId,
        sessionData.name || 'Untitled Session',
        sessionData.month || '', sessionData.notes || '',
        sessionData.orderCount ?? (sessionData.orders ? sessionData.orders.length : 0),
        sessionData.fileCount ?? (sessionData.parsedFiles ? sessionData.parsedFiles.length : 0),
        sessionData.netSettlement || 0, sessionData.netProfit || 0, sessionData.returnRate || 0,
        dataJson, createdAt, now
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

export async function dbDeleteSession(id, userId = 'legacy') {
  await initDatabase();

  deleteLocalSession(userId, id);

  if (!client) return true;

  try {
    await client.execute({
      sql: 'DELETE FROM sessions WHERE id = ? AND user_id = ?',
      args: [id, userId]
    });
    return true;
  } catch (err) {
    console.error('[Database] Error deleting session from Turso:', err);
    return true;
  }
}

// ═════════════════════════════════════════════════════
//  USER MANAGEMENT (MULTI-TENANT AUTH)
// ═════════════════════════════════════════════════════

/**
 * Find user by mobile number
 */
export async function dbGetUserByMobile(mobile) {
  await initDatabase();
  if (!client) return _localGetUserBy('mobile', mobile);
  try {
    const res = await client.execute({ sql: 'SELECT * FROM users WHERE mobile = ?', args: [mobile] });
    return res.rows.length ? _rowToUser(res.rows[0]) : null;
  } catch (err) {
    console.error('[Database] Error fetching user by mobile:', err);
    return null;
  }
}

/**
 * Find user by email address
 */
export async function dbGetUserByEmail(email) {
  await initDatabase();
  if (!client) return _localGetUserBy('email', email);
  try {
    const res = await client.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
    return res.rows.length ? _rowToUser(res.rows[0]) : null;
  } catch (err) {
    console.error('[Database] Error fetching user by email:', err);
    return null;
  }
}

/**
 * Find user by ID
 */
export async function dbGetUserById(id) {
  await initDatabase();
  if (!client) return _localGetUserBy('id', id);
  try {
    const res = await client.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
    return res.rows.length ? _rowToUser(res.rows[0]) : null;
  } catch (err) {
    console.error('[Database] Error fetching user by id:', err);
    return null;
  }
}

/**
 * Create a new user (first login via mobile or email)
 * @param {{ mobile?: string, email?: string, name?: string }}
 */
export async function dbCreateUser({ mobile = '', email = '', name = '' }) {
  await initDatabase();
  const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();

  if (!client) {
    const user = { id, mobile, name, email, created_at: now, last_login: now };
    _localSaveUser(user);
    return _rowToUser(user);
  }
  try {
    await client.execute({
      sql: `INSERT INTO users (id, mobile, name, email, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, mobile || '', email || '', name || '', now, now]
    });
    return { id, mobile, email, name, createdAt: now, lastLogin: now };
  } catch (err) {
    console.error('[Database] Error creating user:', err);
    throw err;
  }
}

/**
 * Update user's name, email, mobile, and/or last_login
 */
export async function dbUpdateUser(id, { name, email, mobile, lastLogin }) {
  await initDatabase();
  const now = new Date().toISOString();

  if (!client) {
    // Only pass fields that are actually defined — never overwrite with undefined
    const safeUpdates = {};
    if (name   !== undefined) safeUpdates.name   = name;
    if (email  !== undefined) safeUpdates.email  = email;
    if (mobile !== undefined) safeUpdates.mobile = mobile;
    safeUpdates.last_login = lastLogin || now;
    return _localUpdateUser(id, safeUpdates);
  }
  try {
    const sets = [];
    const args = [];
    if (name   !== undefined) { sets.push('name = ?');   args.push(name); }
    if (email  !== undefined) { sets.push('email = ?');  args.push(email); }
    if (mobile !== undefined) { sets.push('mobile = ?'); args.push(mobile); }
    sets.push('last_login = ?');
    args.push(lastLogin || now);
    args.push(id);
    await client.execute({ sql: `UPDATE users SET ${sets.join(', ')} WHERE id = ?`, args });
    return dbGetUserById(id);
  } catch (err) {
    console.error('[Database] Error updating user:', err);
    throw err;
  }
}

// ═════════════════════════════════════════════════════
//  OTP MANAGEMENT
// ═════════════════════════════════════════════════════

/**
 * Save a new OTP request (invalidates previous ones for this mobile)
 */
export async function dbSaveOtp({ mobile, otpHash, expiresAt }) {
  await initDatabase();
  const id = `otp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

  if (!client) {
    // In-memory fallback for local dev
    if (!global._localOtps) global._localOtps = new Map();
    global._localOtps.set(mobile, { id, mobile, otpHash, expiresAt, attempts: 0, verified: false });
    return id;
  }

  try {
    // Invalidate old OTPs for this mobile
    await client.execute({
      sql: `UPDATE otp_requests SET verified = 1 WHERE mobile = ? AND verified = 0`,
      args: [mobile]
    });
    // Insert new OTP
    await client.execute({
      sql: `INSERT INTO otp_requests (id, mobile, otp_hash, expires_at, attempts, verified) VALUES (?, ?, ?, ?, 0, 0)`,
      args: [id, mobile, otpHash, expiresAt]
    });
    return id;
  } catch (err) {
    console.error('[Database] Error saving OTP:', err);
    throw err;
  }
}

/**
 * Get the latest pending OTP for a mobile number
 */
export async function dbGetPendingOtp(mobile) {
  await initDatabase();

  if (!client) {
    if (!global._localOtps) return null;
    const rec = global._localOtps.get(mobile);
    if (!rec || rec.verified) return null;
    return { id: rec.id, otpHash: rec.otpHash, expiresAt: rec.expiresAt, attempts: rec.attempts };
  }

  try {
    const res = await client.execute({
      sql: `SELECT * FROM otp_requests WHERE mobile = ? AND verified = 0 ORDER BY expires_at DESC LIMIT 1`,
      args: [mobile]
    });
    if (!res.rows.length) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      otpHash: row.otp_hash,
      expiresAt: row.expires_at,
      attempts: Number(row.attempts)
    };
  } catch (err) {
    console.error('[Database] Error fetching OTP:', err);
    return null;
  }
}

/**
 * Increment OTP attempt count
 */
export async function dbIncrementOtpAttempts(otpId) {
  await initDatabase();
  if (!client) {
    if (global._localOtps) {
      for (const [, rec] of global._localOtps) {
        if (rec.id === otpId) { rec.attempts += 1; break; }
      }
    }
    return;
  }
  try {
    await client.execute({
      sql: `UPDATE otp_requests SET attempts = attempts + 1 WHERE id = ?`,
      args: [otpId]
    });
  } catch (err) {
    console.error('[Database] Error incrementing OTP attempts:', err);
  }
}

/**
 * Mark an OTP as used/verified
 */
export async function dbMarkOtpVerified(otpId) {
  await initDatabase();
  if (!client) {
    if (global._localOtps) {
      for (const [, rec] of global._localOtps) {
        if (rec.id === otpId) { rec.verified = true; break; }
      }
    }
    return;
  }
  try {
    await client.execute({
      sql: `UPDATE otp_requests SET verified = 1 WHERE id = ?`,
      args: [otpId]
    });
  } catch (err) {
    console.error('[Database] Error marking OTP verified:', err);
  }
}

// ── Local file fallback helpers for users (dev only) ──
const LOCAL_USERS_FILE = path.resolve(__dirname, '../data/users.json');

function _readLocalUsers() {
  try {
    if (fs.existsSync(LOCAL_USERS_FILE)) return JSON.parse(fs.readFileSync(LOCAL_USERS_FILE, 'utf8'));
  } catch (e) {}
  return {};
}

function _writeLocalUsers(users) {
  try {
    ensureLocalDirs();
    fs.writeFileSync(LOCAL_USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {}
}

function _localGetUserBy(field, value) {
  const users = _readLocalUsers();
  const user = Object.values(users).find(u => u[field] === value);
  return user ? _rowToUser(user) : null;
}

function _localSaveUser(user) {
  const users = _readLocalUsers();
  users[user.id] = user;
  _writeLocalUsers(users);
}

function _localUpdateUser(id, updates) {
  const users = _readLocalUsers();
  if (users[id]) {
    // Only merge fields that are explicitly set (skip undefined to prevent data loss)
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) users[id][key] = val;
    }
    _writeLocalUsers(users);
    return _rowToUser(users[id]);
  }
  return null;
}

function _rowToUser(row) {
  return {
    id: row.id,
    mobile: row.mobile || '',
    name: row.name || '',
    email: row.email || '',
    createdAt: row.created_at,
    lastLogin: row.last_login
  };
}
