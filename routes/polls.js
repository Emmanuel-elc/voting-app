const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../pollsData.json');

function loadPolls() {
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath, 'utf-8');
  if (!raw.trim()) return [];
  return JSON.parse(raw);
}

function savePolls(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// GET /polls — fetch all or only expired polls based on query
router.get('/', (req, res) => {
  const polls = loadPolls();
  const now = new Date();
  const expiredOnly = req.query.expired === 'true';

  const filtered = polls.filter(poll => {
    if (!poll.expiresAt) return !expiredOnly; // No expiry, show only in active
    const isExpired = new Date(poll.expiresAt) < now;
    return expiredOnly ? isExpired : !isExpired;
  });

  res.json(filtered);
});


// Create a new poll
router.post('/', (req, res) => {
  const polls = loadPolls();
  const { question, options, expiresAt } = req.body;

  const newPoll = {
    id: Date.now(),
    question,
    options,
    createdAt: new Date(),
    expiresAt: expiresAt || null
  };

  polls.push(newPoll);
  savePolls(polls);
  res.status(201).json(newPoll);
});

// Get single poll
router.get('/', (req, res) => {
  const polls = loadPolls();
  const now = new Date();

  const expiredOnly = req.query.expired === 'true';

  const filtered = polls.filter(poll => {
    if (!poll.expiresAt) return !expiredOnly;
    const isExpired = new Date(poll.expiresAt) < now;
    return expiredOnly ? isExpired : !isExpired;
  });

  res.json(filtered);
});


// Vote
router.post('/:id/vote', (req, res) => {
  const polls = loadPolls();
  const poll = polls.find(p => p.id == req.params.id);
  const option = req.body.option;

  if (!poll || !poll.options[option]) {
    return res.status(400).json({ error: 'Invalid poll or option' });
  }

  if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
    return res.status(403).json({ error: 'Poll has expired' });
  }

  poll.options[option]++;
  savePolls(polls);
  res.json({ message: 'Vote recorded', poll });
});

// Update poll
router.put('/:id', (req, res) => {
  const polls = loadPolls();
  const index = polls.findIndex(p => p.id == req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Poll not found' });

  const { question, options, expiresAt } = req.body;
  polls[index].question = question;
  polls[index].options = options;
  polls[index].expiresAt = expiresAt || null;

  savePolls(polls);
  res.json({ message: 'Poll updated', poll: polls[index] });
});

// Delete poll
router.delete('/:id', (req, res) => {
  let polls = loadPolls();
  const originalLength = polls.length;
  polls = polls.filter(p => p.id != req.params.id);
  if (polls.length === originalLength) {
    return res.status(404).json({ error: 'Poll not found' });
  }
  savePolls(polls);
  res.json({ message: 'Poll deleted' });
});

module.exports = router;
