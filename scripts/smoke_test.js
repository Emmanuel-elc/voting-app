const fs = require('fs');
const http = require('http');

function readJSON(path){ return JSON.parse(fs.readFileSync(path,'utf8')); }
function request(options, body){
  return new Promise((resolve, reject)=>{
    const req = http.request(options, res=>{
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>{
        let parsed = null; try{ parsed = JSON.parse(d); } catch(e){}
        resolve({ status: res.statusCode, body: parsed || d });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async ()=>{
  try{
    console.log('Reading admin token...');
    const tokens = readJSON('data/adminTokens.json');
    const token = Object.keys(tokens)[0];
    if (!token) throw new Error('No admin token found');
    console.log('Using token', token.slice(0,10)+'...');

    // check-admin
    let res = await request({ hostname:'localhost', port:10000, path:'/auth/check-admin', method:'GET', headers:{ Authorization: 'Bearer '+token } });
    console.log('/auth/check-admin', res.status, res.body);

    // list voters
    res = await request({ hostname:'localhost', port:10000, path:'/auth/voters', method:'GET', headers:{ Authorization: 'Bearer '+token } });
    console.log('/auth/voters', res.status, Array.isArray(res.body) ? res.body.length + ' voters' : res.body);

    // create poll
    const pollPayload = { question: 'Test Poll ' + Date.now(), options: { 'Yes':0, 'No':0 } };
    res = await request({ hostname:'localhost', port:10000, path:'/polls', method:'POST', headers:{ 'Content-Type':'application/json' } }, pollPayload);
    console.log('/polls POST', res.status, res.body && res.body.data && res.body.data.id ? 'created '+res.body.data.id : res.body);
    const pollId = res.body?.data?.id;

    // register a voter using adminToken
    const newVoter = { id: 'testv'+Date.now(), name:'Test Voter', password:'voterpass', adminToken: token };
    res = await request({ hostname:'localhost', port:10000, path:'/auth/register', method:'POST', headers:{ 'Content-Type':'application/json' } }, newVoter);
    console.log('/auth/register', res.status, res.body);

    // login as the new voter
    res = await request({ hostname:'localhost', port:10000, path:'/auth/login', method:'POST', headers:{ 'Content-Type':'application/json' } }, { id: newVoter.id, password: newVoter.password });
    console.log('/auth/login', res.status, res.body && res.body.success ? 'ok' : res.body);
    const voter = res.body?.data;

    // cast a vote
    if (pollId && voter) {
      res = await request({ hostname:'localhost', port:10000, path:`/polls/${pollId}/vote`, method:'POST', headers:{ 'Content-Type':'application/json' } }, { option: 'Yes', userId: voter.id });
      console.log('/polls/:id/vote', res.status, res.body && res.body.success ? 'vote recorded' : res.body);

      // fetch polls and show counts
      res = await request({ hostname:'localhost', port:10000, path:'/polls?expired=true', method:'GET' });
      const poll = Array.isArray(res.body) ? res.body.find(p=>p.id===pollId) : res.body?.data?.find?.(p=>p.id===pollId);
      console.log('poll result', poll ? poll.options : res.body);
    }

    console.log('SMOKE TEST COMPLETE');
  }catch(e){
    console.error('SMOKE ERROR', e);
  }
})();
