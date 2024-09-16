import { t } from './index.ts';

const console = {
  log: (str: string): void => {
    globalThis.console.log(str);
  },
};

console.log(t('recovery.debugInfo', { count: 1 }));
console.log(t('recovery.debugInfo', { count: 2 }));
console.log(t('recovery.debugInfo', { count: 10 }));

console.log(t('summarize.message.end.free', { free: 1, freeTotal: 1 }));
console.log(t('summarize.message.end.free', { free: 2, freeTotal: 2 }));
console.log(t('summarize.message.end.free', { free: 10, freeTotal: 10 }));

console.log(t('summarize.message.end.premiumWithFree', { free: 1, premium: 1 }));
console.log(t('summarize.message.end.premiumWithFree', { free: 2, premium: 2 }));
console.log(t('summarize.message.end.premiumWithFree', { free: 10, premium: 10 }));

console.log(t('summarize.errors.maxSummariesExceeded.free', { count: 1 }));
console.log(t('summarize.errors.maxSummariesExceeded.free', { count: 2 }));
console.log(t('summarize.errors.maxSummariesExceeded.free', { count: 10 }));

console.log(t('tariff.free', { count: 1 }));
console.log(t('tariff.free', { count: 2 }));
console.log(t('tariff.free', { count: 10 }));
