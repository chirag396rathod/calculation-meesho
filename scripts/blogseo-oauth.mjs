/**
 * BlogSEO MCP — OAuth 2.1 (PKCE) sign-in helper.
 * Registers nothing: uses the dynamically registered client, opens the browser,
 * captures the redirect on a local loopback server, exchanges the code and
 * stores tokens in .blogseo-tokens.json (gitignored).
 *
 * Usage: node scripts/blogseo-oauth.mjs
 */
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN_FILE = path.join(root, '.blogseo-tokens.json');

const ISSUER = 'https://kccqmbkylzrrhibpxtbk.supabase.co/auth/v1';
const AUTHORIZE_URL = `${ISSUER}/oauth/authorize`;
const TOKEN_URL = `${ISSUER}/oauth/token`;
const REGISTER_URL = `${ISSUER}/oauth/clients/register`;
const RESOURCE = 'https://mcp.blogseo.io/mcp';
const PORT = 8746;
const REDIRECT_URI = 'http://127.0.0.1:8746/callback';

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const verifier = b64url(crypto.randomBytes(48));
const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
const state = b64url(crypto.randomBytes(16));

async function registerClient() {
  const res = await fetch(REGISTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'FC Analytics SEO',
      redirect_uris: [REDIRECT_URI, 'http://localhost:8746/callback'],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope: 'openid email offline_access'
    })
  });
  const json = await res.json();
  if (!res.ok || !json.client_id) throw new Error(`Client registration failed: ${JSON.stringify(json)}`);
  return json.client_id;
}

const CLIENT_ID = await registerClient();
console.log('Registered fresh OAuth client:', CLIENT_ID);

const authUrl = new URL(AUTHORIZE_URL);
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid email offline_access');
authUrl.searchParams.set('state', state);
authUrl.searchParams.set('code_challenge', challenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

function exchange(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier,
    resource: RESOURCE
  });
  return fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  }).then(async (r) => {
    const json = await r.json();
    if (!r.ok) {
      body.delete('resource');
      return fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      }).then(async (r2) => {
        const j2 = await r2.json();
        if (!r2.ok) throw new Error(JSON.stringify(j2));
        return j2;
      });
    }
    return json;
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== '/callback') {
    res.writeHead(404).end();
    return;
  }
  if (url.searchParams.get('state') !== state) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h3>State mismatch — close this tab and retry.</h3>');
    return;
  }
  const err = url.searchParams.get('error');
  if (err) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(`<h3>Sign-in failed: ${err}</h3><p>${url.searchParams.get('error_description') || ''}</p>`);
    console.error('OAuth error:', err, url.searchParams.get('error_description'));
    process.exit(1);
  }
  const code = url.searchParams.get('code');
  try {
    const tokens = await exchange(code);
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ ...tokens, obtained_at: Date.now() }, null, 2));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h3 style="font-family:sans-serif">BlogSEO connected — you can close this tab and return to the terminal.</h3>');
    console.log('Tokens saved to', path.relative(root, TOKEN_FILE));
  } catch (e) {
    console.error('Token exchange failed:', e.message);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h3>Token exchange failed — check the terminal.</h3>');
    process.exit(1);
  }
  server.close();
  process.exit(0);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Waiting for BlogSEO sign-in on http://127.0.0.1:${PORT}/callback ...`);
  const urlStr = authUrl.toString();
  const openCmd =
    process.platform === 'win32'
      ? `rundll32 url.dll,FileProtocolHandler "${urlStr}"`
      : process.platform === 'darwin'
        ? `open "${urlStr}"`
        : `xdg-open "${urlStr}"`;
  exec(openCmd, (err) => {
    if (err) console.log('Auto-open failed. Copy this FULL single line into your browser:\n\n' + urlStr + '\n');
  });
  console.log('\nBrowser opening for BlogSEO sign-in — complete it within 5 minutes.');
  console.log('Do NOT copy the URL from the terminal unless auto-open fails (line wraps break it).');
  console.log('Fallback URL (copy as ONE line):\n');
  console.log(urlStr);
});

const TIMEOUT_MS = (Number(process.argv[2]) || 5) * 60 * 1000;

setTimeout(() => {
  console.error(`Timed out waiting for sign-in (${TIMEOUT_MS / 60000} minutes).`);
  server.close();
  process.exit(1);
}, TIMEOUT_MS).unref();
