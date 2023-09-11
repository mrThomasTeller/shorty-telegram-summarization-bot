import i18next from 'i18next';
import { dirname } from '@darkobits/fd-name';
import type RuTranslations from './ru.json';
import path from 'node:path';
import fs from 'node:fs';
import { required } from '../../lib/common.ts';

const ruTranslations = JSON.parse(
  fs.readFileSync(path.join(required(dirname()), './ru.json'), 'utf8')
) as typeof RuTranslations;

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
