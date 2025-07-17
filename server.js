const express = require('express');
const path = require('path');
const pollsRoute = require('./routes/polls');
const authRoute = require('./routes/auth'); // ✅ ADD THIS LINE
const registerRoute = require('./routes/register');
app.use('/register', registerRoute);


const app = express();

app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/polls', pollsRoute);
app.use('/auth', authRoute); // ✅ USE HERE

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Serve results.html manually if not already served
app.get('/results', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'results.html'));
});
const fs = require('fs');
const pollsPath = path.join(__dirname, 'data', 'polls.json');

app.get('/results-data', (req, res) => {
  const polls = JSON.parse(fs.readFileSync(pollsPath));
  res.json(polls);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
