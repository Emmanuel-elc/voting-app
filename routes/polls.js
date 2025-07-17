const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '..', 'polls.json');

// Load polls from file
function loadPolls() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE);
  return JSON.parse(data);
}

// Save polls to file
function savePolls(polls) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(polls, null, 2));
}

// GET /polls?expired=true
router.get('/', (req, res) => {
  const polls = loadPolls();
  const now = Date.now();
  const showExpired = req.query.expired === 'true';

  const filtered = showExpired
    ? polls
    : polls.filter(p => !p.expiresAt || new Date(p.expiresAt).getTime() > now);

  res.json(filtered);
});

// GET /polls/:id
router.get('/:id', (req, res) => {
  const polls = loadPolls();
  const poll = polls.find(p => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  res.json(poll);
});

// POST /polls (create poll)
router.post('/', (req, res) => {
  const { question, options, expiresAt } = req.body;
  if (!question || !options || typeof options !== 'object') {
    return res.status(400).json({ error: 'Invalid poll data' });
  }

  const polls = loadPolls();
  const id = Date.now().toString();

  const pollOptions = {};
  for (const [opt, img] of Object.entries(options)) {
    pollOptions[opt] = { votes: 0, image: img };
  }

  const newPoll = {
    id,
    question,
    options: pollOptions,
    expiresAt: expiresAt || null
  };

  polls.push(newPoll);
  savePolls(polls);
  res.status(201).json({ message: 'Poll created', poll: newPoll });
});

// POST /polls/:id/vote
router.post('/:id/vote', (req, res) => {
  const { option } = req.body;
  const polls = loadPolls();
  const poll = polls.find(p => p.id === req.params.id);
  if (!poll || !poll.options[option]) {
    return res.status(400).json({ error: 'Invalid poll or option' });
  }

  poll.options[option].votes++;
  savePolls(polls);
  res.json({ message: 'Vote recorded', poll });
});

// DELETE /polls/:id
router.delete('/:id', (req, res) => {
  let polls = loadPolls();
  const index = polls.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Poll not found' });

  polls.splice(index, 1);
  savePolls(polls);
  res.json({ message: 'Poll deleted' });
});

module.exports = router;
