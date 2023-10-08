import { setTimeout } from 'node:timers/promises';
import { catchError } from '../async.ts';
import logger from '../../config/logger.ts';

// Mock logger.error to test catchError
jest.spyOn(logger, 'error').mockImplementation(() => logger);

describe('catchError', () => {
  test('should catch a rejected promise and log the error', async () => {
    const errorMessage = 'Test error';
    const errorPromise = Promise.reject(new Error(errorMessage));

    catchError(errorPromise);
    await setTimeout(0); // Wait for the next event loop iteration to give catchError a chance to handle the error

    expect(logger.error).toHaveBeenCalledWith(new Error(errorMessage));
  });

  test('should not interfere with a resolved promise', async () => {
    const successMessage = 'Promise resolved';
    const successPromise = Promise.resolve(successMessage);

    catchError(successPromise);
    await setTimeout(0); // Wait for the next event loop iteration to give catchError a chance to handle the error

    expect(logger.error).not.toHaveBeenCalled();
  });
});
