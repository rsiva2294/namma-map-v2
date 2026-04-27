const https = require('https');

function checkUrl(url) {
  https.get(url, (res) => {
    console.log(`\n--- ${url} ---`);
    console.log('Status:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Body snippet:', data.substring(0, 100).replace(/\n/g, ' '));
    });
  }).on('error', (e) => {
    console.error(`Error fetching ${url}:`, e);
  });
}

checkUrl('https://namma-map.web.app/sw.js');
checkUrl('https://namma-map.web.app/version.json');
checkUrl('https://namma-map.web.app/');
