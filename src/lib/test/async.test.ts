import { wait, catchError } from '../async.ts';

// Mock console.error to test catchError
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('wait', () => {
  test('should resolve after the specified time', async () => {
    const startTime = Date.now();
    const waitTime = 1000;
    await wait(waitTime);
    const endTime = Date.now();
    expect(endTime - startTime).toBeGreaterThanOrEqual(waitTime);
  });

  test('should not resolve before the specified time', async () => {
    const startTime = Date.now();
    const waitTime = 1000;
    await wait(waitTime);
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(waitTime + 50);
  });
});

describe('catchError', () => {
  test('should catch a rejected promise and log the error', async () => {
    const errorMessage = 'Test error';
    const errorPromise = Promise.reject(new Error(errorMessage));

    catchError(errorPromise);
    await wait(0); // Wait for the next event loop iteration to give catchError a chance to handle the error

    expect(console.error).toHaveBeenCalledWith(new Error(errorMessage));
  });

  test('should not interfere with a resolved promise', async () => {
    const successMessage = 'Promise resolved';
    const successPromise = Promise.resolve(successMessage);

    catchError(successPromise);
    await wait(0); // Wait for the next event loop iteration to give catchError a chance to handle the error

    expect(console.error).not.toHaveBeenCalled();
  });
});
