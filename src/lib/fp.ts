import * as Either from 'fp-ts/lib/Either.js';

export const convertPromiseToEither =
  <L>() =>
  <R>(promise: Promise<R>): Promise<Either.Either<L, R>> =>
    promise.then(
      (response) => Either.right(response),
      (error) => Either.left(error as L)
    );
