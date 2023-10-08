import logger from '../config/logger.ts';

export function catchError(promise: Promise<unknown> | undefined): void {
  promise?.catch((error) => {
    logger.error(error);
  });
}
