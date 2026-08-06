const fs = require('fs');

const file = 'artifacts/bcpl-mobile/app/pages/[slug].tsx';
let content = fs.readFileSync(file, 'utf8');

// replace the stats text to allow better fitting
content = content.replace(
  /fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20/g,
  "fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18"
);

fs.writeFileSync(file, content);
