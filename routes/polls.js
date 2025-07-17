const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const pollsFile = path.join(__dirname, '..', 'data', 'polls.json');

// Load existing polls
function loadPolls() {
  try {
    const data = fs.readFileSync(pollsFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save updated polls
function savePolls(polls) {
  fs.writeFileSync(pollsFile, JSON.stringify(polls, null, 2));
}

// Get all polls (optionally include expired)
router.get('/', (req, res) => {
  const polls = loadPolls();
  const showExpired = req.query.expired === 'true';
  const now = Date.now();

  const filtered = showExpired
    ? polls
    : polls.filter(p => !p.expiresAt || new Date(p.expiresAt).getTime() > now);

  res.json(filtered);
});

// Create a new poll
router.post('/', (req, res) => {
  const { question, options, expiresAt } = req.body;
  if (!question || !options || typeof options !== 'object') {
    return res.status(400).json({ error: 'Invalid poll data' });
  }

  const polls = loadPolls();
  const newPoll = {
    id: Date.now().toString(),
    question,
    options,
    expiresAt: expiresAt || null
  };

  polls.push(newPoll);
  savePolls(polls);
  res.status(201).json(newPoll);
});

// Vote
router.post('/:id/vote', (req, res) => {
  const { id } = req.params;
  const { option } = req.body;
  const polls = loadPolls();
  const poll = polls.find(p => p.id === id);

  if (!poll || !poll.options[option]) {
    return res.status(400).json({ error: 'Invalid poll or option' });
  }

  poll.options[option]++;
  savePolls(polls);
  res.json({ message: 'Vote counted', poll });
});

// Delete a poll
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  let polls = loadPolls();
  const initialLength = polls.length;
  polls = polls.filter(p => p.id !== id);

  if (polls.length === initialLength) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  savePolls(polls);
  res.json({ message: 'Poll deleted' });
});

module.exports = router;
