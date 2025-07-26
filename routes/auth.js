const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
const router = express.Router();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const dbName = 'voting-app'; // or whatever your database is named

async function getUserCollection() {
  await client.connect();
  return client.db(dbName).collection('users');
}

// Login Route
router.post('/login', async (req, res) => {
  const { idNumber, password } = req.body;

  try {
    const users = await getUserCollection();
    const user = await users.findOne({ idNumber });

    if (!user) return res.status(400).json({ error: 'Invalid ID or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid ID or password' });

    const token = jwt.sign({ id: user._id, name: user.name, role: user.role }, 'your_jwt_secret');
    res.json({ token, name: user.name, role: user.role });

  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register Route
router.post('/register', async (req, res) => {
  const { idNumber, name, password, role } = req.body;

  try {
    const users = await getUserCollection();
    const existing = await users.findOne({ idNumber });

    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await users.insertOne({ idNumber, name, password: hashed, role });

    res.json({ success: true, userId: result.insertedId });
  } catch (err) {
    console.error('Registration failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
