
import * as fs from 'fs';
import * as path from 'path';

// Read the file
const content = fs.readFileSync('/home/kira/Desktop/desarrolloia/.obsidian/plugins/finance-os-plugin2/src/utils/translations.ts', 'utf8');

// Extract the en and es objects
// refined regex to capture the object content
const enMatch = content.match(/en: \{([\s\S]*?)\n\s*\},/);
const esMatch = content.match(/es: \{([\s\S]*?)\n\s*\},?/);

if (!enMatch || !esMatch) {
    console.error("Could not find en or es objects");
    process.exit(1);
}

const parseKeys = (str: string) => {
    const keys = new Set<string>();
    const lines = str.split('\n');
    for (const line of lines) {
        const match = line.match(/^\s*'([\w.]+)':/);
        if (match) {
            keys.add(match[1]);
        }
    }
    return keys;
};

const enKeys = parseKeys(enMatch[1]);
const esKeys = parseKeys(esMatch[1]);

const missingInEs = [...enKeys].filter(k => !esKeys.has(k));
const missingInEn = [...esKeys].filter(k => !enKeys.has(k));

console.log("Missing in ES:", missingInEs);
console.log("Missing in EN:", missingInEn);
