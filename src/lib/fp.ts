import { either } from 'fp-ts';

export const convertPromiseToEither =
  <L>() =>
  <R>(promise: Promise<R>): Promise<either.Either<L, R>> =>
    promise.then(
      (response) => either.right(response),
      (error) => either.left(error as L)
    );

export const matchEither = <L, R, T>(
  onLeft: (l: L) => T,
  onRight: (r: R) => T,
  eitherValue: either.Either<L, R>
): T => either.match(onLeft, onRight)(eitherValue);
