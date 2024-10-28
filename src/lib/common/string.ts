export const ucFirst = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

export const strCompare = (a: string, b: string): number => a.localeCompare(b, 'ru-RU');
