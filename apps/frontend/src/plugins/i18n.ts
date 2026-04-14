import { createI18n } from 'vue-i18n';

const lang = document.documentElement.lang || 'en';

const i18n = createI18n({
  legacy: false,
  locale: lang,
  fallbackLocale: 'en',
  messages: {},
  missingWarn: false,
  fallbackWarn: false,
});

export async function loadTranslations(): Promise<void> {
  try {
    const response = await fetch(`/i18n/${lang}.json`);
    const messages = await response.json();
    i18n.global.setLocaleMessage(lang, messages);
  } catch (e) {
    console.warn(`Failed to load translations for ${lang}`, e);
  }
}

export function stringFormat(template: string, ...args: any[]): string {
  return template.replace(/\{(\d+)\}/g, (match, index) => {
    return args[index] !== undefined ? String(args[index]) : match;
  });
}

export default i18n;
