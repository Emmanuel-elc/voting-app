// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();

const pollsRoute = require('./routes/polls');
const authRoute = require('./routes/auth');
const candidatesRoute = require('./routes/candidates');
const usersRoute = require('./routes/users');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session config
app.use(
  session({
    secret: 'voting-secret',
    resave: false,
    saveUninitialized: true,
  })
);

// Routes
app.use('/polls', pollsRoute);
app.use('/auth', authRoute);
app.use('/candidates', candidatesRoute);
app.use('/users', usersRoute);

// Welcome page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin-only results page
app.get('/admin/results', (req, res) => {
  if (req.session.isAdmin) {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
  } else {
    res.status(403).send('Access denied');
  }
});

// Session check for admin
app.get('/auth/check-admin', (req, res) => {
  if (req.session.isAdmin) res.sendStatus(200);
  else res.sendStatus(403);
});

// Admin login
app.post('/auth/admin-login', (req, res) => {
  const { password } = req.body;
  if (password === 'admin123') {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
