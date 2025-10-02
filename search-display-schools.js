const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'apartments', '[id]', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Search for displaySchools in various patterns
const patterns = [
  /displaySchools/gi,
  /display[Ss]chool/g,
  /\bdisplay\s*Schools\b/gi
];

patterns.forEach(pattern => {
  const matches = content.match(pattern);
  if (matches) {
    console.log(`Found pattern ${pattern}:`, matches);
    
    // Get context around each match
    matches.forEach(match => {
      const index = content.indexOf(match);
      const start = Math.max(0, index - 100);
      const end = Math.min(content.length, index + 100);
      console.log('Context:', content.substring(start, end));
    });
  }
});

// Also search for school suffix patterns
const suffixPatterns = [
  /\(초\)/g,
  /\(중\)/g,
  /\(고\)/g,
  /\(대\)/g
];

suffixPatterns.forEach(pattern => {
  const matches = content.match(pattern);
  if (matches) {
    console.log(`Found suffix pattern ${pattern}:`, matches.length, 'times');
  }
});