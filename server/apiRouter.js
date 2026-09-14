/**
 * apiRouter.js — Backend REST API router
 * Handles /api/sku-groups, /api/sku-costs, and /api/sessions
 * Powered by Turso LibSQL Cloud Database with local fallback
 */

import {
  dbGetSkuData,
  dbCreateSkuGroup,
  dbUpdateSkuGroup,
  dbDeleteSkuGroup,
  dbBulkSyncSku,
  dbUpdateSkuCost,
  dbListSessions,
  dbGetSession,
  dbSaveSession,
  dbUpdateSession,
  dbDeleteSession
} from './db.js';

/**
 * Handle incoming API requests
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Function} next
 */
export async function handleApiRequest(req, res, next) {
  // Determine actual requested API path (supports Vite, Vercel rewrites, and serverless catch-alls)
  let rawUrl = req.url || '';
  if (req.headers && req.headers['x-forwarded-uri']) {
    rawUrl = req.headers['x-forwarded-uri'];
  } else if (req.query && req.query.path) {
    const p = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    rawUrl = `/api/${p}`;
  }

  const [pathOnly] = rawUrl.split('?');

  if (!pathOnly.startsWith('/api/') && pathOnly !== '/api') {
    if (next) return next();
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
  }

  // Parse body helper for JSON (supports both streams and pre-parsed Vercel bodies)
  const getBody = () => new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body);
    }
    if (typeof req.body === 'string') {
      try {
        return resolve(req.body ? JSON.parse(req.body) : {});
      } catch (e) {
        return reject(new Error('Invalid JSON payload'));
      }
    }
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });

  const sendJson = (status, payload) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end(JSON.stringify(payload));
  };

  if (req.method === 'OPTIONS') {
    return sendJson(200, { ok: true });
  }

  // Health check on /api
  if (pathOnly === '/api' || pathOnly === '/api/') {
    return sendJson(200, {
      success: true,
      message: 'FC Analytics Backend API is live on Turso Database',
      endpoints: ['/api/sku-groups', '/api/sku-costs/:sku', '/api/sessions']
    });
  }

  try {
    // ═══════════════════════════════════════════
    //  MONTHLY SESSIONS ENDPOINTS
    // ═══════════════════════════════════════════

    // 1. GET /api/sessions (list session summaries)
    if (req.method === 'GET' && pathOnly === '/api/sessions') {
      const list = await dbListSessions();
      return sendJson(200, {
        success: true,
        data: list
      });
    }

    // 2. POST /api/sessions (create / save session)
    if (req.method === 'POST' && pathOnly === '/api/sessions') {
      const body = await getBody();
      const name = (body.name || '').trim() || 'Untitled Month Session';
      const month = (body.month || '').trim();

      const newSession = await dbSaveSession({
        id: body.id,
        name,
        month,
        notes: body.notes || '',
        orderCount: body.orderCount ?? (body.orders ? body.orders.length : 0),
        fileCount: body.fileCount ?? (body.parsedFiles ? body.parsedFiles.length : 0),
        netSettlement: body.netSettlement || 0,
        netProfit: body.netProfit || 0,
        returnRate: body.returnRate || 0,
        parsedFiles: body.parsedFiles || [],
        orders: body.orders || [],
        ads: body.ads || [],
        dateFilter: body.dateFilter || null
      });

      return sendJson(201, {
        success: true,
        message: `Session "${name}" saved`,
        data: newSession
      });
    }

    // 3. GET /api/sessions/:id (get full session data)
    const sessionGetMatch = pathOnly.match(/^\/api\/sessions\/([^/]+)$/);
    if (req.method === 'GET' && sessionGetMatch) {
      const sessionId = sessionGetMatch[1];
      const session = await dbGetSession(sessionId);
      if (!session) {
        return sendJson(404, { success: false, error: 'Session not found' });
      }
      return sendJson(200, {
        success: true,
        data: session
      });
    }

    // 4. PUT /api/sessions/:id (edit session details / contents)
    const sessionPutMatch = pathOnly.match(/^\/api\/sessions\/([^/]+)$/);
    if (req.method === 'PUT' && sessionPutMatch) {
      const sessionId = sessionPutMatch[1];
      const body = await getBody();
      const saved = await dbUpdateSession(sessionId, body);
      return sendJson(200, {
        success: true,
        message: `Session "${saved.name}" updated`,
        data: saved
      });
    }

    // 5. DELETE /api/sessions/:id (delete session)
    const sessionDeleteMatch = pathOnly.match(/^\/api\/sessions\/([^/]+)$/);
    if (req.method === 'DELETE' && sessionDeleteMatch) {
      const sessionId = sessionDeleteMatch[1];
      const deleted = await dbDeleteSession(sessionId);
      if (!deleted) {
        return sendJson(404, { success: false, error: 'Session not found' });
      }
      return sendJson(200, {
        success: true,
        message: 'Session deleted successfully'
      });
    }

    // ═══════════════════════════════════════════
    //  SKU GROUPS & COSTING ENDPOINTS
    // ═══════════════════════════════════════════

    // GET /api/sku-groups
    if (req.method === 'GET' && pathOnly === '/api/sku-groups') {
      const data = await dbGetSkuData();
      return sendJson(200, {
        success: true,
        data: {
          groups: data.groups || [],
          skuCosts: data.skuCosts || {}
        }
      });
    }

    // POST /api/sku-groups/bulk-sync
    if (req.method === 'POST' && pathOnly === '/api/sku-groups/bulk-sync') {
      const body = await getBody();
      const data = await dbBulkSyncSku(body);

      return sendJson(200, {
        success: true,
        message: `Synced ${data.groups.length} groups`,
        data: {
          groups: data.groups,
          skuCosts: data.skuCosts
        }
      });
    }

    // POST /api/sku-groups
    if (req.method === 'POST' && pathOnly === '/api/sku-groups') {
      const body = await getBody();
      const name = (body.name || '').trim();
      const rawCost = parseFloat(body.rawCost) || 0;
      const skus = Array.isArray(body.skus) ? body.skus : [];

      if (!name) {
        return sendJson(400, { success: false, error: 'Group name is required' });
      }

      try {
        const newGroup = await dbCreateSkuGroup({ name, rawCost, skus });
        return sendJson(201, {
          success: true,
          message: `Group "${name}" created`,
          data: newGroup
        });
      } catch (e) {
        if (e.message.includes('already exists')) {
          return sendJson(409, { success: false, error: e.message });
        }
        throw e;
      }
    }

    // PUT /api/sku-groups/:id
    const updateMatch = pathOnly.match(/^\/api\/sku-groups\/([^/]+)$/);
    if (req.method === 'PUT' && updateMatch) {
      const groupId = updateMatch[1];
      const body = await getBody();
      try {
        const updated = await dbUpdateSkuGroup(groupId, body);
        return sendJson(200, {
          success: true,
          message: `Group "${updated.name}" updated`,
          data: updated
        });
      } catch (e) {
        if (e.message.includes('not found')) {
          return sendJson(404, { success: false, error: e.message });
        }
        if (e.message.includes('already exists')) {
          return sendJson(409, { success: false, error: e.message });
        }
        throw e;
      }
    }

    // DELETE /api/sku-groups/:id
    const deleteMatch = pathOnly.match(/^\/api\/sku-groups\/([^/]+)$/);
    if (req.method === 'DELETE' && deleteMatch) {
      const groupId = deleteMatch[1];
      try {
        const deleted = await dbDeleteSkuGroup(groupId);
        return sendJson(200, {
          success: true,
          message: `Group "${deleted.name}" deleted`,
          data: deleted
        });
      } catch (e) {
        if (e.message.includes('not found')) {
          return sendJson(404, { success: false, error: e.message });
        }
        throw e;
      }
    }

    // PUT /api/sku-costs/:sku
    const costMatch = pathOnly.match(/^\/api\/sku-costs\/([^/]+)$/);
    if (req.method === 'PUT' && costMatch) {
      const sku = decodeURIComponent(costMatch[1]);
      const body = await getBody();
      const cost = parseFloat(body.rawCost ?? body.cost) || 0;

      const updated = await dbUpdateSkuCost(sku, cost);
      return sendJson(200, {
        success: true,
        message: `Cost for SKU "${sku}" updated to ₹${cost}`,
        data: updated
      });
    }

    // Route not recognized
    return sendJson(404, { success: false, error: 'API endpoint not found' });
  } catch (err) {
    console.error('[API Error]:', err);
    return sendJson(500, { success: false, error: err.message || 'Internal server error' });
  }
}
