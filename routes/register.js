const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const VOTERS_FILE = path.join(__dirname, '../data/voters.json');

// Ensure file exists
if (!fs.existsSync(VOTERS_FILE)) {
  fs.writeFileSync(VOTERS_FILE, '[]');
}

router.post('/', (req, res) => {
  const { id, name, password, adminKey } = req.body;

  if (adminKey !== 'admin123') {
    return res.status(403).json({ error: 'Unauthorized access' });
  }

  const voters = JSON.parse(fs.readFileSync(VOTERS_FILE));
  if (voters.find(v => v.id === id)) {
    return res.status(400).json({ error: 'Voter with this ID already exists' });
  }

  voters.push({ id, name, password });
  fs.writeFileSync(VOTERS_FILE, JSON.stringify(voters, null, 2));
  res.json({ message: 'Voter registered successfully' });
});

module.exports = router;
