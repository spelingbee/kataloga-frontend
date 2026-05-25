import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, 'locales');
const kyPath = path.join(localesDir, 'ky.json');

// Build CP1251 reverse mapping using TextDecoder
const cp1251Bytes = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
const decoder = new TextDecoder('windows-1251');
const cp1251Chars = decoder.decode(cp1251Bytes);
const charToByte = new Map();
for (let i = 0; i < 256; i++) {
  charToByte.set(cp1251Chars[i], i);
}

function decodeMojibake(str) {
  if (typeof str !== 'string') return str;
  
  const bytes = [];
  let hasSpecialChars = false;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (charToByte.has(char)) {
      const byteVal = charToByte.get(char);
      bytes.push(byteVal);
      if (byteVal >= 0x80) {
        hasSpecialChars = true;
      }
    } else {
      const code = char.charCodeAt(0);
      bytes.push(code);
      if (code >= 0x80) {
        hasSpecialChars = true;
      }
    }
  }
  
  if (!hasSpecialChars) {
    return str; // No non-ASCII characters, no need to decode
  }
  
  try {
    const buf = Buffer.from(bytes);
    const decoded = buf.toString('utf8');
    
    // Check if the decoded string contains replacement characters
    if (decoded.includes('\uFFFD')) {
      return str; // Invalid UTF-8 sequence, keep original (it was already correct Cyrillic)
    }
    
    return decoded;
  } catch (e) {
    return str;
  }
}

function processObject(obj) {
  const result = {};
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      result[key] = processObject(obj[key]);
    } else if (typeof obj[key] === 'string') {
      const decoded = decodeMojibake(obj[key]);
      if (decoded !== obj[key]) {
        console.log(`[FIXED] "${obj[key]}" -> "${decoded}"`);
      }
      result[key] = decoded;
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

if (!fs.existsSync(kyPath)) {
  console.error(`File not found: ${kyPath}`);
  process.exit(1);
}

const kyData = JSON.parse(fs.readFileSync(kyPath, 'utf8'));
console.log('--- Restoring ky.json from Mojibake ---');
const restoredData = processObject(kyData);

// Save back to ky.json
fs.writeFileSync(kyPath, JSON.stringify(restoredData, null, 2), 'utf8');
console.log('✅ ky.json has been restored and saved successfully.');
