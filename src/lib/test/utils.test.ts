import { AssertionError } from 'assert';
import { required } from '../utils';

describe('required function', () => {
  it('should return the same value when value is not null or undefined', () => {
    const testValue = 'test';
    const result = required(testValue);
    expect(result).toBe(testValue);
  });

  it('should throw an error when value is undefined', () => {
    const testValue = undefined;
    expect(() => {
      required(testValue);
    }).toThrow(AssertionError);
  });

  it('should throw an error when value is null', () => {
    const testValue = null;
    expect(() => {
      required(testValue);
    }).toThrow(AssertionError);
  });
});
