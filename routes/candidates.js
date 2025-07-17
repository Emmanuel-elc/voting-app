const express = require('express');
const path = require('path');
const app = express();

// Route imports
const pollsRoute = require('./routes/polls');
const authRoute = require('./routes/auth');  // ✅ Add this line

app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Use route files
app.use('/polls', pollsRoute);
app.use('/auth', authRoute);  // ✅ Add this line

// Serve index.html at root "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const candidatesFile = path.join(__dirname, '../data/candidates.json');

// Load candidates
function loadCandidates() {
  if (!fs.existsSync(candidatesFile)) return [];
  return JSON.parse(fs.readFileSync(candidatesFile));
}

// GET /candidates
router.get('/', (req, res) => {
  const candidates = loadCandidates();
  res.json(candidates);
});

module.exports = router;
