import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const kyPath = path.join(__dirname, 'locales', 'ky.json');

// CP1251 to Unicode mapping for 0x80-0xBF
const cp1251Map = {
  0x80: 1026, // Ђ
  0x81: 1027, // Ѓ
  0x82: 8218, // ‚
  0x83: 1107, // ѓ
  0x84: 8222, // „
  0x85: 8230, // …
  0x86: 8224, // †
  0x87: 8225, // ‡
  0x88: 8364, // €
  0x89: 8240, // ‰
  0x8A: 1033, // Љ
  0x8B: 8249, // ‹
  0x8C: 1036, // Њ
  0x8D: 1037, // Ќ
  0x8E: 1038, // Ћ
  0x8F: 1039, // Џ
  0x90: 1106, // ђ
  0x91: 8216, // ‘
  0x92: 8217, // ’
  0x93: 8220, // “
  0x94: 8221, // ”
  0x95: 8226, // •
  0x96: 8211, // –
  0x97: 8212, // —
  0x99: 8482, // ™
  0x9A: 1113, // љ
  0x9B: 8250, // ›
  0x9C: 1116, // њ
  0x9D: 1117, // ќ
  0x9E: 1118, // ћ
  0x9F: 1119, // џ
  0xA0: 160,  // NBSP
  0xA1: 1038, // Ў
  0xA2: 1118, // ў
  0xA3: 1032, // Ј
  0xA4: 164,  // ¤
  0xA5: 1168, // Ґ
  0xA6: 166,  // ¦
  0xA7: 167,  // §
  0xA8: 1025, // Ё
  0xA9: 169,  // ©
  0xAA: 1028, // Є
  0xAB: 171,  // «
  0xAC: 172,  // ¬
  0xAD: 173,  // SHY
  0xAE: 174,  // ®
  0xAF: 1031, // Ї
  0xB0: 176,  // °
  0xB1: 177,  // ±
  0xB2: 1030, // І
  0xB3: 1110, // і
  0xB4: 1169, // ґ
  0xB5: 181,  // µ
  0xB6: 182,  // ¶
  0xB7: 183,  // ·
  0xB8: 1105, // ё
  0xB9: 8470, // №
  0xBA: 1108, // є
  0xBB: 187,  // »
  0xBC: 1112, // ј
  0xBD: 1029, // Ѕ
  0xBE: 1109, // ѕ
  0xBF: 1111  // ї
};

// Create reverse map: Unicode charCode -> CP1251 byte
const unicodeToCp1251 = new Map();

// ASCII
for (let i = 0; i <= 127; i++) {
  unicodeToCp1251.set(i, i);
}
// Cyrillic А-Я, а-я
for (let i = 0xC0; i <= 0xFF; i++) {
  const unicodeCharCode = 0x0410 + (i - 0xC0);
  unicodeToCp1251.set(unicodeCharCode, i);
}
// Special 0x80-0xBF
for (const [byteVal, uniVal] of Object.entries(cp1251Map)) {
  unicodeToCp1251.set(uniVal, parseInt(byteVal, 10));
}

// Additional manual fixes for characters that might have been mapped differently or double encoded
unicodeToCp1251.set(1025, 0xA8); // Ё
unicodeToCp1251.set(1105, 0xB8); // ё
unicodeToCp1251.set(8211, 0x96); // – (En dash)
unicodeToCp1251.set(8212, 0x97); // — (Em dash)

function stringToCp1251Bytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (unicodeToCp1251.has(code)) {
      bytes.push(unicodeToCp1251.get(code));
    } else if (code >= 0 && code <= 255) {
      bytes.push(code); // Fallback to raw byte
    } else {
      // Unmapped character
      console.warn(`Unmapped char: ${str[i]} (code: ${code})`);
      bytes.push(63); // '?'
    }
  }
  return Buffer.from(bytes);
}

function decodeMojibake(str) {
  if (typeof str !== 'string') return str;
  
  // Signature of Mojibake: contains "Р" (U+0420) or "С" (U+0421) followed by Cyrillic or special chars
  // and does NOT look like clean Kyrgyz/Russian
  const hasMojibakePattern = /Р[–ТЇС©°ђѕј»]/.test(str) || /С[‡‹ѓ]/.test(str) || /У©/.test(str);
  
  if (!hasMojibakePattern) {
    return str;
  }
  
  try {
    const bytes = stringToCp1251Bytes(str);
    const decoded = bytes.toString('utf8');
    return decoded;
  } catch (e) {
    console.error(`Failed to decode "${str}":`, e.message);
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
        console.log(`Decoded: "${obj[key]}" -> "${decoded}"`);
      }
      result[key] = decoded;
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

const kyData = JSON.parse(fs.readFileSync(kyPath, 'utf8'));
console.log('--- Processing ky.json ---');
const processed = processObject(kyData);
console.log('--- Finished processing ---');
