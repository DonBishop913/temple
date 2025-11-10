// codices_test_server.js
// Lightweight test harness for Codices endpoints (no agents, no auth)
const express = require('express');
const fs = require('fs');
const path = require('path');
let marked = null;
try { marked = require('marked'); } catch (e) { marked = null; }
const ROOT = process.env.TEMPLE_ROOT || String.raw`C:\Temple`;
const PORT = process.env.CODICES_TEST_PORT || 5005;
const app = express();
app.use(express.json());

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }
function renderMarkdown(md){
  if(marked && marked.parse) try{ return marked.parse(md); }catch(e){ console.error('marked parse failed', e.message); }
  const lines = (md||'').split(/\r?\n/);
  let out='', inList=false;
  for(const line of lines){
    if(/^###\s+/.test(line)){ if(inList){ out+='</ul>'; inList=false; } out+='<h3>'+escapeHtml(line.replace(/^###\s+/,''))+'</h3>'; }
    else if(/^##\s+/.test(line)){ if(inList){ out+='</ul>'; inList=false; } out+='<h2>'+escapeHtml(line.replace(/^##\s+/,''))+'</h2>'; }
    else if(/^#\s+/.test(line)){ if(inList){ out+='</ul>'; inList=false; } out+='<h1>'+escapeHtml(line.replace(/^#\s+/,''))+'</h1>'; }
    else if(/^-\s+/.test(line)){ if(!inList){ out+='<ul>'; inList=true; } out+='<li>'+escapeHtml(line.replace(/^-\s+/,''))+'</li>'; }
    else if(line.trim()===''){ if(inList){ out+='</ul>'; inList=false; } out+='<p></p>'; }
    else { if(inList){ out+='</ul>'; inList=false; } out+='<p>'+escapeHtml(line)+'</p>'; }
  }
  if(inList) out+='</ul>';
  return out;
}

app.get('/api/codices', (req,res)=>{
  try{
    const dir = path.join(ROOT,'Codices');
    if(!fs.existsSync(dir)) return res.json([]);
    const files = fs.readdirSync(dir).filter(f=>f.toLowerCase().endsWith('.md'));
    const out = files.map(f=>{
      const fp = path.join(dir,f);
      let title = f, meta={}, summary='';
      try{
        const content = fs.readFileSync(fp,'utf8');
        if(/^---\s*\r?\n/.test(content)){
          const end = content.indexOf('\n---',4);
          if(end>0){
            const fm = content.slice(4,end).split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
            for(const line of fm){ const kv=line.split(':'); if(kv.length>=2) meta[kv[0].trim().toLowerCase()]=kv.slice(1).join(':').trim(); }
          }
        }
        if(meta.title) title=meta.title; else { const m = content.match(/^[#]{1,6}\s*(.+)$/m); if(m) title=m[1].trim(); }
        const body = content.replace(/^---[\s\S]*?---\s*/,'').trim();
        const para = body.split(/\r?\n\r?\n/).find(p=>p.trim().length>0) || '';
        summary = para.length>240? para.slice(0,240).trim()+'…' : para.trim();
      }catch(e){}
      return {name:f,title,meta,summary,url:`/codices/${encodeURIComponent(f)}`} ;
    });
    res.json(out);
  }catch(e){ res.status(500).json([]); }
});

app.get('/api/codices/preview', (req,res)=>{
  try{
    const name = req.query.name; if(!name) return res.status(400).send('name required');
    const fp = path.join(ROOT,'Codices',name); if(!fs.existsSync(fp)) return res.status(404).send('not found');
    const content = fs.readFileSync(fp,'utf8');
    const body = content.replace(/^---[\s\S]*?---\s*/,'').trim();
    const para = body.split(/\r?\n\r?\n/).find(p=>p.trim().length>0) || '';
    const html = renderMarkdown(para);
    const title = (content.match(/^[#]{1,6}\s*(.+)$/m)||[])[1]||name;
    res.json({html,title});
  }catch(e){ res.status(500).send('preview error'); }
});

app.get('/codices/:name', (req,res)=>{
  try{
    const name = req.params.name; if(name.includes('..')||name.includes('/')) return res.status(400).send('invalid');
    const fp = path.join(ROOT,'Codices',name); if(!fs.existsSync(fp)) return res.status(404).send('not found');
    const md = fs.readFileSync(fp,'utf8');
    const html = renderMarkdown(md);
    res.send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(name)}</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:20px;max-width:900px;margin:auto}a{color:#0366d6}</style></head><body>${html}</body></html>`);
  }catch(e){ res.status(500).send('render error'); }
});

app.listen(PORT, ()=>{ console.log(`Codices test server running on http://localhost:${PORT}`); });

// Export app for testing (if required)
module.exports = app;
