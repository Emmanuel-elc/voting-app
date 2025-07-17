const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const USERS_FILE = path.join(__dirname, '../data/users.json');

function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Register route
router.post('/register', (req, res) => {
  const { id, name, password } = req.body;

  if (!id || !name || !password) {
    return res.status(400).json({ error: 'ID, name, and password are required' });
  }

  const users = loadUsers();
  const exists = users.find(u => u.id === id);

  if (exists) {
    return res.status(409).json({ error: 'User ID already exists' });
  }

  users.push({ id, name, password });
  saveUsers(users);
  res.json({ message: 'User registered successfully' });
});

// Login route
router.post('/login', (req, res) => {
  const { id, password } = req.body;
  const users = loadUsers();
  const user = users.find(u => u.id === id && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid ID or password' });
  }

  res.json({ name: user.name });
});

module.exports = router;
