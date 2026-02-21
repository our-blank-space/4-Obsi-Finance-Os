import { TRANSLATIONS } from './translations';
import { Language } from '../types';

describe('Translation Integrity', () => {
    const languages: Language[] = ['es', 'en'];
    const keysEs = Object.keys(TRANSLATIONS.es).sort();
    const keysEn = Object.keys(TRANSLATIONS.en).sort();

    test('Both languages should have the same number of keys', () => {
        expect(keysEs.length).toBe(keysEn.length);
    });

    test('Both languages should have identical keys', () => {
        // Encontrar claves faltantes en español
        const missingInEs = keysEn.filter(key => !keysEs.includes(key));
        if (missingInEs.length > 0) {
            console.error('Missing in ES:', missingInEs);
        }

        // Encontrar claves faltantes en inglés
        const missingInEn = keysEs.filter(key => !keysEn.includes(key));
        if (missingInEn.length > 0) {
            console.error('Missing in EN:', missingInEn);
        }

        expect(missingInEs).toEqual([]);
        expect(missingInEn).toEqual([]);
    });

    test('No empty translations', () => {
        languages.forEach(lang => {
            Object.entries(TRANSLATIONS[lang]).forEach(([key, value]) => {
                if (!value) console.warn(`Empty translation for key: ${key} in ${lang}`);
                expect(value).toBeTruthy();
            });
        });
    });
});
