// server.js
const express = require('express');
const path = require('path');
const app = express();

const authRoute = require('./routes/auth');
const pollsRoute = require('./routes/polls');
const candidatesRoute = require('./routes/candidates');
const usersRoute = require('./routes/users');

try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not installed — continuing without loading .env');
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Simple request logger for debugging
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  if (req.method !== 'GET') console.log('   body:', JSON.stringify(req.body));
  next();
});

app.use('/auth', authRoute);
app.use('/polls', pollsRoute);
app.use('/candidates', candidatesRoute);
app.use('/users', usersRoute);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve register.html only for admin sessions (token via query or header)
app.get('/register.html', (req, res, next) => {
  try {
    const { validateToken } = require('./lib/adminSessions');
    // accept token from query, x-admin-token header, or Authorization: Bearer <token>
    let token = req.query.adminToken || req.headers['x-admin-token'];
    const auth = req.headers['authorization'] || req.headers['Authorization'];
    if (!token && auth && auth.startsWith('Bearer ')) token = auth.slice(7);
    const userId = validateToken(token);
    if (!userId) return res.status(403).send('Forbidden');
    return res.sendFile(path.join(__dirname, 'public', 'register.html'));
  } catch (e) {
    return res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
