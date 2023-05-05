import assert from 'assert';
export function required(x) {
    assert(x);
    return x;
}
