// models/Voter.js
const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
  voterId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true }, // Hashed for security
  hasVoted: { type: Boolean, default: false }
});

module.exports = mongoose.model('Voter', voterSchema);
