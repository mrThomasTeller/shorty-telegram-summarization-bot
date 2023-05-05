import assert from 'assert';

export function required<T>(x: T | undefined | null): T {
  assert(x);
  return x;
}
