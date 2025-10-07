const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const pollsFile = path.join(__dirname, '..', 'data', 'polls.json');
const { validateToken } = require('../lib/adminSessions');

function toCSV(poll) {
  // If poll has candidates array, include candidate rows; otherwise include option rows
  const rows = [];
  if (poll.candidates && Array.isArray(poll.candidates)) {
    rows.push(['Candidate','Votes']);
    for (const c of poll.candidates) {
      const name = c.name;
      const votes = (poll.options && poll.options[name]) ? poll.options[name] : 0;
      rows.push([name, votes]);
    }
  } else {
    rows.push(['Option','Votes']);
    for (const [opt, v] of Object.entries(poll.options || {})) rows.push([opt, v]);
  }
  return rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
}

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

  res.json({ success: true, data: filtered });
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
  res.status(201).json({ success: true, data: newPoll });
});

// Vote
router.post('/:id/vote', (req, res) => {
  const { id } = req.params;
  const { option, userId } = req.body;
  const polls = loadPolls();
  const poll = polls.find(p => p.id === id);

  const log = (msg, ...args) => {
    if ((process.env.LOG_LEVEL || '').toLowerCase() === 'debug') console.log(msg, ...args);
  };

  log('vote handler -> id:', id, 'option:', option, 'userId:', userId);
  log('poll found:', poll ? Object.assign({}, poll, { options: Object.keys(poll.options) }) : null);

  if (!poll || !(option in poll.options)) {
    return res.status(400).json({ success: false, error: 'Invalid poll or option' });
  }

  // If userId provided, enforce one vote per user per poll
  if (userId) {
    try {
      const usersFile = path.join(__dirname, '..', 'data', 'users.json');
      const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      const user = users.find(u => u.id === userId);
      if (!user) return res.status(400).json({ success: false, error: 'Invalid user' });
      user.votedPolls = user.votedPolls || [];
      if (user.votedPolls.includes(id)) {
        return res.status(400).json({ success: false, error: 'User already voted for this poll' });
      }

      // Register the vote for the user
      user.votedPolls.push(id);
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    } catch (err) {
      console.error('Failed to update user vote record:', err);
      return res.status(500).json({ success: false, error: 'Failed to record vote' });
    }
  }

  // Safely increment numeric values (JSON may store numbers)
  poll.options[option] = (Number(poll.options[option]) || 0) + 1;
  savePolls(polls);
  res.json({ success: true, data: poll });
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

// Export poll results as CSV (admin only)
router.get('/:id/export', (req, res) => {
  const auth = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (!auth || !auth.startsWith('Bearer ')) return res.status(403).send('Admin token required');
  const token = auth.slice(7);
  const userId = validateToken(token);
  if (!userId) return res.status(403).send('Invalid admin token');

  const polls = loadPolls();
  const poll = polls.find(p => p.id === req.params.id);
  if (!poll) return res.status(404).send('Poll not found');

  const csv = toCSV(poll);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="results-${poll.id}.csv"`);
  res.send(csv);
});

module.exports = router;
