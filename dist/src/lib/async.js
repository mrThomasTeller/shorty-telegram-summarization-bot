import logger from '../config/logger.js';
export function catchError(promise) {
    promise?.catch((error) => {
        logger.error(error);
    });
}
