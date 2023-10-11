import { either } from 'fp-ts';

export const convertPromiseToEither =
  <L>() =>
  <R>(promise: Promise<R>): Promise<either.Either<L, R>> =>
    promise.then(
      (response) => either.right(response),
      (error) => either.left(error as L)
    );
