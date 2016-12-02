'use strict'

const request = require('superagent');
let cheerio = require('cheerio'); 

module.exports = {
    search: function (searchText, cb) {
        console.log(`Searching Wikipedia for: ${searchText}`);

        request.get(`http://en.wikipedia.org/w/api.php?action=parse&page=${searchText}&format=json&redirects`)
          .end((err, res) => {
              if (err) return cb(err);

              if (res.statusCode != 200) return cb('Expect status 200 but got ' + res.statusCode);
              if (res.body.error) return cb(res.body.error);

              return cb(null, findSummaryParagraph(res.body.parse.text["*"], searchText));
          });
    }
}

// Auxiliary function to find which paragraph of the result contains a summary text.
function findSummaryParagraph(rawResponse, searchText) {
  
  let $ = cheerio.load(rawResponse);
  let summary;
  let searchTextWords = searchText.replace(/[\W]+/g,' ').split(' ');
  
  // Go through all paragraphs
  $('p').each((idx, p) => {

    if (summary) return; // Already found it

    let pText = cheerio.load(p).text();

    if (pText.toLowerCase().indexOf(searchText.toLowerCase()) >= 0) {
      summary = pText;
    } else if (searchTextWords.length) {

      // For multi-word search terms (e.g., 'Barack Obama'), try to find
      // all words in the paragraph, regardless of order and position.
      // This marks a paragraph containing 'Barack Hussein Obama' as summary.
      let foundAll = true;
      searchTextWords.forEach((word) => {
        if (pText.toLowerCase().indexOf(word.toLowerCase()) === -1) foundAll = false;
      });

      if (foundAll) summary = pText;
    }

  });

  // Do some additional cleanup of Wikipedia empty references, e.g. [1], [2]
  if (summary) {
    summary = summary.replace(/\[[0-9]+\]/g, '');
  } 

  return summary ? summary : `Sorry, I could not find it on Wikipedia.`;
  
}