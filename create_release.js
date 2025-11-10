// create_release.js
// Creates a draft GitHub release for tag 'vcodex-1176' using GITHUB_TOKEN env var.
// Usage: node create_release.js
const https = require('https');
const fs = require('fs');
const path = require('path');

const owner = 'DonBishop913';
const repo = 'temple';
const tag = 'vcodex-1176';
const releaseFile = path.join(__dirname,'.github','releases','vcodex-1176.md');

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GHAPI_TOKEN;
if(!token){
  console.error('GITHUB_TOKEN not found in environment. Skipping remote release creation.');
  process.exit(2);
}
if(!fs.existsSync(releaseFile)){
  console.error('Release draft file not found at', releaseFile);
  process.exit(3);
}
const bodyText = fs.readFileSync(releaseFile,'utf8');

const payload = JSON.stringify({
  tag_name: tag,
  name: tag,
  body: bodyText,
  draft: true,
  prerelease: false
});

const options = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/releases`,
  method: 'POST',
  headers: {
    'User-Agent': 'TemplePC-Agent',
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `token ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', ()=>{
    if(res.statusCode>=200 && res.statusCode<300){
      console.log('Release draft created:', res.statusCode);
      try{ const j = JSON.parse(data); console.log('HTML URL:', j.html_url); }catch(e){}
    } else {
      console.error('Failed to create release:', res.statusCode, data);
      process.exit(4);
    }
  });
});
req.on('error', e=>{ console.error('Request error:', e.message); process.exit(5); });
req.write(payload);
req.end();
