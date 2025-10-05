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
  sessions = new Map(Object.entries(obj));
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
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { userId, created: Date.now() });
  persist();
  return token;
}

function validateToken(token) {
  if (!token) return null;
  const entry = sessions.get(token);
  if (!entry) return null;
  return entry.userId;
}

function revokeToken(token) {
  sessions.delete(token);
  persist();
}

module.exports = { createToken, validateToken, revokeToken };
