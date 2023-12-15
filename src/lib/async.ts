import logger from '../config/logger.js';

export function catchError(promise: Promise<unknown> | undefined): void {
  promise?.catch((error) => {
    logger.error(error);
  });
}
