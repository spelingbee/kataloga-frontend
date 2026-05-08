const fs = require('fs');
const path = require('path');

// Paths
const localesDir = path.join(__dirname, 'locales');
const ruPath = path.join(localesDir, 'ru.json');
const enPath = path.join(localesDir, 'en.json');

// Read source file
const ruData = JSON.parse(fs.readFileSync(ruPath, 'utf8'));

// Load existing English file to avoid translating already translated keys
let enData = {};
if (fs.existsSync(enPath)) {
  try {
    enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  } catch (e) {
    console.log('Could not parse existing en.json, starting fresh.');
  }
}

async function translate(text, sl = 'ru', tl = 'en') {
  if (!text || typeof text !== 'string') return text;
  
  // Skip if it looks like a variable or code (e.g. {count}, %s)
  if (text.startsWith('{') && text.endsWith('}')) return text;
  
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data[0][0][0];
  } catch (e) {
    console.error(`❌ Failed to translate: "${text}". Error:`, e.message);
    return text; // fallback to original
  }
}

async function translateObject(obj, existingObj = {}) {
  const result = {};
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      result[key] = await translateObject(obj[key], existingObj[key] || {});
    } else if (typeof obj[key] === 'string') {
      // If key already exists in English and is not empty, skip it
      if (existingObj[key] && existingObj[key] !== obj[key]) {
        result[key] = existingObj[key];
        continue;
      }
      
      console.log(`Translating: "${obj[key]}"`);
      result[key] = await translate(obj[key]);
      
      // Sleep to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

async function main() {
  console.log('🚀 Starting translation from ru.json to en.json...');
  const translated = await translateObject(ruData, enData);
  fs.writeFileSync(enPath, JSON.stringify(translated, null, 2), 'utf8');
  console.log('✅ Done! Saved to en.json');
}

main().catch(console.error);
