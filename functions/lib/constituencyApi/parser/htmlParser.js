"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEciHtml = void 0;
const cheerio = require("cheerio");
const parseEciHtml = (html) => {
    const $ = cheerio.load(html);
    const candidates = [];
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
        let status = 'Trailing';
        if (rawStatus.includes('leading')) {
            status = 'Leading';
        }
        else if (rawStatus.includes('won')) {
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
exports.parseEciHtml = parseEciHtml;
//# sourceMappingURL=htmlParser.js.map