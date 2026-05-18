// Demo veri seed script'i.
//
// Kullanım:
//   node --env-file=.env.local scripts/seed.mjs
//
// Üretime karşı çalıştırmadan önce .env.local'da NEXT_PUBLIC_RESTORAN_ID
// ve FIREBASE_SERVICE_ACCOUNT(_PATH) değerlerinin doğru olduğundan emin olun.
// Emulator için: FIRESTORE_EMULATOR_HOST=localhost:8080 ayarlı olmalı.
// İlk kasiyer/sahip claim'ini ayarlamak isterseniz SEED_SAHIP_EMAIL ekleyin
// (kullanıcı önce Firebase Auth'ta yaratılmış olmalı).
//
// Emulator modunda: eski kategoriler/ürünler/masalar otomatik temizlenir.
// Production'da: kayıp endişesinden temizleme yapılmaz, sadece ekleme yapılır.

import { initializeApp, cert, getApps } from 'firebase-admin/app';
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
    const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
    const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    let sa = inline && inline.trim().length > 0 ? inline : null;
    if (!sa && path && path.trim().length > 0) {
      const { readFileSync } = await import('node:fs');
      const { resolve } = await import('node:path');
      sa = readFileSync(resolve(path), 'utf8');
    }
    if (!sa) {
      console.error(
        '✗ FIREBASE_SERVICE_ACCOUNT veya FIREBASE_SERVICE_ACCOUNT_PATH eksik.',
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

// ── Demo veri ───────────────────────────────────────────────────────────

const KATEGORILER = [
  { ad: 'Sıcak İçecekler', sira: 1 },
  { ad: 'Soğuk İçecekler', sira: 2 },
  { ad: 'Tatlılar', sira: 3 },
  { ad: 'Atıştırmalıklar', sira: 4 },
];

const URUNLER = [
  // ── Sıcak İçecekler ──
  {
    ad: 'Espresso',
    kat: 'Sıcak İçecekler',
    fiyatKurus: 5500,
    sira: 1,
    aciklama: 'Tek shot, koyu kavrum. Kakao ve fındık notaları.',
  },
  {
    ad: 'Türk Kahvesi',
    kat: 'Sıcak İçecekler',
    fiyatKurus: 6000,
    sira: 2,
    aciklama: 'Bakır cezve, közde pişirim. Yanında lokum.',
    opsiyonGruplari: [
      {
        id: 'turk-seker',
        ad: 'Şeker',
        tip: 'tek',
        zorunlu: true,
        secenekler: [
          { id: 'sade', ad: 'Sade', ekFiyatKurus: 0 },
          { id: 'az', ad: 'Az şekerli', ekFiyatKurus: 0 },
          { id: 'orta', ad: 'Orta şekerli', ekFiyatKurus: 0 },
          { id: 'sek', ad: 'Şekerli', ekFiyatKurus: 0 },
        ],
      },
    ],
  },
  {
    ad: 'Filtre Kahve',
    kat: 'Sıcak İçecekler',
    fiyatKurus: 7500,
    sira: 3,
    aciklama: 'Etiyopya Yirgacheffe, V60 demleme. Çiçeksi.',
  },
  {
    ad: 'Americano',
    kat: 'Sıcak İçecekler',
    fiyatKurus: 7500,
    sira: 4,
    aciklama: 'Espresso üzerine sıcak su.',
  },
  {
    ad: 'Cappuccino',
    kat: 'Sıcak İçecekler',
    fiyatKurus: 9500,
    sira: 5,
    aciklama: 'Klasik İtalyan oranı, ipeksi mikro köpük.',
    opsiyonGruplari: [
      {
        id: 'cap-sut',
        ad: 'Süt',
        tip: 'tek',
        zorunlu: true,
        secenekler: [
          { id: 'inek', ad: 'İnek sütü', ekFiyatKurus: 0 },
          { id: 'badem', ad: 'Badem sütü', ekFiyatKurus: 1000 },
          { id: 'soya', ad: 'Soya sütü', ekFiyatKurus: 1000 },
          { id: 'yulaf', ad: 'Yulaf sütü', ekFiyatKurus: 1500 },
        ],
      },
    ],
  },
  {
    ad: 'Latte',
    kat: 'Sıcak İçecekler',
    fiyatKurus: 9500,
    sira: 6,
    aciklama: 'Espresso + buharlı süt, yumuşak köpük.',
    opsiyonGruplari: [
      {
        id: 'latte-boy',
        ad: 'Boy',
        tip: 'tek',
        zorunlu: true,
        secenekler: [
          { id: 'kucuk', ad: 'Küçük (250ml)', ekFiyatKurus: 0 },
          { id: 'buyuk', ad: 'Büyük (350ml)', ekFiyatKurus: 1500 },
        ],
      },
      {
        id: 'latte-sut',
        ad: 'Süt',
        tip: 'tek',
        zorunlu: true,
        secenekler: [
          { id: 'inek', ad: 'İnek sütü', ekFiyatKurus: 0 },
          { id: 'badem', ad: 'Badem sütü', ekFiyatKurus: 1000 },
          { id: 'yulaf', ad: 'Yulaf sütü', ekFiyatKurus: 1500 },
        ],
      },
      {
        id: 'latte-ekstra',
        ad: 'Ekstralar',
        tip: 'cok',
        zorunlu: false,
        secenekler: [
          { id: 'ekstra-shot', ad: 'Ekstra shot', ekFiyatKurus: 1500 },
          { id: 'vanilya', ad: 'Vanilya şurubu', ekFiyatKurus: 800 },
          { id: 'karamel', ad: 'Karamel şurubu', ekFiyatKurus: 800 },
        ],
      },
    ],
  },
  {
    ad: 'Flat White',
    kat: 'Sıcak İçecekler',
    fiyatKurus: 9500,
    sira: 7,
    aciklama: 'Avustralya tarzı, ince mikro köpüklü süt.',
  },
  {
    ad: 'Mocha',
    kat: 'Sıcak İçecekler',
    fiyatKurus: 10500,
    sira: 8,
    aciklama: 'Espresso + çikolata sosu + süt köpüğü.',
  },
  {
    ad: 'Sıcak Çikolata',
    kat: 'Sıcak İçecekler',
    fiyatKurus: 8500,
    sira: 9,
    aciklama: 'Bitter çikolatadan, krema topping.',
  },
  {
    ad: 'Çay',
    kat: 'Sıcak İçecekler',
    fiyatKurus: 2500,
    sira: 10,
    aciklama: 'Rize demli çay, ince belli bardak.',
  },

  // ── Soğuk İçecekler ──
  {
    ad: 'Cold Brew',
    kat: 'Soğuk İçecekler',
    fiyatKurus: 11500,
    sira: 1,
    aciklama: '16 saat soğuk demleme. Pürüzsüz, tatlımsı.',
  },
  {
    ad: 'Ice Latte',
    kat: 'Soğuk İçecekler',
    fiyatKurus: 10500,
    sira: 2,
    aciklama: 'Espresso + soğuk süt + buz.',
    opsiyonGruplari: [
      {
        id: 'ice-sut',
        ad: 'Süt',
        tip: 'tek',
        zorunlu: true,
        secenekler: [
          { id: 'inek', ad: 'İnek sütü', ekFiyatKurus: 0 },
          { id: 'badem', ad: 'Badem sütü', ekFiyatKurus: 1000 },
          { id: 'yulaf', ad: 'Yulaf sütü', ekFiyatKurus: 1500 },
        ],
      },
    ],
  },
  {
    ad: 'Espresso Tonik',
    kat: 'Soğuk İçecekler',
    fiyatKurus: 11500,
    sira: 3,
    aciklama: 'Espresso + tonik + portakal kabuğu.',
  },
  {
    ad: 'Ev Limonatası',
    kat: 'Soğuk İçecekler',
    fiyatKurus: 7500,
    sira: 4,
    aciklama: 'Sıkma limon, nane, fesleğen.',
  },
  {
    ad: 'Matcha Latte',
    kat: 'Soğuk İçecekler',
    fiyatKurus: 12500,
    sira: 5,
    aciklama: 'Tören sınıfı matcha + badem sütü. Sıcak/buzlu.',
  },
  {
    ad: 'Milkshake',
    kat: 'Soğuk İçecekler',
    fiyatKurus: 11500,
    sira: 6,
    aciklama: 'Dondurmalı, kalın kıvam.',
    opsiyonGruplari: [
      {
        id: 'shake-aroma',
        ad: 'Aroma',
        tip: 'tek',
        zorunlu: true,
        secenekler: [
          { id: 'cikolata', ad: 'Çikolata', ekFiyatKurus: 0 },
          { id: 'vanilya', ad: 'Vanilya', ekFiyatKurus: 0 },
          { id: 'cilek', ad: 'Çilek', ekFiyatKurus: 0 },
        ],
      },
    ],
  },
  {
    ad: 'Buzlu Türk Kahvesi',
    kat: 'Soğuk İçecekler',
    fiyatKurus: 8500,
    sira: 7,
    aciklama: 'Geleneksel tat, modern soğuk sunum.',
  },

  // ── Tatlılar ──
  {
    ad: 'San Sebastian',
    kat: 'Tatlılar',
    fiyatKurus: 14500,
    sira: 1,
    aciklama: 'Yanık peynirli cheesecake, çatlak yüzey.',
  },
  {
    ad: 'Sıcak Brownie',
    kat: 'Tatlılar',
    fiyatKurus: 12500,
    sira: 2,
    aciklama: 'Akışkan ortalı, vanilyalı dondurma ile.',
  },
  {
    ad: 'Tiramisu',
    kat: 'Tatlılar',
    fiyatKurus: 13500,
    sira: 3,
    aciklama: 'Mascarpone, espresso, sade kakao.',
  },
  {
    ad: 'Tahinli Kurabiye',
    kat: 'Tatlılar',
    fiyatKurus: 4500,
    sira: 4,
    aciklama: 'Susam ve pekmez ile, ev yapımı.',
  },
  {
    ad: 'Mevsim Pastası',
    kat: 'Tatlılar',
    fiyatKurus: 11500,
    sira: 5,
    aciklama: 'Şefin günlük seçimi.',
  },

  // ── Atıştırmalıklar ──
  {
    ad: 'Avokado Tost',
    kat: 'Atıştırmalıklar',
    fiyatKurus: 18500,
    sira: 1,
    aciklama: 'Ekşi maya ekmek, kiraz domates, pul biber.',
  },
  {
    ad: 'Sucuklu Yumurta',
    kat: 'Atıştırmalıklar',
    fiyatKurus: 16500,
    sira: 2,
    aciklama: 'Köy yumurtası, fermente fıçı sucuğu.',
  },
  {
    ad: 'Granola Kase',
    kat: 'Atıştırmalıklar',
    fiyatKurus: 14500,
    sira: 3,
    aciklama: 'Yulaf, fındık, mevsim meyveleri, yoğurt.',
  },
  {
    ad: 'Simit & Beyaz Peynir',
    kat: 'Atıştırmalıklar',
    fiyatKurus: 9500,
    sira: 4,
    aciklama: 'Sıcak simit, ezine, zeytin, domates.',
  },
  {
    ad: 'Mantar Çorbası',
    kat: 'Atıştırmalıklar',
    fiyatKurus: 12500,
    sira: 5,
    aciklama: 'Kuru porçini, krema ve kekik ile.',
  },
];

// 20 masa
const MASALAR = Array.from({ length: 20 }, (_, i) => `M${i + 1}`);

// ── Helpers ─────────────────────────────────────────────────────────────

const koleksiyonuBosalt = async (koleksiyon) => {
  const snap = await baseRef.collection(koleksiyon).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
};

// ── Main ────────────────────────────────────────────────────────────────

const main = async () => {
  console.log(`Seed başlıyor → restoranlar/${restoranId}\n`);

  // Emulator modunda mevcut menüyü temizle (production'da tehlikeli)
  if (emulatorHost) {
    console.log('• Emulator modu — mevcut menü/masalar temizleniyor…');
    const k = await koleksiyonuBosalt('kategoriler');
    const u = await koleksiyonuBosalt('urunler');
    const m = await koleksiyonuBosalt('masalar');
    console.log(`  × ${k} kategori, ${u} urun, ${m} masa silindi\n`);
  } else {
    console.log(
      '⚠ Production modu — mevcut veri ÜZERİNE eklenecek (silinmiyor).\n',
    );
  }

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
  let urunSayisi = 0;
  for (const u of URUNLER) {
    await baseRef.collection('urunler').add({
      ad: u.ad,
      kategoriId: katMap[u.kat],
      fiyatKurus: u.fiyatKurus,
      stoktaMi: true,
      sira: u.sira,
      ...(u.aciklama ? { aciklama: u.aciklama } : {}),
      ...(u.opsiyonGruplari ? { opsiyonGruplari: u.opsiyonGruplari } : {}),
      olusturulduAt: FieldValue.serverTimestamp(),
    });
    urunSayisi++;
  }
  console.log(`+ ${urunSayisi} ürün eklendi`);

  // Masalar
  for (const ad of MASALAR) {
    const token = uretToken();
    await baseRef.collection('masalar').add({
      ad,
      token,
      aktifMi: true,
      olusturulduAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`+ ${MASALAR.length} masa eklendi (M1-M${MASALAR.length})`);

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
      console.log(`+ claim: ${email} → kasiyer + sahip`);
    } catch (e) {
      console.warn(
        `! ${email} için claim atanamadı: ${
          e instanceof Error ? e.message : e
        }`,
      );
    }
  }

  console.log('\n✓ Seed tamamlandı.');
  console.log(
    '\nMasaları görmek için: http://localhost:3000 (dev kısayolu kartı)',
  );
};

main().catch((e) => {
  console.error('✗ Seed hatası:', e);
  process.exit(1);
});
