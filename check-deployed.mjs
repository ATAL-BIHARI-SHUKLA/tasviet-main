import https from 'https';

// Fetch the deployed HTML
https.get('https://ta-td-sviet.vercel.app/', res => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    console.log('=== Deployed HTML ===');
    console.log(html);
    console.log('\n=== CSS links ===');
    const cssMatches = html.match(/\.css/g);
    console.log('CSS references:', cssMatches ? cssMatches.length : 0);
  });
});
