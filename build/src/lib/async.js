export function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
export function catchError(promise) {
    promise.catch((error) => {
        console.error(error);
    });
}
