// server.js
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

const authRoute = require('./routes/auth');
const pollsRoute = require('./routes/polls');
const candidatesRoute = require('./routes/candidates');
const usersRoute = require('./routes/users'); // ✅ added users route

require('dotenv').config();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', authRoute);
app.use('/polls', pollsRoute);
app.use('/candidates', candidatesRoute);
app.use('/users', usersRoute); // ✅ use the users route

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    const PORT = process.env.PORT || 10000;
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err);
  });
