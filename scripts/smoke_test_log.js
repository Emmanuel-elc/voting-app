const fs = require('fs');
const http = require('http');
const LOG = 'data/smoke_log.txt';
function log(...args){ fs.appendFileSync(LOG, args.map(a=>typeof a==='string'?a:JSON.stringify(a)).join(' ') + '\n'); }
function readJSON(path){ return JSON.parse(fs.readFileSync(path,'utf8')); }
function request(options, body){
  // ensure we use IPv4 loopback to avoid localhost resolution issues
  options.hostname = options.hostname === 'localhost' ? '127.0.0.1' : options.hostname;
  return new Promise((resolve, reject)=>{
    const req = http.request(options, res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        let parsed = null; try{ parsed = JSON.parse(d); } catch(e){}
        resolve({ status: res.statusCode, body: parsed || d });
      });
    });
    req.on('error', e=> resolve({ error: (e && e.stack) ? e.stack : String(e) }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
(async ()=>{
  try{
    fs.writeFileSync(LOG, '--- SMOKE START ' + new Date().toISOString() + '\n');
    log('Reading admin token...');
    const tokens = readJSON('data/adminTokens.json');
    const token = Object.keys(tokens)[0];
    if (!token) { log('No admin token found'); return; }
    log('Using token', token.slice(0,10)+'...');

    let res = await request({ hostname:'localhost', port:10000, path:'/auth/check-admin', method:'GET', headers:{ Authorization: 'Bearer '+token } });
    log('/auth/check-admin', res);

    res = await request({ hostname:'localhost', port:10000, path:'/auth/voters', method:'GET', headers:{ Authorization: 'Bearer '+token } });
    log('/auth/voters', res);

    const pollPayload = { question: 'Test Poll ' + Date.now(), options: { 'Yes':0, 'No':0 } };
    res = await request({ hostname:'localhost', port:10000, path:'/polls', method:'POST', headers:{ 'Content-Type':'application/json' } }, pollPayload);
    log('/polls POST', res);
    const pollId = res.body && res.body.data && res.body.data.id ? res.body.data.id : null;

    const newVoter = { id: 'testv'+Date.now(), name:'Test Voter', password:'voterpass', adminToken: token };
    res = await request({ hostname:'localhost', port:10000, path:'/auth/register', method:'POST', headers:{ 'Content-Type':'application/json' } }, newVoter);
    log('/auth/register', res);

    res = await request({ hostname:'localhost', port:10000, path:'/auth/login', method:'POST', headers:{ 'Content-Type':'application/json' } }, { id: newVoter.id, password: newVoter.password });
    log('/auth/login', res);
    const voter = res.body && res.body.data ? res.body.data : null;

    if (pollId && voter) {
      res = await request({ hostname:'localhost', port:10000, path:`/polls/${pollId}/vote`, method:'POST', headers:{ 'Content-Type':'application/json' } }, { option: 'Yes', userId: voter.id });
      log('/polls/:id/vote', res);

      res = await request({ hostname:'localhost', port:10000, path:'/polls?expired=true', method:'GET' });
      log('/polls?expired=true', res);
    }

    log('SMOKE COMPLETE');
  }catch(e){ log('SMOKE ERROR', e.message || e); }
})();
