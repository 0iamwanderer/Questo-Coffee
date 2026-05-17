// Demo veri seed script'i.
//
// Kullanım:
//   node --env-file=.env.local scripts/seed.mjs
//
// Üretime karşı çalıştırmadan önce .env.local'da NEXT_PUBLIC_RESTORAN_ID
// ve FIREBASE_SERVICE_ACCOUNT'in doğru olduğundan emin olun.
// Emulator için: FIRESTORE_EMULATOR_HOST=localhost:8080 ayarlı olmalı.
// İlk kasiyer/sahip claim'ini ayarlamak isterseniz SEED_SAHIP_EMAIL ekleyin
// (kullanıcı önce Firebase Auth'ta yaratılmış olmalı).

import {
  initializeApp,
  cert,
  getApps,
} from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { customAlphabet } from 'nanoid';

const restoranId = process.env.NEXT_PUBLIC_RESTORAN_ID;
if (!restoranId) {
  console.error('✗ NEXT_PUBLIC_RESTORAN_ID eksik (.env.local).');
  process.exit(1);
}

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-questo';

if (getApps().length === 0) {
  if (emulatorHost) {
    initializeApp({ projectId });
    console.log(`• Emulator: ${emulatorHost}`);
  } else {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!sa) {
      console.error(
        '✗ FIREBASE_SERVICE_ACCOUNT eksik (emulator kullanmıyorsanız gereklidir).',
      );
      process.exit(1);
    }
    const parsed = JSON.parse(sa);
    initializeApp({
      credential: cert({
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key.replace(/\\n/g, '\n'),
      }),
    });
    console.log(`• Production project: ${parsed.project_id}`);
  }
}

const db = getFirestore();
const auth = getAuth();
const baseRef = db.collection('restoranlar').doc(restoranId);

const uretToken = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  22,
);

const KATEGORILER = [
  { ad: 'Sıcak İçecekler', sira: 1 },
  { ad: 'Soğuk İçecekler', sira: 2 },
  { ad: 'Tatlılar', sira: 3 },
];

const URUNLER = [
  { ad: 'Espresso', kat: 'Sıcak İçecekler', fiyatKurus: 4500, sira: 1 },
  { ad: 'Türk Kahvesi', kat: 'Sıcak İçecekler', fiyatKurus: 5500, sira: 2 },
  { ad: 'Latte', kat: 'Sıcak İçecekler', fiyatKurus: 7500, sira: 3 },
  { ad: 'Cappuccino', kat: 'Sıcak İçecekler', fiyatKurus: 7500, sira: 4 },
  { ad: 'Limonata', kat: 'Soğuk İçecekler', fiyatKurus: 6000, sira: 1 },
  { ad: 'Ice Latte', kat: 'Soğuk İçecekler', fiyatKurus: 8500, sira: 2 },
  { ad: 'Cheesecake', kat: 'Tatlılar', fiyatKurus: 12500, sira: 1 },
  { ad: 'Brownie', kat: 'Tatlılar', fiyatKurus: 11000, sira: 2 },
];

const MASALAR = ['M1', 'M2', 'M3', 'Bahçe-1', 'Bahçe-2'];

const main = async () => {
  console.log(`Seed başlıyor → restoranlar/${restoranId}\n`);

  // Restoran doc
  await baseRef.set({ ad: 'Demo Kafe' }, { merge: true });
  console.log('+ restoran: Demo Kafe');

  // Kategoriler
  const katMap = {};
  for (const k of KATEGORILER) {
    const ref = await baseRef.collection('kategoriler').add({
      ...k,
      aktifMi: true,
      olusturulduAt: FieldValue.serverTimestamp(),
    });
    katMap[k.ad] = ref.id;
    console.log(`+ kategori: ${k.ad}`);
  }

  // Ürünler
  for (const u of URUNLER) {
    await baseRef.collection('urunler').add({
      ad: u.ad,
      kategoriId: katMap[u.kat],
      fiyatKurus: u.fiyatKurus,
      stoktaMi: true,
      sira: u.sira,
      olusturulduAt: FieldValue.serverTimestamp(),
    });
    console.log(`+ urun:     ${u.ad}  (${(u.fiyatKurus / 100).toFixed(2)} TL)`);
  }

  // Masalar
  for (const ad of MASALAR) {
    const token = uretToken();
    await baseRef.collection('masalar').add({
      ad,
      token,
      aktifMi: true,
      olusturulduAt: FieldValue.serverTimestamp(),
    });
    console.log(`+ masa:     ${ad}  → /m/${token}`);
  }

  // Opsiyonel: ilk kasiyer/sahip claim
  const email = process.env.SEED_SAHIP_EMAIL;
  if (email) {
    try {
      const user = await auth.getUserByEmail(email);
      await auth.setCustomUserClaims(user.uid, {
        rol: 'kasiyer',
        sahip: true,
        restoranId,
      });
      console.log(`+ claim:    ${email} → kasiyer + sahip`);
    } catch (e) {
      console.warn(
        `! ${email} için claim atanamadı: ${
          e instanceof Error ? e.message : e
        }`,
      );
    }
  }

  console.log('\n✓ Seed tamamlandı.');
};

main().catch((e) => {
  console.error('✗ Seed hatası:', e);
  process.exit(1);
});
