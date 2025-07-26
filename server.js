const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const authRoute = require('./routes/auth');
const registerRoute = require('./routes/register');
const pollsRoute = require('./routes/polls');
const candidatesRoute = require('./routes/candidates');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ MongoDB Atlas Connection
const MONGO_URI = "mongodb+srv://emmanuelmuganzielc:prettyemma@cluster0.aj80utx.mongodb.net/voting-app?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch((err) => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});

// ✅ Routes
app.use('/auth', authRoute);
app.use('/register', registerRoute);
app.use('/polls', pollsRoute);
app.use('/candidates', candidatesRoute);

// ✅ Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Fallback for unknown routes
app.use((req, res) => {
  res.status(404).send('404 - Not Found');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
