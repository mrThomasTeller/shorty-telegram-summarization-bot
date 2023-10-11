import {
  Observable,
  type UnaryFunction,
  filter,
  mergeMap,
  pipe,
  map,
  range,
  takeWhile,
  type MonoTypeOperatorFunction,
  concatMap,
  of,
  delay,
  type OperatorFunction,
  repeat,
  timer,
  scan,
} from 'rxjs';

export const filterAsync = <T>(
  predicate: (arg: T) => Promise<boolean>
): UnaryFunction<Observable<T>, Observable<T>> =>
  pipe(
    mergeMap(async (arg: T) => ({ arg, result: await predicate(arg) })),
    filter(({ result }) => result),
    mergeMap(({ arg }) => [arg])
  );

export const rejectAsync = <T>(
  predicate: (arg: T) => Promise<boolean>
): UnaryFunction<Observable<T>, Observable<T>> =>
  pipe(filterAsync((arg) => predicate(arg).then((result) => !result)));

export const repeat$ = <T>(value: T, times: number): Observable<T> =>
  range(times).pipe(map(() => value));

export const stopWhen = <T>(
  predicate: (value: T, index: number) => boolean
): MonoTypeOperatorFunction<T> => takeWhile<T>((value, index) => !predicate(value, index), true);

export const insertDelayBetweenValues = <T>(delayTime: number): OperatorFunction<T, T> =>
  concatMap((value: T) => of(value).pipe(delay(delayTime)));

export const repeatWithDelay = <T>(delay: number): MonoTypeOperatorFunction<T> =>
  repeat<T>({
    delay: () => timer(delay),
  });

export const insertBefore = <T>(
  insertion: T,
  predicate: (value: T) => boolean
): OperatorFunction<T, T> =>
  pipe(
    scan(
      (acc, value: T) =>
        !acc.inserted && predicate(value)
          ? { inserted: true, value: [insertion, value] }
          : { inserted: acc.inserted, value: [value] },
      {
        inserted: false,
        value: undefined as undefined | T[],
      }
    ),
    concatMap(({ value }) => value ?? [])
  );

// export const endWithAfter = <T>(...values: T[], predicate: (value: T) => boolean): OperatorFunction<T, T> => {

// }

export const endWithAfter =
  <T>(predicate: (value: T) => boolean, ...values: T[]): OperatorFunction<T, T> =>
  (source: Observable<T>): Observable<T> => {
    return new Observable<T>((observer) => {
      const noValue = Symbol('noValue');
      let lastValue: T | typeof noValue = noValue;

      return source.subscribe({
        next(value) {
          observer.next(value);
          lastValue = value;
        },
        error(err) {
          observer.error(err);
        },
        complete() {
          if (lastValue !== noValue && predicate(lastValue)) {
            for (const value of values) {
              observer.next(value);
            }
          }
          observer.complete();
        },
      });
    });
  };
