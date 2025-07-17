const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Path to users.json
const usersFile = path.join(__dirname, '../data/users.json');

// Load users from file
function loadUsers() {
  if (!fs.existsSync(usersFile)) return [];
  const data = fs.readFileSync(usersFile, 'utf-8');
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error('Invalid users.json format');
    return [];
  }
}

// Save users to file (for future use if needed)
function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// POST /auth/login
router.post('/login', (req, res) => {
  const { idNumber, password } = req.body;
  if (!idNumber || !password) {
    return res.status(400).json({ error: 'ID number and password required' });
  }

  const users = loadUsers();
  const user = users.find(u => u.idNumber === idNumber && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid ID or password' });
  }

  res.json({ message: 'Login successful', user: { name: user.name, idNumber: user.idNumber } });
});

module.exports = router;
