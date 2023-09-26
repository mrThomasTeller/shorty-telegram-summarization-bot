import assert from 'node:assert';

export function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as PromiseLike<T>).then === 'function'
  );
}

// eslint-disable-next-line no-restricted-syntax
export function logValue<T>(value: T): T {
  // eslint-disable-next-line no-console
  console.log(value);
  return value;
}

// eslint-disable-next-line no-restricted-syntax
export function logResult<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  _context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
): (this: This, ...args: Args) => Return {
  function replacementMethod(this: This, ...args: Args): Return {
    const result = target.call(this, ...args);

    if (isPromiseLike(result)) {
      void result.then((value) => {
        // eslint-disable-next-line no-console
        console.log(value);
      });
    } else {
      // eslint-disable-next-line no-console
      console.log(result);
    }

    return result;
  }

  return replacementMethod;
}

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
