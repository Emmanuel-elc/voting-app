const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const [,, userId, newPass] = process.argv;
if (!userId || !newPass) {
  console.error('Usage: node scripts/set_user_password.js USER_ID NEW_PASSWORD');
  process.exit(1);
}

const usersPath = path.join(__dirname, '..', 'data', 'users.json');
let raw = fs.readFileSync(usersPath, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
let users = JSON.parse(raw);
const idx = users.findIndex(u => u.id === userId);
if (idx === -1) {
  console.error('User not found:', userId);
  process.exit(1);
}

const hash = bcrypt.hashSync(newPass, 10);
users[idx].password = hash;
fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
console.log(`Updated password for ${userId} in data/users.json`);
