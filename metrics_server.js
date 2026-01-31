const http = require('http');

console.log('Starting metrics server on port 54211...');

const server = http.createServer((req, res) => {
  console.log(`REQUEST RECEIVED: ${req.method} ${req.url}`);

  if (req.url === '/metrics' && req.method === 'GET') {
    console.log('Serving /metrics endpoint');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ready',
      timestamp: new Date().toISOString(),
      message: 'Metrics API ready - TRIPLE AMEN'
    }));
  } else {
    console.log('Serving 404 for unknown endpoint');
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(54211, '0.0.0.0', () => {
  console.log('Server is listening on port 54211');
}).on('error', (err) => {
  console.error('Server error:', err);
}).on('listening', () => {
  console.log('Server successfully bound to port 54211');
  console.log('Ready for readiness checks!');
});