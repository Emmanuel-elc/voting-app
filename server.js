// Imports (top of file)
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const authRoute = require('./routes/auth');
const registerRoute = require('./routes/register');
const pollsRoute = require('./routes/polls');
const candidatesRoute = require('./routes/candidates');

// ✅ Initialize app AFTER imports
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/auth', authRoute);
app.use('/register', registerRoute);
app.use('/polls', pollsRoute);
app.use('/candidates', candidatesRoute);

// Serve index.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 10000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/voting-app')
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
  });
