const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../pollsData.json');

// Load polls
function loadPolls() {
  if (!fs.existsSync(dataPath)) return [];
  const raw = fs.readFileSync(dataPath);
  return raw.length ? JSON.parse(raw) : [];
}

// Save polls
function savePolls(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// Get all polls
router.get('/', (req, res) => {
  const polls = loadPolls();
  const showExpired = req.query.expired === 'true';
  const now = Date.now();

  const filtered = showExpired
    ? polls
    : polls.filter(p => !p.expiresAt || new Date(p.expiresAt).getTime() > now);

  res.json(filtered);
});

// Create new poll
router.post('/', (req, res) => {
  const polls = loadPolls();
  const { question, options, expiresAt } = req.body;

  const newPoll = {
    id: Date.now(),
    question,
    options,
    expiresAt: expiresAt || null
  };

  polls.push(newPoll);
  savePolls(polls);
  res.status(201).json(newPoll);
});

// Get poll by ID
router.get('/:id', (req, res) => {
  const polls = loadPolls();
  const poll = polls.find(p => p.id == req.params.id);

  if (poll) res.json(poll);
  else res.status(404).json({ error: 'Poll not found' });
});

// Vote on a poll
router.post('/:id/vote', (req, res) => {
  const polls = loadPolls();
  const poll = polls.find(p => p.id == req.params.id);
  const option = req.body.option;
  const now = Date.now();

  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  if (poll.expiresAt && new Date(poll.expiresAt).getTime() <= now) {
    return res.status(400).json({ error: 'Poll has expired' });
  }

  if (!(option in poll.options)) {
    return res.status(400).json({ error: 'Invalid option' });
  }

  poll.options[option]++;
  savePolls(polls);
  res.json({ message: 'Vote recorded', poll });
});

// Update a poll (admin-only)
router.patch('/:id', (req, res) => {
  const polls = loadPolls();
  const poll = polls.find(p => p.id == req.params.id);

  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  if (req.body.question) poll.question = req.body.question;
  if (req.body.options) poll.options = req.body.options;

  savePolls(polls);
  res.json({ message: 'Poll updated', poll });
});

// Delete a poll (admin-only)
router.delete('/:id', (req, res) => {
  let polls = loadPolls();
  const index = polls.findIndex(p => p.id == req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  polls.splice(index, 1);
  savePolls(polls);
  res.json({ message: 'Poll deleted' });
});

module.exports = router;
