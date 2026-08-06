const fs = require('fs');
const path = require('path');

const tsFilePath = path.join(__dirname, 'artifacts/bcpl-mobile/data/pages.ts');
const websiteDir = path.join(__dirname, 'artifacts/bcpl-website/src/pages');

let tsContent = fs.readFileSync(tsFilePath, 'utf8');

function parseJSX(fileContent) {
  let blocks = [];
  
  // Try to find sections mapped arrays
  let matches = Array.from(fileContent.matchAll(/\{(?:n:\d+,|top:.*?)*\s*label:\s*['"]([^"']+)['"][^}]*items:\s*\[([\s\S]*?)\]\s*\}/g));
  if (matches.length > 0) {
    for (let m of matches) {
      blocks.push(`{ type: 'heading', text: ${JSON.stringify(m[1].replace(/<[^>]+>/g, ''))} }`);
      let itemsStr = m[2];
      let itemMatches = Array.from(itemsStr.matchAll(/['"]([^"']+)['"]/g));
      for (let im of itemMatches) {
        let text = im[1].replace(/<[^>]+>/g, '').replace(/&rsquo;/g, "'").replace(/&amp;/g, "&");
        if(text.includes('This document is separate')) text = "This document is separate from the BCPL Cricket Rulebook, which governs tournament matches. Trial rules govern trial day only.";
        blocks.push(`{ type: 'li', text: ${JSON.stringify(text)} }`);
      }
    }
    return blocks;
  }
  
  // Try parsing plain HTML blocks
  let htmlMatches = Array.from(fileContent.matchAll(/<(h2|p|li)[^>]*>([\s\S]+?)<\/\1>/gi));
  if (htmlMatches.length > 0) {
    for (let m of htmlMatches) {
       let tag = m[1].toLowerCase();
       let text = m[2].replace(/<[^>]+>/g, '').trim().replace(/&rsquo;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, ' ');
       if (!text || text.includes('{') || text.includes('This document applies to')) continue;
       if (text.includes('Questions or Permission Requests')) continue;
       if (tag === 'h2') blocks.push(`{ type: 'heading', text: ${JSON.stringify(text)} }`);
       if (tag === 'p') blocks.push(`{ type: 'p', text: ${JSON.stringify(text)} }`);
       if (tag === 'li') blocks.push(`{ type: 'li', text: ${JSON.stringify(text.replace(/^✓\s*/, ''))} }`);
    }
    return blocks;
  }
  
  return [];
}

const fixSlugs = ['trial-rules', 'cricket-rulebook', 'code-of-conduct', 'eligibility'];
const files = ['TrialRules.tsx', 'CricketRulebook.tsx', 'CodeOfConduct.tsx', 'EligibilityCriteria.tsx'];

for (let i = 0; i < fixSlugs.length; i++) {
  let slug = fixSlugs[i];
  let src = fs.readFileSync(path.join(websiteDir, files[i]), 'utf8');
  let blocks = parseJSX(src);
  
  if (blocks.length > 0) {
    let newContent = `    content: [\n      ${blocks.join(',\n      ')}\n    ]`;
    let regex = new RegExp(`'${slug}':\\s*\\{[^}]*title:\\s*"[^"]+",\\s*content:\\s*\\[([\\s\\S]*?)\\]\\s*\\}`, 'g');
    
    // Find the original
    tsContent = tsContent.replace(regex, (match) => {
      return match.replace(/content:\s*\[[\s\S]*?\]/, newContent);
    });
  }
}

fs.writeFileSync(tsFilePath, tsContent);
console.log('Fixed pages.ts');
