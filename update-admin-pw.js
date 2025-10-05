const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const newPass = process.argv[2];
if (!newPass) {
  console.error('Usage: node update-admin-pw.js NEW_PASSWORD');
  process.exit(1);
}

const usersPath = path.join(__dirname, 'data', 'users.json');
let raw = fs.readFileSync(usersPath, 'utf8');
// strip UTF-8 BOM if present
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const users = JSON.parse(raw);
const idx = users.findIndex(u => u.id === 'superadmin');
if (idx === -1) {
  console.error('superadmin not found in users.json');
  process.exit(1);
}

const hash = bcrypt.hashSync(newPass, 10);
users[idx].password = hash;
fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
console.log('Updated superadmin password hash in data/users.json');