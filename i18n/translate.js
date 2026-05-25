import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const localesDir = path.join(__dirname, 'locales');
const ruPath = path.join(localesDir, 'ru.json');
const enPath = path.join(localesDir, 'en.json');
const kyPath = path.join(localesDir, 'ky.json');
const appDir = path.dirname(__dirname); // frontend root

// Known defaults for keys that might be missing in ru.json
const KNOWN_DEFAULTS = {
  "cart.close": "Закрыть",
  "checkout.deliveryDetails": "Детали доставки",
  "checkout.processing": "Обработка...",
  "menu.filters.apply": "Применить",
  "menu.filters.availableOnly": "Только в наличии",
  "menu.filters.clear": "Очистить",
  "menu.filters.dairy-free": "Без лактозы",
  "menu.filters.gluten-free": "Без глютена",
  "menu.filters.vegan": "Веганское",
  "menu.filters.vegetarian": "Вегетарианское",
  "menu.units.kcal": "ккал",
  "order.emptyDesc": "У вас пока нет заказов",
  "order.noOrders": "Нет заказов",
  "order.startOrdering": "Начать заказ",
  "pagination.itemsPerPage": "Показывать по",
  "pagination.navigation": "Навигация",
  "pagination.next": "Вперед",
  "pagination.previous": "Назад",
  "profile.emailPlaceholder": "email@example.com",
  "profile.phonePlaceholder": "+7 (999) 123-45-67",
  "tenant.failedToLoad": "Не удалось загрузить данные",
  "tenant.loading": "Загрузка...",
  "tenant.noFound": "Ничего не найдено",
  "tenant.noneAvailable": "Нет доступных вариантов",
  "tenant.search": "Поиск...",
  "tenant.tryAdjusting": "Попробуйте изменить параметры поиска"
};

// Flatten nested object
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

// Unflatten flat object
function unflattenObject(flatObj) {
  const result = {};
  for (const key in flatObj) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = flatObj[key];
      } else {
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }
  return result;
}

// Scan codebase for t() keys
function scanCodebase(dir, foundKeys = new Set()) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!['node_modules', '.nuxt', '.output', '.git', 'dist'].includes(file)) {
        scanCodebase(filePath, foundKeys);
      }
    } else if (file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.js')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const regex = /[^a-zA-Z0-9]t\([\'"]([a-zA-Z0-9._-]+)[\'"]\)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          foundKeys.add(match[1]);
        }
      } catch (e) {
        console.error(`Error reading ${filePath}:`, e.message);
      }
    }
  }
  return foundKeys;
}

// Google Translate single text API
async function translate(text, sl = 'ru', tl = 'en') {
  if (!text || typeof text !== 'string') return text;
  
  // Skip variable interpolation blocks e.g. {count}
  if (text.startsWith('{') && text.endsWith('}')) return text;
  
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data[0][0][0];
  } catch (e) {
    console.error(`❌ Failed to translate to ${tl}: "${text}". Error:`, e.message);
    return text;
  }
}

function resolveConflicts(flatObj) {
  const keys = Object.keys(flatObj).sort();
  const cleaned = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const hasChildren = (i + 1 < keys.length) && keys[i + 1].startsWith(key + ".");
    if (!hasChildren) {
      cleaned[key] = flatObj[key];
    } else {
      console.log(`⚠️ Removing conflicting parent key "${key}" (value: "${flatObj[key]}") because it has subkeys.`);
    }
  }
  return cleaned;
}

async function main() {
  console.log('🔍 Scanning locales and codebase...');
  
  const ruData = fs.existsSync(ruPath) ? JSON.parse(fs.readFileSync(ruPath, 'utf8')) : {};
  const enData = fs.existsSync(enPath) ? JSON.parse(fs.readFileSync(enPath, 'utf8')) : {};
  const kyData = fs.existsSync(kyPath) ? JSON.parse(fs.readFileSync(kyPath, 'utf8')) : {};
  
  const ruFlat = resolveConflicts(flattenObject(ruData));
  const enFlat = resolveConflicts(flattenObject(enData));
  const kyFlat = resolveConflicts(flattenObject(kyData));
  
  // Scan codebase for keys
  const codeKeys = scanCodebase(appDir);
  console.log(`Found ${codeKeys.size} translation keys in codebase.`);
  
  // Create master set of keys, resolving any type conflicts
  const combinedKeys = Array.from(new Set([
    ...Object.keys(ruFlat),
    ...Object.keys(enFlat),
    ...Object.keys(kyFlat),
    ...codeKeys
  ])).sort();

  const masterKeysFiltered = [];
  for (let i = 0; i < combinedKeys.length; i++) {
    const key = combinedKeys[i];
    const hasChildren = (i + 1 < combinedKeys.length) && combinedKeys[i + 1].startsWith(key + ".");
    if (!hasChildren) {
      masterKeysFiltered.push(key);
    } else {
      console.log(`⚠️ Excluding conflicting parent key "${key}" from master list.`);
    }
  }
  const masterKeys = new Set(masterKeysFiltered);
  console.log(`Master translation map contains ${masterKeys.size} total keys (after conflict resolution).`);
  
  // Step 1: Normalize Russian (our source of truth)
  console.log('\nStep 1: Normalizing Russian locale...');
  for (const key of masterKeys) {
    if (!ruFlat[key]) {
      // 1. Check known defaults
      if (KNOWN_DEFAULTS[key]) {
        ruFlat[key] = KNOWN_DEFAULTS[key];
        console.log(`  + [ru] Added known default for "${key}": "${ruFlat[key]}"`);
      } 
      // 2. Check English version to translate back to Russian
      else if (enFlat[key] && enFlat[key].trim() !== '') {
        console.log(`  + [ru] Translating back from English key "${key}": "${enFlat[key]}"`);
        ruFlat[key] = await translate(enFlat[key], 'en', 'ru');
        await new Promise(r => setTimeout(r, 200));
      }
      // 3. Fallback placeholder
      else {
        ruFlat[key] = key.split('.').pop(); // use key tail
        console.log(`  + [ru] Added placeholder for key "${key}": "${ruFlat[key]}"`);
      }
    }
  }
  
  // Save normalised RU data
  const normalizedRu = unflattenObject(ruFlat);
  fs.writeFileSync(ruPath, JSON.stringify(normalizedRu, null, 2), 'utf8');
  console.log('✅ Russian translation source of truth normalized.');
  
  // Step 2: Translate English and Kyrgyz
  const translateLang = async (flatData, langCode, filePath) => {
    console.log(`\nTranslating and syncing keys to ${langCode}...`);
    let translatedCount = 0;
    
    for (const key of masterKeys) {
      const srcText = ruFlat[key];
      const targetText = flatData[key];
      
      // If it doesn't exist, or is empty, or is equal to the raw key, translate it
      if (!targetText || targetText.trim() === '' || targetText === key) {
        console.log(`  [${langCode}] Translating "${srcText}"`);
        flatData[key] = await translate(srcText, 'ru', langCode);
        translatedCount++;
        await new Promise(r => setTimeout(r, 300));
      }
    }
    
    // Save output
    const nestedData = unflattenObject(flatData);
    fs.writeFileSync(filePath, JSON.stringify(nestedData, null, 2), 'utf8');
    console.log(`✅ Saved ${langCode}.json. Translated ${translatedCount} new keys.`);
  };
  
  await translateLang(enFlat, 'en', enPath);
  await translateLang(kyFlat, 'ky', kyPath);
  
  console.log('\n🎉 Translation and synchronization complete!');
}

main().catch(console.error);
