const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // We'll process line by line
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    // If the line has the Rupee symbol and has a className
    if (lines[i].includes('₹') && lines[i].includes('className="')) {
      // Don't add if already has font-bold
      if (!lines[i].includes('font-bold') && !lines[i].includes('font-black') && !lines[i].includes('font-extrabold')) {
        lines[i] = lines[i].replace('className="', 'className="font-bold ');
        changed = true;
      }
    } else if (lines[i].includes('₹') && !lines[i].includes('className="')) {
      // Look up to 3 lines above for a className
      let j = i;
      while(j >= Math.max(0, i - 3)) {
         if (lines[j].includes('className="') && !lines[j].includes('font-bold')) {
             lines[j] = lines[j].replace('className="', 'className="font-bold ');
             changed = true;
             break;
         }
         j--;
      }
    }
  }
  
  if (changed) {
    fs.writeFileSync(file, lines.join('\n'));
    console.log(`Updated ${file}`);
  }
});
