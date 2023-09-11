import { isPromiseLike } from './common.ts';

// eslint-disable-next-line no-restricted-syntax
export function logValue<T>(value: T, label?: string): T {
  if (label === undefined) {
    // eslint-disable-next-line no-console
    console.log(value);
  } else {
    // eslint-disable-next-line no-console
    console.log(label, value);
  }
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
