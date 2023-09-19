import { splitText, reEnumerateText } from '../text.ts'; // Замените на имя вашего файла

describe('splitText function', () => {
  it('should correctly split text into chunks of specified length', () => {
    const text = 'Hello, this is a test string for the splitText function.';
    const maxLength = 10;
    const expectedResult = [
      'Hello, thi',
      's is a tes',
      't string fo',
      'r the split',
      'Text functi',
      'on.',
    ];

    expect(splitText(text, maxLength)).toEqual(expectedResult);
  });

  it('should handle empty strings', () => {
    expect(splitText('', 10)).toEqual([]);
  });

  it('should handle maxLength greater than text length', () => {
    const text = 'Short text';
    const maxLength = 50;
    expect(splitText(text, maxLength)).toEqual([text]);
  });
});

describe('reEnumerateText function', () => {
  it('should correctly re-enumerate lines from a given number', () => {
    const text = '1. First line\n2. Second line\n3. Third line';
    const fromNumber = 10;
    const expectedResult = '10. First line\n11. Second line\n12. Third line';
    expect(reEnumerateText(text, fromNumber)).toEqual(expectedResult);
  });

  it('should handle lines without numbers', () => {
    const text = 'First line\nSecond line\nThird line';
    const fromNumber = 10;
    expect(reEnumerateText(text, fromNumber)).toEqual(text);
  });

  it('should handle empty string', () => {
    expect(reEnumerateText('', 10)).toEqual('');
  });
});
