const https = require('https');

https.get('https://namma-map.web.app/', (res) => {
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
}).on('error', (e) => {
  console.error(e);
});
