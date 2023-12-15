import assert from 'node:assert';
export function isPromiseLike(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'then' in value &&
        typeof value.then === 'function');
}
export function required(x) {
    assert(x);
    return x;
}
