import { isPromiseLike } from './common.js';
// eslint-disable-next-line no-restricted-syntax
export function logValue(value, label) {
    if (label === undefined) {
        // eslint-disable-next-line no-console
        console.log(value);
    }
    else {
        // eslint-disable-next-line no-console
        console.log(label, value);
    }
    return value;
}
// eslint-disable-next-line no-restricted-syntax
export function logResult(target, _context) {
    function replacementMethod(...args) {
        const result = target.call(this, ...args);
        if (isPromiseLike(result)) {
            void result.then((value) => {
                // eslint-disable-next-line no-console
                console.log(value);
            });
        }
        else {
            // eslint-disable-next-line no-console
            console.log(result);
        }
        return result;
    }
    return replacementMethod;
}
