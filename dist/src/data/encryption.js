import crypto from 'node:crypto';
import { getEnv } from '../config/envVars.js';
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
export function encrypt(text) {
    const iv = crypto.randomBytes(16); // Генерируем случайный IV
    const cipher = crypto.createCipheriv(...getCipherParams(iv));
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
    ]);
    // Конкатенируем IV и зашифрованный текст
    return Buffer.concat([iv, encrypted]);
}
export function encryptIfExists(text) {
    if (text === undefined || text === null) {
        return text;
    }
    return encrypt(text);
}
export function decrypt(encrypted) {
    const iv = encrypted.subarray(0, 16); // Извлекаем IV из зашифрованных данных
    const encryptedText = encrypted.subarray(16); // Отделяем IV от зашифрованного текста
    const decipher = crypto.createDecipheriv(...getCipherParams(iv));
    const decrypted = Buffer.concat([
        decipher.update(encryptedText),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}
export function decryptIfExists(encrypted) {
    if (encrypted === undefined || encrypted === null) {
        return encrypted;
    }
    return decrypt(encrypted);
}
const getCipherParams = (iv) => [
    algorithm,
    Buffer.from(getEnv().CRYPTO_KEY, 'hex'),
    iv,
];
