/**
 * Yerel/emulator ortamında mıyız?
 *
 * Performans için uygulamayı `next start` ile çalıştırıyoruz; bu NODE_ENV'i
 * 'production' yapar. Ama bu hâlâ emülatöre bağlı YEREL POS kurulumu —
 * gerçek bulut üretimi değil. "Otomatik giriş yalnız geliştirmede", "cookie
 * yalnız HTTPS'te güvenli", "service worker yalnız üretimde" gibi kararların
 * doğru ölçütü NODE_ENV değil, emülatör sinyalidir.
 *
 * Sunucuda FIRESTORE/AUTH emulator host'ları runtime'da okunur; tarayıcıda
 * NEXT_PUBLIC_USE_EMULATOR build sırasında gömülür — bu yüzden hem sunucu hem
 * istemci tarafında doğru çalışır.
 */
export const emulatorOrtami = (): boolean =>
  !!process.env.FIRESTORE_EMULATOR_HOST ||
  !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
  process.env.NEXT_PUBLIC_USE_EMULATOR === '1';
