const fs = require('fs');
const path = require('path');

const replacements = [
  // Hexes
  { from: /#FF6B00/gi, to: '#FF1A75' }, // Orange -> Pink
  { from: /#D95A00/gi, to: '#D10056' }, // Dark orange -> Dark pink
  { from: /#E8B23D/gi, to: '#00E5FF' }, // Gold -> Cyan
  { from: /#D49A25/gi, to: '#00B3CC' }, // Dark gold -> Dark cyan
  { from: /#070C1A/gi, to: '#0B0813' }, // Old Background -> Midnight
  { from: /#121F3D/gi, to: '#161124' }, // Old Card -> Dark Violet
  { from: /#050914/gi, to: '#06030A' }, // Old Header gradient start -> Darker violet
  { from: /#0A1128/gi, to: '#0B0813' }, // Old Header gradient mid -> Mid violet
  
  // RGBAs
  { from: /rgba\(255,\s*107,\s*0,/gi, to: 'rgba(255, 26, 117,' },
  { from: /rgba\(232,\s*178,\s*61,/gi, to: 'rgba(0, 229, 255,' },
  { from: /rgba\(7,\s*12,\s*26,/gi, to: 'rgba(11, 8, 19,' },
  { from: /rgba\(18,\s*31,\s*61,/gi, to: 'rgba(22, 17, 36,' },
  { from: /rgba\(22,\s*36,\s*69,/gi, to: 'rgba(22, 17, 36,' },
  { from: /rgba\(15,\s*25,\s*46,/gi, to: 'rgba(11, 8, 19,' },
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
