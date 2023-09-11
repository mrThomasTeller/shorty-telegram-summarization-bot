import assert from 'node:assert';

export function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as PromiseLike<T>).then === 'function'
  );
}

export function required<T>(x: T | undefined | null): T {
  assert(x);
  return x;
}
