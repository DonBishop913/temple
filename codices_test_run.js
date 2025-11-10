// codices_test_run.js - start the codices test server in-process and fetch /api/codices
const http = require('http');
const serverModule = require('./codices_test_server.js');
// Wait briefly to let server bind
setTimeout(()=>{
  http.get('http://localhost:5005/api/codices', res=>{
    let b=''; res.on('data', c=>b+=c); res.on('end', ()=>{
      console.log('STATUS', res.statusCode);
      console.log(b);
      process.exit(0);
    });
  }).on('error', e=>{ console.error('REQUEST ERROR', e && e.message); process.exit(2); });
}, 300);
