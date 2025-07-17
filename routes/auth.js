const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const usersFile = path.join(__dirname, '../data/users.json');

// Load users from the file
function loadUsers() {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile));
}

// POST /login
router.post('/', (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) {
    return res.status(400).json({ error: 'ID and password are required' });
  }

  const users = loadUsers();
  const user = users.find(u => u.id === id && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid ID or password' });
  }

  // Return only public info
  res.json({ id: user.id, name: user.name });
});

module.exports = router;
