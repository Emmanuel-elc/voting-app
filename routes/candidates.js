const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const dataPath = path.join(__dirname, '..', 'data', 'candidates.json');

// Helper to load candidates
function loadCandidates() {
  try {
    const data = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Helper to save candidates
function saveCandidates(candidates) {
  fs.writeFileSync(dataPath, JSON.stringify(candidates, null, 2));
}

// GET all candidates
router.get('/', (req, res) => {
  const candidates = loadCandidates();
  res.json(candidates);
});

// POST a new candidate
router.post('/', (req, res) => {
  const { name, photo } = req.body;
  if (!name || !photo) {
    return res.status(400).json({ error: 'Name and photo URL are required' });
  }

  const candidates = loadCandidates();
  const newCandidate = {
    id: Date.now().toString(),
    name,
    photo
  };
  candidates.push(newCandidate);
  saveCandidates(candidates);
  res.status(201).json(newCandidate);
});

// DELETE a candidate
router.delete('/:id', (req, res) => {
  const candidates = loadCandidates();
  const updated = candidates.filter(c => c.id !== req.params.id);
  if (updated.length === candidates.length) {
    return res.status(404).json({ error: 'Candidate not found' });
  }
  saveCandidates(updated);
  res.json({ message: 'Candidate deleted' });
});

module.exports = router;
