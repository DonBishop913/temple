const http = require('http');
http.get('http://localhost:5010/', res=>{
  let b=''; res.on('data', c=>b+=c); res.on('end', ()=>{ console.log('STATUS', res.statusCode); console.log(b.slice(0,400)); process.exit(0); });
}).on('error', e=>{ console.error('ERR', e && e.message); process.exit(2); });
