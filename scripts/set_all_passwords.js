const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const newPass = process.argv[2];
if (!newPass) {
  console.error('Usage: node scripts/set_all_passwords.js NEW_PASSWORD');
  process.exit(1);
}

const usersPath = path.join(__dirname, '..', 'data', 'users.json');
let raw = fs.readFileSync(usersPath, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
let users = JSON.parse(raw);
if (!Array.isArray(users)) {
  console.error('Unexpected users.json format (expected array)');
  process.exit(1);
}

const hash = bcrypt.hashSync(newPass, 10);
users = users.map(u => ({ ...u, password: hash }));
fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
console.log(`Updated ${users.length} users' password hashes in data/users.json`);
