import assert from 'node:assert';

export function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as PromiseLike<T>).then === 'function'
  );
}

export function required<T>(x: T | undefined | null, message?: string): T {
  assert(x, message);
  return x;
}

export function oneOf<const T>(x: unknown, values: T[]): x is T {
  return (values as unknown[]).includes(x);
}

// eslint-disable-next-line unicorn/prefer-native-coercion-functions
export const isTruthy = <T>(value: T | null | undefined | '' | 0): value is T => Boolean(value);
