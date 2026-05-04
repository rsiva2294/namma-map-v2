import * as cheerio from 'cheerio';

interface Candidate {
  name: string;
  party: string;
  votes: number;
  status: 'Leading' | 'Won' | 'Trailing';
}

export const parseEciHtml = (html: string): Candidate[] => {
  const $ = cheerio.load(html);
  const candidates: Candidate[] = [];

  $('.cand-box').each((_, element) => {
    const el = $(element);
    
    // Extract Name
    const name = el.find('.nme-prty h5').text().trim();
    
    // Extract Party
    const party = el.find('.nme-prty h6').text().trim();
    
    // Extract Status & Votes from the nested divs
    const statusDivs = el.find('.status div');
    
    // First div contains the status text
    const rawStatus = statusDivs.first().text().trim().toLowerCase();
    
    let status: 'Leading' | 'Won' | 'Trailing' = 'Trailing';
    if (rawStatus.includes('leading')) {
      status = 'Leading';
    } else if (rawStatus.includes('won')) {
      status = 'Won';
    }

    // Second div contains the votes text and a span. We only want the direct text node.
    const votesDiv = statusDivs.last().clone();
    votesDiv.find('span').remove();
    const votesText = votesDiv.text().trim();
    
    const votes = parseInt(votesText.replace(/,/g, ''), 10) || 0;

    if (name) {
      candidates.push({
        name,
        party,
        votes,
        status
      });
    }
  });

  return candidates;
};

export interface StateSummary {
  party: string;
  won: number;
  leading: number;
  total: number;
}

export const parseStateSummaryHtml = (html: string): StateSummary[] => {
  const $ = cheerio.load(html);
  const results: StateSummary[] = [];
  
  $('table.table tbody tr').each((_, element) => {
    const el = $(element);
    const cols = el.find('td');
    
    if (cols.length >= 4) {
      const party = $(cols[0]).text().trim();
      
      // Skip the "Total" row at the bottom
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
  
  return results;
};
