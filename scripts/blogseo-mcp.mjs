/**
 * BlogSEO MCP client — calls https://mcp.blogseo.io/mcp with stored OAuth tokens.
 *
 * Usage:
 *   node scripts/blogseo-mcp.mjs                          -> initialize + tools/list
 *   node scripts/blogseo-mcp.mjs <tool> [jsonArgs]        -> tools/call
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN_FILE = path.join(root, '.blogseo-tokens.json');
const MCP_URL = 'https://mcp.blogseo.io/mcp';

function loadTokens() {
  if (!fs.existsSync(TOKEN_FILE)) {
    console.error('No tokens found. Run: node scripts/blogseo-oauth.mjs');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
}

async function refreshTokens(tokens) {
  if (!tokens.refresh_token) throw new Error('Token expired and no refresh_token available.');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
    client_id: '7a41eaa6-8dbd-4238-bc7c-5ff4454c00e5',
    resource: MCP_URL
  });
  const res = await fetch('https://kccqmbkylzrrhibpxtbk.supabase.co/auth/v1/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Refresh failed: ${JSON.stringify(json)}`);
  const merged = { ...tokens, ...json, obtained_at: Date.now() };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(merged, null, 2));
  return merged;
}

function parseSseOrJson(text) {
  if (text.startsWith('event:') || text.startsWith('data:') || text.includes('\ndata:')) {
    const messages = [];
    for (const block of text.split('\n\n')) {
      const dataLines = block
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim());
      if (dataLines.length) {
        try { messages.push(JSON.parse(dataLines.join('\n'))); } catch { /* skip */ }
      }
    }
    return messages;
  }
  try { return [JSON.parse(text)]; } catch { return []; }
}

async function rpc(tokens, method, params, sessionId) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${tokens.access_token}`,
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {})
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params })
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  const sid = res.headers.get('mcp-session-id');
  const text = await res.text();
  const messages = parseSseOrJson(text);
  const payload = messages.find((m) => m.id !== undefined) || messages[0];
  if (!payload) {
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
    throw new Error(`Empty MCP response (${res.status})`);
  }
  if (payload.error) throw new Error(`MCP error: ${JSON.stringify(payload.error)}`);
  return { result: payload.result, sessionId: sid || sessionId };
}

async function main() {
  let tokens = loadTokens();
  const [, , toolName, rawArgs] = process.argv;

  let session = null;
  let init;
  try {
    init = await rpc(tokens, 'initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'fc-analytics', version: '1.0.0' }
    });
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') {
      tokens = await refreshTokens(tokens);
      init = await rpc(tokens, 'initialize', {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'fc-analytics', version: '1.0.0' }
      });
    } else throw e;
  }
  session = init.sessionId;

  if (!toolName) {
    const list = await rpc(tokens, 'tools/list', {}, session);
    const tools = (list.result.tools || []).map((t) => `- ${t.name}: ${(t.description || '').slice(0, 120)}`);
    console.log(tools.join('\n'));
    return;
  }

  let args = {};
  if (rawArgs) {
    let argsRaw = rawArgs;
    if (argsRaw.startsWith('@')) argsRaw = fs.readFileSync(argsRaw.slice(1), 'utf8');
    try { args = JSON.parse(argsRaw); } catch { args = { query: argsRaw }; }
  }

  let call;
  try {
    call = await rpc(tokens, 'tools/call', { name: toolName, arguments: args }, session);
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') {
      tokens = await refreshTokens(tokens);
      const reInit = await rpc(tokens, 'initialize', {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'fc-analytics', version: '1.0.0' }
      });
      call = await rpc(tokens, 'tools/call', { name: toolName, arguments: args }, reInit.sessionId);
    } else throw e;
  }

  const content = call.result?.content || [];
  for (const c of content) {
    if (c.type === 'text') console.log(c.text);
    else console.log(JSON.stringify(c));
  }
  if (call.result?.isError) process.exit(2);
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
