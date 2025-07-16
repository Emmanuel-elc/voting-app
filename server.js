const express = require('express');
const path = require('path');
const app = express();

const pollsRoute = require('./routes/polls');

app.use(express.json());

// ✅ Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// ✅ API route
app.use('/polls', pollsRoute);

// ✅ Serve index.html at root "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const fs = require('fs');
const usersPath = path.join(__dirname, 'users.json');

// User login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersPath));
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ username: user.username, role: user.role });
});
// User registration
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersPath));

  const existing = users.find(u => u.username === username);
  if (existing) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const newUser = { username, password, role: 'user' };
  users.push(newUser);
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  res.json({ username, role: 'user' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
