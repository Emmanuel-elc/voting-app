// routes/users.js
const express = require('express');
const router = express.Router();

// Dummy user route for testing
router.get('/', (req, res) => {
  res.json({ message: 'User route is working' });
});

module.exports = router;
