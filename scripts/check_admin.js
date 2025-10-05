const fs = require('fs');
const http = require('http');
try {
  const raw = fs.readFileSync('data/adminTokens.json','utf8');
  const obj = JSON.parse(raw);
  const token = Object.keys(obj)[0];
  console.log('Using token:', token);
  const options = {
    hostname: 'localhost', port: 10000, path: '/auth/check-admin', method: 'GET', headers: { Authorization: 'Bearer ' + token }
  };
  const req = http.request(options, res => {
    console.log('status', res.statusCode);
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log('body', d));
  });
  req.on('error', e => console.error('req error', e));
  req.end();
} catch (e) {
  console.error('script error', e);
}
