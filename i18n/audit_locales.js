import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, 'locales');
const ruPath = path.join(localesDir, 'ru.json');
const enPath = path.join(localesDir, 'en.json');
const kyPath = path.join(localesDir, 'ky.json');

function flattenObject(obj, prefix = "") {
  let result = {};
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(result, flattenObject(obj[key], prefix + key + "."));
    } else {
      result[prefix + key] = obj[key];
    }
  }
  return result;
}

function findInterpolations(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{[^}]+\}/g) || [];
  return matches.map(m => m.trim().toLowerCase());
}

function auditFile(name, filePath) {
  console.log(`\n--- Auditing ${name} (${filePath}) ---`);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File does not exist!`);
    return null;
  }
  
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    console.log(`❌ Failed to read file: ${e.message}`);
    return null;
  }
  
  let parsed;
  try {
    parsed = JSON.parse(content);
    console.log(`✅ Valid JSON syntax.`);
  } catch (e) {
    console.log(`❌ JSON SYNTAX ERROR: ${e.message}`);
    // Find approximate location of error
    const posMatch = e.message.match(/at position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const start = Math.max(0, pos - 40);
      const end = Math.min(content.length, pos + 40);
      console.log(`Context around error: ... ${content.substring(start, pos)}[ERROR_HERE]${content.substring(pos, end)} ...`);
    }
    return null;
  }
  
  const flat = flattenObject(parsed);
  console.log(`🔑 Total flattened keys: ${Object.keys(flat).length}`);
  
  // Look for suspicious values
  const suspicious = [];
  const interpolations = {};
  
  for (const [key, val] of Object.entries(flat)) {
    if (typeof val !== 'string') {
      suspicious.push({ key, val, reason: `Value is not a string (type: ${typeof val})` });
      continue;
    }
    
    // Check for empty/whitespace-only values
    if (val.trim() === '') {
      suspicious.push({ key, val, reason: 'Value is empty or whitespace' });
    }
    
    // Check for API errors or failed translations
    if (val.includes('[object Object]') || val === 'undefined' || val === 'null') {
      suspicious.push({ key, val, reason: 'Value looks like JS serialization error' });
    }
    
    if (val.toLowerCase().includes('http error') || val.toLowerCase().includes('failed to translate') || val.toLowerCase().includes('translation error')) {
      suspicious.push({ key, val, reason: 'Value looks like translation API error message' });
    }
    
    // Key matches value (could be a placeholder)
    if (val === key) {
      suspicious.push({ key, val, reason: 'Value is identical to the full key' });
    }
    
    // Track interpolations
    interpolations[key] = findInterpolations(val);
  }
  
  return { flat, parsed, suspicious, interpolations };
}

async function main() {
  const ru = auditFile('ru.json', ruPath);
  const en = auditFile('en.json', enPath);
  const ky = auditFile('ky.json', kyPath);
  
  if (!ru || !en) {
    console.log('\n❌ Fatal: Could not parse ru.json or en.json. Cannot perform comparison.');
    return;
  }
  
  // Compare EN and RU
  console.log('\n--- Comparing ru.json and en.json ---');
  const ruKeys = Object.keys(ru.flat);
  const enKeys = Object.keys(en.flat);
  
  const missingInEn = ruKeys.filter(k => !enKeys.includes(k));
  const missingInRu = enKeys.filter(k => !ruKeys.includes(k));
  
  console.log(`Keys in ru.json but missing in en.json: ${missingInEn.length}`);
  if (missingInEn.length > 0) {
    console.log(`First 10 missing in en.json:`, missingInEn.slice(0, 10));
  }
  
  console.log(`Keys in en.json but missing in ru.json: ${missingInRu.length}`);
  if (missingInRu.length > 0) {
    console.log(`First 10 missing in ru.json:`, missingInRu.slice(0, 10));
  }
  
  // Check interpolation variables mismatch between RU and EN
  console.log('\n--- Checking translation variable mismatch (ru vs en) ---');
  let mismatchCount = 0;
  for (const key of ruKeys) {
    if (en.flat[key] !== undefined) {
      const ruVars = ru.interpolations[key] || [];
      const enVars = en.interpolations[key] || [];
      const ruVarsSet = new Set(ruVars);
      const enVarsSet = new Set(enVars);
      
      const missingEnVars = ruVars.filter(v => !enVarsSet.has(v));
      const extraEnVars = enVars.filter(v => !ruVarsSet.has(v));
      
      if (missingEnVars.length > 0 || extraEnVars.length > 0) {
        mismatchCount++;
        console.log(`⚠️ Variable mismatch for "${key}":`);
        console.log(`   RU: "${ru.flat[key]}" -> variables: [${ruVars.join(', ')}]`);
        console.log(`   EN: "${en.flat[key]}" -> variables: [${enVars.join(', ')}]`);
      }
    }
  }
  console.log(`Total interpolation mismatches between RU and EN: ${mismatchCount}`);
  
  if (ru.suspicious.length > 0) {
    console.log(`\n⚠️ Suspicious values in ru.json (${ru.suspicious.length}):`);
    ru.suspicious.forEach(item => console.log(`  - ${item.key}: "${item.val}" (${item.reason})`));
  }
  
  if (en.suspicious.length > 0) {
    console.log(`\n⚠️ Suspicious values in en.json (${en.suspicious.length}):`);
    en.suspicious.forEach(item => console.log(`  - ${item.key}: "${item.val}" (${item.reason})`));
  }
  
  if (ky) {
    const kyKeys = Object.keys(ky.flat);
    console.log('\n--- Comparing ru.json and ky.json ---');
    const missingInKy = ruKeys.filter(k => !kyKeys.includes(k));
    const extraInKy = kyKeys.filter(k => !ruKeys.includes(k));
    
    console.log(`Keys in ru.json but missing in ky.json: ${missingInKy.length}`);
    if (missingInKy.length > 0) {
      console.log(`First 20 missing in ky.json:`, missingInKy.slice(0, 20));
    }
    
    console.log(`Keys in ky.json but missing in ru.json: ${extraInKy.length}`);
    if (extraInKy.length > 0) {
      console.log(`First 20 missing in ru.json:`, extraInKy.slice(0, 20));
    }
    
    console.log('\n--- Checking translation variable mismatch (ru vs ky) ---');
    let kyMismatchCount = 0;
    for (const key of ruKeys) {
      if (ky.flat[key] !== undefined) {
        const ruVars = ru.interpolations[key] || [];
        const kyVars = ky.interpolations[key] || [];
        const ruVarsSet = new Set(ruVars);
        const kyVarsSet = new Set(kyVars);
        
        const missingKyVars = ruVars.filter(v => !kyVarsSet.has(v));
        const extraKyVars = kyVars.filter(v => !ruVarsSet.has(v));
        
        if (missingKyVars.length > 0 || extraKyVars.length > 0) {
          kyMismatchCount++;
          console.log(`⚠️ Variable mismatch for "${key}":`);
          console.log(`   RU: "${ru.flat[key]}" -> variables: [${ruVars.join(', ')}]`);
          console.log(`   KY: "${ky.flat[key]}" -> variables: [${kyVars.join(', ')}]`);
        }
      }
    }
    console.log(`Total interpolation mismatches between RU and KY: ${kyMismatchCount}`);
    
    if (ky.suspicious.length > 0) {
      console.log(`\n⚠️ Suspicious values in ky.json (${ky.suspicious.length}):`);
      ky.suspicious.forEach(item => console.log(`  - ${item.key}: "${item.val}" (${item.reason})`));
    }
  }
}

main();
