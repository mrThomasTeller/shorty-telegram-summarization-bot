import i18next, { type ParseKeys } from 'i18next';
import ruTranslations from './ru.ts';

void i18next.init({
  lng: 'ru',
  defaultNS: 'translations',
  resources: {
    ru: {
      translations: ruTranslations,
    },
  },
});

export const t = i18next.t.bind(i18next);

export type TranslationKey = ParseKeys<'translations', typeof ruTranslations>;
