// dashboard_test_run.js - start dashboard_test_server in-process and fetch root
const http = require('http');
require('./dashboard_test_server.js');
setTimeout(()=>{
  http.get('http://localhost:5010/', res=>{
    let b=''; res.on('data', c=>b+=c); res.on('end', ()=>{ console.log('STATUS', res.statusCode); console.log(b.slice(0,400)); process.exit(0); });
  }).on('error', e=>{ console.error('REQUEST ERROR', e && e.message); process.exit(2); });
}, 300);
