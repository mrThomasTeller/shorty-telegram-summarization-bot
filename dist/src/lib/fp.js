import { either } from 'fp-ts';
export const convertPromiseToEither = () => (promise) => promise.then((response) => either.right(response), (error) => either.left(error));
