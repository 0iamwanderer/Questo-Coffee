/**
 * Emulator Storage indirme URL'leri `http://<host>:9199/...` biçimindedir.
 * Next/Image bu host'u `remotePatterns` allowlist'inde bulamadığı için
 * görseli optimize edemez ve menüde HİÇ render etmez. Emulator modunda
 * görselleri optimize etmeden (düz <img>) servis ederek bu engeli aşarız;
 * böylece yerel POS'ta yüklenen ürün görselleri menüde görünür.
 *
 * Production'da (gerçek Firebase) bayrak kapalı olduğundan görseller
 * normal şekilde optimize edilir.
 */
export const GORSEL_OPTIMIZASYONSUZ =
  process.env.NEXT_PUBLIC_USE_EMULATOR === '1';
