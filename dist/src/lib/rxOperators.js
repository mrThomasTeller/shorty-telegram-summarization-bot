import { Observable, filter, mergeMap, pipe, map, range, takeWhile, concatMap, of, delay, repeat, timer, scan, } from 'rxjs';
export const filterAsync = (predicate) => pipe(mergeMap(async (arg) => ({ arg, result: await predicate(arg) })), filter(({ result }) => result), mergeMap(({ arg }) => [arg]));
export const rejectAsync = (predicate) => pipe(filterAsync((arg) => predicate(arg).then((result) => !result)));
export const repeat$ = (value, times) => range(times).pipe(map(() => value));
export const stopWhen = (predicate) => takeWhile((value, index) => !predicate(value, index), true);
export const insertDelayBetweenValues = (delayTime) => concatMap((value) => of(value).pipe(delay(delayTime)));
export const repeatWithDelay = (delay) => repeat({
    delay: () => timer(delay),
});
export const insertBefore = (insertion, predicate) => pipe(scan((acc, value) => !acc.inserted && predicate(value)
    ? { inserted: true, value: [insertion, value] }
    : { inserted: acc.inserted, value: [value] }, {
    inserted: false,
    value: undefined,
}), concatMap(({ value }) => value ?? []));
// export const endWithAfter = <T>(...values: T[], predicate: (value: T) => boolean): OperatorFunction<T, T> => {
// }
export const endWithAfter = (predicate, ...values) => (source) => {
    return new Observable((observer) => {
        const noValue = Symbol('noValue');
        let lastValue = noValue;
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
