const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const TOKENS_FILE = path.join(__dirname, '..', 'data', 'adminTokens.json');

// Load persisted tokens or initialize empty
let sessions = new Map();
try {
  if (!fs.existsSync(TOKENS_FILE)) fs.writeFileSync(TOKENS_FILE, '{}');
  const raw = fs.readFileSync(TOKENS_FILE, 'utf8');
  const obj = raw ? JSON.parse(raw) : {};
  // convert to Map but ensure created/expiresAt are numbers
  const entries = Object.entries(obj).map(([k, v]) => [k, { userId: v.userId, created: Number(v.created), expiresAt: v.expiresAt ? Number(v.expiresAt) : null }]);
  sessions = new Map(entries);
} catch (e) {
  console.error('Failed to load admin tokens, starting fresh', e);
  sessions = new Map();
}

function persist() {
  try {
    const obj = Object.fromEntries(sessions.entries());
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.error('Failed to persist admin tokens', e);
  }
}

function createToken(userId) {
  // default TTL: 7 days
  return createTokenWithTTL(userId, 1000 * 60 * 60 * 24 * 7);
}

function createTokenWithTTL(userId, ttlMs) {
  const token = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  const expiresAt = ttlMs ? now + Number(ttlMs) : null;
  sessions.set(token, { userId, created: now, expiresAt });
  persist();
  return token;
}

function validateToken(token) {
  if (!token) return null;
  const entry = sessions.get(token);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    // expired
    sessions.delete(token);
    persist();
    return null;
  }
  return entry.userId;
}

function revokeToken(token) {
  sessions.delete(token);
  persist();
}

function listTokens() {
  // prune expired tokens and return array of { token, userId, created, expiresAt }
  const now = Date.now();
  for (const [t, info] of sessions.entries()) {
    if (info.expiresAt && now > info.expiresAt) sessions.delete(t);
  }
  persist();
  return Array.from(sessions.entries()).map(([token, info]) => ({ token, ...info }));
}

module.exports = { createToken, validateToken, revokeToken, listTokens };

// Return a plain object of token -> { userId, created }
function listTokens() {
  try {
    return Object.fromEntries(sessions.entries());
  } catch (e) {
    return {};
  }
}

module.exports.listTokens = listTokens;
