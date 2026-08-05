const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /#1A2950/gi, to: '#241838' }, // Old Secondary -> Muted Violet
  { from: /#1F3260/gi, to: '#1E1530' }, // Old Muted -> Muted
  { from: /#1B2E52/gi, to: '#1E1530' },
  { from: /#24396B/gi, to: '#2C2244' }, // Old Border -> Border
  { from: /#0F192E/gi, to: '#161124' }, // Old deeper -> Card
  { from: /rgba\(4,10,24,/gi, to: 'rgba(11,8,19,' },
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const req of replacements) {
        if (content.match(req.from)) {
          content = content.replace(req.from, req.to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir('./app');
processDir('./components');
processDir('./hooks');
