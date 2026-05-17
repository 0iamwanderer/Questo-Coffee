import { customAlphabet } from 'nanoid';

// URL-safe alfabe, 22 karakter ≈ 128 bit entropi (kolay tahmin edilemez).
const uretici = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  22,
);

export const uretMasaToken = (): string => uretici();
