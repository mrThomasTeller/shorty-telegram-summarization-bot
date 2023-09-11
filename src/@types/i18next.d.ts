import 'i18next';
import type translations from '../config/translations/ru.json';

declare module 'i18next' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface CustomTypeOptions {
    defaultNS: 'translations';
    resources: {
      translations: typeof translations;
    };
  }
}
