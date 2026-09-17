/**
 * apiRouter.js — Backend REST API router
 * Handles /api/auth/*, /api/sku-groups, /api/sku-costs, and /api/sessions
 * All data endpoints are scoped per authenticated user (multi-tenant).
 * Powered by Turso LibSQL Cloud Database with local fallback.
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
  dbDeleteSession,
  dbGetUserByMobile,
  dbGetUserByEmail,
  dbGetUserById,
  dbCreateUser,
  dbUpdateUser,
  dbSaveOtp,
  dbGetPendingOtp,
  dbIncrementOtpAttempts,
  dbMarkOtpVerified
} from './db.js';

import {
  generateOtp,
  hashOtp,
  compareOtp,
  sendOtp,
  generateJwt,
  verifyJwt,
  normalizeMobile,
  normalizeEmail,
  parseLoginInput,
  checkOtpRateLimit,
  authMiddleware,
  OTP_TTL_MINUTES,
  OTP_MAX_ATTEMPTS
} from './auth.js';

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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end(JSON.stringify(payload));
  };

  if (req.method === 'OPTIONS') {
    return sendJson(200, { ok: true });
  }

  // Health check on /api
  if (pathOnly === '/api' || pathOnly === '/api/') {
    const isLocalDb = process.env.USE_LOCAL_DB === 'true';
    return sendJson(200, {
      success: true,
      message: `FC Analytics Backend API is live (${isLocalDb ? 'Local File DB' : 'Turso Cloud DB'})`,
      databaseMode: isLocalDb ? 'local' : 'turso',
      endpoints: ['/api/sku-groups', '/api/sku-costs/:sku', '/api/sessions']
    });
  }

  try {
    // ═══════════════════════════════════════════
    //  AUTH ENDPOINTS (no JWT required)
    // ═══════════════════════════════════════════

    // POST /api/auth/send-otp  { input: "9876543210" | "user@email.com" }
    if (req.method === 'POST' && pathOnly === '/api/auth/send-otp') {
      const body = await getBody();
      // Accept 'input' (new unified field) or legacy 'mobile'/'email' fields
      const raw = body.input || body.mobile || body.email || '';
      const contact = parseLoginInput(raw);

      if (!contact) {
        return sendJson(400, { success: false, error: 'Enter a valid 10-digit mobile number or email address.' });
      }

      const rateLimitKey = contact.mobile || contact.email;
      const rateCheck = checkOtpRateLimit(rateLimitKey);
      if (!rateCheck.allowed) {
        return sendJson(429, { success: false, error: `Too many OTP requests. Try again in ${rateCheck.minutesLeft} minutes.` });
      }

      const otp = generateOtp();
      const otpHash = await hashOtp(otp);
      const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();
      const otpKey = contact.mobile || contact.email;

      await dbSaveOtp({ mobile: otpKey, otpHash, expiresAt });
      await sendOtp(contact, otp);

      const maskedDest = contact.mobile
        ? contact.mobile.replace(/(\+91)(\d{2})\d{4}(\d{4})/, '$1$2****$3')
        : contact.email.replace(/(.)(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c);

      return sendJson(200, {
        success: true,
        message: `OTP sent to ${maskedDest}`,
        channel: contact.type,   // 'mobile' or 'email'
        expiresIn: OTP_TTL_MINUTES * 60
      });
    }

    // POST /api/auth/verify-otp  { input: "9876543210" | "email@x.com", otp: "482910" }
    if (req.method === 'POST' && pathOnly === '/api/auth/verify-otp') {
      const body = await getBody();
      const raw = body.input || body.mobile || body.email || '';
      const contact = parseLoginInput(raw);
      const otp = String(body.otp || '').trim();

      if (!contact || !otp) {
        return sendJson(400, { success: false, error: 'Login input and OTP are required.' });
      }

      const otpKey = contact.mobile || contact.email;
      const otpRecord = await dbGetPendingOtp(otpKey);
      if (!otpRecord) {
        return sendJson(400, { success: false, error: 'No OTP found. Please request a new one.' });
      }

      if (new Date(otpRecord.expiresAt) < new Date()) {
        return sendJson(400, { success: false, error: 'OTP has expired. Please request a new one.' });
      }

      if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
        return sendJson(429, { success: false, error: 'Too many wrong attempts. Request a new OTP.' });
      }

      const isValid = await compareOtp(otp, otpRecord.otpHash);
      if (!isValid) {
        await dbIncrementOtpAttempts(otpRecord.id);
        const remaining = OTP_MAX_ATTEMPTS - otpRecord.attempts - 1;
        return sendJson(400, { success: false, error: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` });
      }

      await dbMarkOtpVerified(otpRecord.id);

      // Find or create user — check mobile OR email
      let user = contact.mobile
        ? await dbGetUserByMobile(contact.mobile)
        : await dbGetUserByEmail(contact.email);

      const isNewUser = !user;
      if (!user) {
        // New user — create with whatever contact info we have
        user = await dbCreateUser({
          mobile: contact.mobile || '',
          email:  contact.email  || ''
        });
      } else {
        // Returning user — always refresh lastLogin and fill in any missing contact info
        const updates = { lastLogin: new Date().toISOString() };
        if (contact.mobile) updates.mobile = contact.mobile; // always write mobile if used to login
        if (contact.email)  updates.email  = contact.email;  // always write email if used to login
        await dbUpdateUser(user.id, updates);
        user = await dbGetUserById(user.id);
      }

      const token = generateJwt(user.id, otpKey);

      return sendJson(200, {
        success: true,
        token,
        user: { id: user.id, mobile: user.mobile, email: user.email, name: user.name },
        isNewUser
      });
    }

    // POST /api/auth/profile  { name: "...", email: "..." }  (JWT required)
    if (req.method === 'POST' && pathOnly === '/api/auth/profile') {
      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      const payload = token ? verifyJwt(token) : null;
      if (!payload) return sendJson(401, { success: false, error: 'Authentication required.' });

      const body = await getBody();
      const name  = (body.name  || '').trim();
      const email = (body.email || '').trim();

      await dbUpdateUser(payload.userId, { name, email });
      const updatedUser = await dbGetUserById(payload.userId);

      return sendJson(200, {
        success: true,
        message: 'Profile updated',
        user: updatedUser
          ? { id: updatedUser.id, mobile: updatedUser.mobile, email: updatedUser.email, name: updatedUser.name }
          : { id: payload.userId, name, email }
      });
    }

    // GET /api/auth/me  — validate token, return fresh user from DB
    if (req.method === 'GET' && pathOnly === '/api/auth/me') {
      const authHeader = req.headers['authorization'] || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      const payload = token ? verifyJwt(token) : null;
      if (!payload) return sendJson(401, { success: false, error: 'Session expired.' });

      const user = await dbGetUserById(payload.userId);
      if (!user) return sendJson(404, { success: false, error: 'User not found.' });

      return sendJson(200, {
        success: true,
        user: { id: user.id, mobile: user.mobile, email: user.email, name: user.name }
      });
    }

    // POST /api/auth/logout  (client just drops the token, but we acknowledge)
    if (req.method === 'POST' && pathOnly === '/api/auth/logout') {
      return sendJson(200, { success: true, message: 'Logged out successfully.' });
    }

    // ═══════════════════════════════════════════
    //  PROTECTED ENDPOINTS — require valid JWT
    //  (authMiddleware sets req.userId)
    // ═══════════════════════════════════════════
    const authed = await new Promise((resolve) => {
      authMiddleware(req, res, () => resolve(true));
      // If authMiddleware calls res.end(), the promise stays pending;
      // we resolve(false) via a small trick:
    }).catch(() => false);

    // If authMiddleware already sent a 401 response, just return
    if (res.writableEnded) return;

    const userId = req.userId;

    // ═══════════════════════════════════════════
    //  MONTHLY SESSIONS ENDPOINTS
    // ═══════════════════════════════════════════

    // 1. GET /api/sessions (list session summaries)
    if (req.method === 'GET' && pathOnly === '/api/sessions') {
      const list = await dbListSessions(userId);
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
        userId,
        name,
        month,
        notes: body.notes || '',
        orderCount: body.orderCount ?? (body.orders ? body.orders.length : 0),
        fileCount: body.fileCount ?? (body.parsedFiles ? body.parsedFiles.length : 0),
        netSettlement: body.netSettlement || 0,
        netProfit: body.netProfit || 0,
        returnRate: body.returnRate || 0,
        isCompressed: !!body.isCompressed,
        compressedData: body.compressedData || null,
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
      const session = await dbGetSession(sessionId, userId);
      if (!session) {
        return sendJson(404, { success: false, error: 'Session not found' });
      }
      return sendJson(200, { success: true, data: session });
    }

    // 4. PUT /api/sessions/:id
    const sessionPutMatch = pathOnly.match(/^\/api\/sessions\/([^/]+)$/);
    if (req.method === 'PUT' && sessionPutMatch) {
      const sessionId = sessionPutMatch[1];
      const body = await getBody();
      const saved = await dbUpdateSession(sessionId, { ...body, userId });
      return sendJson(200, { success: true, message: `Session "${saved.name}" updated`, data: saved });
    }

    // 5. DELETE /api/sessions/:id
    const sessionDeleteMatch = pathOnly.match(/^\/api\/sessions\/([^/]+)$/);
    if (req.method === 'DELETE' && sessionDeleteMatch) {
      const sessionId = sessionDeleteMatch[1];
      const deleted = await dbDeleteSession(sessionId, userId);
      if (!deleted) return sendJson(404, { success: false, error: 'Session not found' });
      return sendJson(200, { success: true, message: 'Session deleted successfully' });
    }

    // ═══════════════════════════════════════════
    //  SKU GROUPS & COSTING ENDPOINTS
    // ═══════════════════════════════════════════

    // GET /api/sku-groups
    if (req.method === 'GET' && pathOnly === '/api/sku-groups') {
      const data = await dbGetSkuData(userId);
      return sendJson(200, { success: true, data: { groups: data.groups || [], skuCosts: data.skuCosts || {} } });
    }

    // POST /api/sku-groups/bulk-sync
    if (req.method === 'POST' && pathOnly === '/api/sku-groups/bulk-sync') {
      const body = await getBody();
      const data = await dbBulkSyncSku({ ...body, userId });
      return sendJson(200, { success: true, message: `Synced ${data.groups.length} groups`, data: { groups: data.groups, skuCosts: data.skuCosts } });
    }

    // POST /api/sku-groups
    if (req.method === 'POST' && pathOnly === '/api/sku-groups') {
      const body = await getBody();
      const name = (body.name || '').trim();
      const rawCost = parseFloat(body.rawCost) || 0;
      const skus = Array.isArray(body.skus) ? body.skus : [];

      if (!name) return sendJson(400, { success: false, error: 'Group name is required' });

      try {
        const newGroup = await dbCreateSkuGroup({ name, rawCost, skus, userId });
        return sendJson(201, { success: true, message: `Group "${name}" created`, data: newGroup });
      } catch (e) {
        if (e.message.includes('already exists')) return sendJson(409, { success: false, error: e.message });
        throw e;
      }
    }

    // PUT /api/sku-groups/:id
    const updateMatch = pathOnly.match(/^\/api\/sku-groups\/([^/]+)$/);
    if (req.method === 'PUT' && updateMatch) {
      const groupId = updateMatch[1];
      const body = await getBody();
      try {
        const updated = await dbUpdateSkuGroup(groupId, body, userId);
        return sendJson(200, { success: true, message: `Group "${updated.name}" updated`, data: updated });
      } catch (e) {
        if (e.message.includes('not found')) return sendJson(404, { success: false, error: e.message });
        if (e.message.includes('already exists')) return sendJson(409, { success: false, error: e.message });
        throw e;
      }
    }

    // DELETE /api/sku-groups/:id
    const deleteMatch = pathOnly.match(/^\/api\/sku-groups\/([^/]+)$/);
    if (req.method === 'DELETE' && deleteMatch) {
      const groupId = deleteMatch[1];
      try {
        const deleted = await dbDeleteSkuGroup(groupId, userId);
        return sendJson(200, { success: true, message: `Group "${deleted.name}" deleted`, data: deleted });
      } catch (e) {
        if (e.message.includes('not found')) return sendJson(404, { success: false, error: e.message });
        throw e;
      }
    }

    // PUT /api/sku-costs/:sku
    const costMatch = pathOnly.match(/^\/api\/sku-costs\/([^/]+)$/);
    if (req.method === 'PUT' && costMatch) {
      const sku = decodeURIComponent(costMatch[1]);
      const body = await getBody();
      const cost = parseFloat(body.rawCost ?? body.cost) || 0;

      const updated = await dbUpdateSkuCost(sku, cost, userId);
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
