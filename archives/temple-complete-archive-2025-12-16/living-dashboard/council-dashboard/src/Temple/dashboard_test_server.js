// dashboard_test_server.js
// Lightweight dashboard that points to the isolated Codices test server (no agents, no auth)
const express = require('express');
const app = express();
const PORT = process.env.DASH_TEST_PORT || 5010;

app.get('/', (req,res)=>{
  res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Dashboard Test</title><style>body{font-family:Arial;padding:20px} .codex-card{border:1px solid #ddd;padding:12px;margin:8px;border-radius:6px}</style></head><body>
  <h1>Dashboard Test — Codices</h1>
  <div id="codicesList">Loading…</div>
  <div id="modal" style="display:none;position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.5);align-items:center;justify-content:center"><div style="background:#fff;padding:16px;margin:4%;max-height:80%;overflow:auto"><button onclick="hide()">Close</button><div id="preview"></div></div></div>
  <script>
    async function fetchCodices(){
      const res = await fetch('http://localhost:5005/api/codices');
      const list = await res.json();
      const el = document.getElementById('codicesList'); el.innerHTML='';
      list.forEach(c=>{
        const d = document.createElement('div'); d.className='codex-card';
        d.innerHTML = '<div style="font-weight:700">'+(c.title||c.name)+'</div><div style="font-size:12px;color:#666">'+(c.meta.author||'')+' • '+(c.meta.date||'')+'</div><div>'+ (c.summary||'') +'</div>';
        const p = document.createElement('button'); p.textContent='Preview'; p.onclick = async ()=>{ const pr = await fetch('http://localhost:5005/api/codices/preview?name='+encodeURIComponent(c.name)); const j = await pr.json(); document.getElementById('preview').innerHTML = '<h2>'+j.title+'</h2>'+j.html; document.getElementById('modal').style.display='flex'; };
        const o = document.createElement('button'); o.textContent='Open'; o.onclick = ()=>{ window.open('http://localhost:5005'+c.url, '_blank'); };
        d.appendChild(p); d.appendChild(o);
        el.appendChild(d);
      });
    }
    function hide(){ document.getElementById('modal').style.display='none'; }
    fetchCodices();
  </script>
</body></html>`);
});

app.listen(PORT, ()=>{ console.log(`Dashboard test server running on http://localhost:${PORT}`); });
module.exports = app;
