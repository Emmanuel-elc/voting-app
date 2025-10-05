const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const router = express.Router();

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

function loadUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

const { validateToken } = require('../lib/adminSessions');

function getTokenFromReq(req) {
  // Try Authorization header first (Bearer <token>)
  const auth = req.headers && req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  // fallback to query or body
  if (req.query && req.query.adminToken) return req.query.adminToken;
  if (req.body && req.body.adminToken) return req.body.adminToken;
  return null;
}

// Login: expects { id, password }
router.post('/login', async (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) return res.status(400).json({ error: 'Missing id or password' });

  try {
    const users = loadUsers();
    const user = users.find(u => u.id === id);
    if (!user) return res.status(400).json({ error: 'Invalid ID or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid ID or password' });

    // Return minimal user object (no password)
    const out = { id: user.id, name: user.name, role: user.role || 'voter', votedPolls: user.votedPolls || [] };
    // If admin, return an admin token for protected pages
    let adminToken = null;
    if (out.role === 'admin') {
      try {
        const { createToken } = require('../lib/adminSessions');
        adminToken = createToken(out.id);
      } catch (e) {
        console.error('Failed to create admin token', e);
      }
    }

    res.json({ success: true, data: out, adminToken });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Register: expects { id, name, password }
router.post('/register', async (req, res) => {
  const { id, name, password, adminKey } = req.body;
  const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';
  // Allow registration when correct adminKey is provided OR when a valid adminToken is supplied
  const token = getTokenFromReq(req);
  const tokenValidUser = token ? validateToken(token) : null;
  if (adminKey !== ADMIN_KEY && !tokenValidUser) return res.status(403).json({ success: false, error: 'Admin key or admin token required' });
  if (!id || !name || !password) return res.status(400).json({ success: false, error: 'Missing fields' });

  try {
    const users = loadUsers();
    if (users.find(u => u.id === id)) return res.status(400).json({ success: false, error: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = { id, name, password: hashed, role: 'voter', votedPolls: [] };
    users.push(newUser);
    saveUsers(users);

    res.json({ success: true, data: { id: newUser.id, name: newUser.name, role: newUser.role } });
  } catch (err) {
    console.error('Registration failed:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Admin token check - supports Authorization: Bearer <token> or ?adminToken=
router.get('/check-admin', (req, res) => {
  const token = getTokenFromReq(req);
  const userId = token ? validateToken(token) : null;
  if (!userId) return res.status(403).json({ success: false, error: 'Invalid admin token' });
  return res.json({ success: true, data: { userId } });
});

// List voters (admin only)
router.get('/voters', (req, res) => {
  const token = getTokenFromReq(req);
  const userId = token ? validateToken(token) : null;
  if (!userId) return res.status(403).json({ success: false, error: 'Admin token required' });

  try {
    const users = loadUsers();
    const out = users.map(u => ({ id: u.id, name: u.name, role: u.role || 'voter', votedPolls: u.votedPolls || [] }));
    res.json({ success: true, data: out });
  } catch (e) {
    console.error('Failed to load voters', e);
    res.status(500).json({ success: false, error: 'Failed to load voters' });
  }
});

module.exports = router;
