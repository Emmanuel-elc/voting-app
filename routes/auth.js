const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const router = express.Router();

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

// Helper to load and save users
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ✅ REGISTER USER
router.post('/register', async (req, res) => {
  const { id, name, password, isAdmin = false } = req.body;

  if (!id || !name || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const users = loadUsers();
  const existing = users.find(u => u.id === id);
  if (existing) return res.status(409).json({ error: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ id, name, password: hashedPassword, isAdmin });
  saveUsers(users);

  res.json({ message: 'User registered successfully' });
});

// ✅ LOGIN USER
router.post('/login', async (req, res) => {
  const { id, password } = req.body;

  const users = loadUsers();
  const user = users.find(u => u.id === id);
  if (!user) return res.status(401).json({ error: 'Invalid ID or password' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid ID or password' });

  res.json({ message: 'Login successful', name: user.name, isAdmin: user.isAdmin });
});

module.exports = router;
