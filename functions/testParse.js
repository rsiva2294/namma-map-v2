const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('../partywise.html', 'utf8');
const $ = cheerio.load(html);
const results = [];
$('table.table tbody tr').each((i, el) => {
  const cols = $(el).find('td');
  if (cols.length >= 4) {
    const party = $(cols[0]).text().trim();
    if (party !== 'Total') {
        results.push({
          party,
          won: parseInt($(cols[1]).text().trim()) || 0,
          leading: parseInt($(cols[2]).text().trim()) || 0,
          total: parseInt($(cols[3]).text().trim()) || 0
        });
    }
  }
});
console.log(JSON.stringify(results, null, 2));
