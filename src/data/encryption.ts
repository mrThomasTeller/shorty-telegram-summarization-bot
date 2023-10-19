import crypto from 'node:crypto';
import { getEnv } from '../config/envVars.ts';

/**
 * @example
 * const text =
 *   'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In. lorem lectus, ullamcorper non magna non, vulputate malesuada';
 * console.log(text);
 * const encrypted = encrypt(text);
 * console.log(encrypted);
 * console.log(decrypt(encrypted));
 */

const algorithm = 'aes-256-cbc';

export function encrypt(text: string): Buffer {
  const iv = crypto.randomBytes(16); // Генерируем случайный IV
  const cipher = crypto.createCipheriv(...getCipherParams(iv));
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  // Конкатенируем IV и зашифрованный текст
  return Buffer.concat([iv, encrypted]);
}

export function encryptIfExists(text: string): Buffer;
export function encryptIfExists<TNone extends undefined | null>(
  text: string | TNone
): Buffer | TNone;
export function encryptIfExists(text: string | undefined | null): Buffer | undefined | null {
  if (text === undefined || text === null) {
    return text;
  }

  return encrypt(text);
}

export function decrypt(encrypted: Buffer): string {
  const iv = encrypted.subarray(0, 16); // Извлекаем IV из зашифрованных данных
  const encryptedText = encrypted.subarray(16); // Отделяем IV от зашифрованного текста
  const decipher = crypto.createDecipheriv(...getCipherParams(iv));
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString('utf8');
}

export function decryptIfExists(encrypted: Buffer): string;
export function decryptIfExists<TNone extends undefined | null>(
  encrypted: Buffer | TNone
): string | TNone;
export function decryptIfExists(encrypted: Buffer | undefined | null): string | undefined | null {
  if (encrypted === undefined || encrypted === null) {
    return encrypted;
  }

  return decrypt(encrypted);
}

const getCipherParams = (iv: Buffer): [algorithm: string, key: Buffer, iv: Buffer] => [
  algorithm,
  Buffer.from(getEnv().CRYPTO_KEY, 'hex'),
  iv,
];
