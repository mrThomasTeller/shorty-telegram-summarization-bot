import { required } from './common.ts';

export function splitText(text: string, maxLength: number): string[] {
  const parts: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxLength;
    if (endIndex > text.length) {
      endIndex = text.length;
    } else {
      endIndex = text.lastIndexOf('\n', endIndex);
      if (endIndex === -1) {
        endIndex = text.indexOf('\n', startIndex + maxLength);
      }
    }

    parts.push(text.slice(startIndex, endIndex).trim());
    startIndex = endIndex;
  }

  return parts;
}

// replaces 1., 2., 3. in text with {fromNumber}., {fromNumber + 1}., {fromNumber + 2}.
export function reEnumerateText(text: string, fromNumber: number): string {
  // Split the text into lines
  const lines = text.split('\n');

  // Loop through each line and replace the numbers
  const updatedLines = lines.map((line) => {
    // Check if the line starts with a number followed by a period
    const match = line.match(/^(\d+)\./);
    if (match != null) {
      // Calculate the new number for this line
      const newNumber = Number.parseInt(required(match[1]), 10) - 1 + fromNumber;
      // Replace the original number with the new number
      return line.replace(match[0], `${newNumber}.`);
    }
    // If the line doesn't start with a number and a period, return it unchanged
    return line;
  });

  // Join the updated lines back together
  return updatedLines.join('\n');
}
