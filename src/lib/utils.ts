import assert from 'assert';

export function required<T>(x: T | undefined | null): T {
  assert(x);
  return x;
}

export function yesterday(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
}

export function yesterdayBeforeYesterday(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 2);
  return date;
}
