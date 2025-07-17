const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const pollsRoute = require('./routes/polls');
const authRoute = require('./routes/auth');
const candidatesRoute = require('./routes/candidates');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route middleware
app.use('/polls', pollsRoute);
app.use('/auth', authRoute);
app.use('/candidates', candidatesRoute);

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
