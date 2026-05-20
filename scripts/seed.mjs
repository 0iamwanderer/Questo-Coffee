// Demo veri seed script'i — Questo Coffea Co. spec datası.
//
// Kullanım:
//   node --env-file=.env.local scripts/seed.mjs
//
// Emulator modunda (FIRESTORE_EMULATOR_HOST set) mevcut menü temizlenir.

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

// ── Spec'in opsiyon şablonları ────────────────────────────────────────
const OPT_SUT = {
  id: 'sut',
  ad: 'Süt',
  tip: 'tek',
  zorunlu: true,
  secenekler: [
    { id: 'inek', ad: 'İnek sütü', ekFiyatKurus: 0 },
    { id: 'yulaf', ad: 'Yulaf sütü', ekFiyatKurus: 1000 },
    { id: 'badem', ad: 'Badem sütü', ekFiyatKurus: 1000 },
    { id: 'soya', ad: 'Soya sütü', ekFiyatKurus: 1000 },
  ],
};

const OPT_SEKER = {
  id: 'seker',
  ad: 'Şeker',
  tip: 'tek',
  zorunlu: true,
  secenekler: [
    { id: 'sade', ad: 'Sade', ekFiyatKurus: 0 },
    { id: 'az', ad: 'Az şekerli', ekFiyatKurus: 0 },
    { id: 'orta', ad: 'Orta şekerli', ekFiyatKurus: 0 },
    { id: 'sek', ad: 'Şekerli', ekFiyatKurus: 0 },
  ],
};

// ── Kategoriler (spec'ten) ─────────────────────────────────────────────
const KATEGORILER = [
  {
    ad: 'Sıcak İçecekler',
    sira: 1,
    roman: 'I',
    tagline: 'Tek menşeli çekirdek, taze kavrum.',
  },
  {
    ad: 'Soğuk İçecekler',
    sira: 2,
    roman: 'II',
    tagline: 'Yavaş demleme, buzun üzerinde.',
    story: {
      kicker: 'Mevsim notu',
      title: 'Sıcağa karşı, sabırla.',
      body: 'Soğuk demlememizi geceden hazırlıyoruz. Sabah ilk filtre, bekleyenin hakkı.',
      sign: '— Barista ekibi',
    },
  },
  {
    ad: 'Tatlılar',
    sira: 3,
    roman: 'III',
    tagline: 'El yapımı, günlük taze.',
    story: {
      kicker: 'Mutfaktan',
      body: 'Tatlıyı hak edenin günü iyi geçer.',
      sign: '— Türk atasözü',
    },
  },
  {
    ad: 'Atıştırmalıklar',
    sira: 4,
    roman: 'IV',
    tagline: 'Sabah taze fırından.',
    story: {
      kicker: 'Fırın',
      title: 'Her sabah 06:30.',
      body: 'Hamurlar gece yoğrulur, sabah taze pişer. Yanında bir Türk kahvesi tam yakışır.',
      sign: '— Manisa şubesi',
    },
  },
];

// ── Ürünler (spec'ten, fiyatlar TRY→kuruş) ────────────────────────────
const URUNLER = [
  // Sıcak İçecekler
  { ad: 'Espresso', kat: 'Sıcak İçecekler', fiyatKurus: 5500, sira: 1, aciklama: 'Tek shot, koyu kavrum.', sefOnerisi: true },
  { ad: 'Americano', kat: 'Sıcak İçecekler', fiyatKurus: 7500, sira: 2, aciklama: 'Çift shot, üzerine sıcak su.' },
  { ad: 'Cappuccino', kat: 'Sıcak İçecekler', fiyatKurus: 9500, sira: 3, aciklama: 'Klasik İtalyan oranı, ipeksi köpük.', opsiyonGruplari: [OPT_SUT] },
  { ad: 'Latte', kat: 'Sıcak İçecekler', fiyatKurus: 9500, sira: 4, aciklama: 'Espresso + buharlı süt.', opsiyonGruplari: [OPT_SUT] },
  { ad: 'Flat White', kat: 'Sıcak İçecekler', fiyatKurus: 9500, sira: 5, aciklama: 'Mikro köpüklü süt, Avustralya tarzı.' },
  { ad: 'Mocha', kat: 'Sıcak İçecekler', fiyatKurus: 10500, sira: 6, aciklama: 'Espresso + bitter çikolata + süt.' },
  { ad: 'Türk Kahvesi', kat: 'Sıcak İçecekler', fiyatKurus: 6000, sira: 7, aciklama: 'Bakır cezve, közde pişirim. Yanında lokum.', opsiyonGruplari: [OPT_SEKER] },
  { ad: 'Filtre Kahve', kat: 'Sıcak İçecekler', fiyatKurus: 7500, sira: 8, aciklama: 'Etiyopya Yirgacheffe, V60 demleme.' },
  { ad: 'Sıcak Çikolata', kat: 'Sıcak İçecekler', fiyatKurus: 9000, sira: 9, aciklama: 'Belçika bitter, tam yağlı süt.' },
  { ad: 'Salep', kat: 'Sıcak İçecekler', fiyatKurus: 8500, sira: 10, aciklama: 'Anadolu salebi, taze tarçın.' },

  // Soğuk İçecekler
  { ad: 'Soğuk Demleme', kat: 'Soğuk İçecekler', fiyatKurus: 8500, sira: 1, aciklama: '12 saatlik yavaş demleme.', sefOnerisi: true },
  { ad: 'Buzlu Americano', kat: 'Soğuk İçecekler', fiyatKurus: 8000, sira: 2, aciklama: 'Çift espresso + buz + soğuk su.' },
  { ad: 'Buzlu Latte', kat: 'Soğuk İçecekler', fiyatKurus: 9500, sira: 3, aciklama: 'Espresso + soğuk süt + buz.', opsiyonGruplari: [OPT_SUT] },

  // Tatlılar
  { ad: 'Künefe', kat: 'Tatlılar', fiyatKurus: 14500, sira: 1, aciklama: 'Antep peyniri, kadayıf, fıstık.', sefOnerisi: true },
  { ad: 'Çikolatalı Sufle', kat: 'Tatlılar', fiyatKurus: 13000, sira: 2, aciklama: 'Akıcı merkezli, vanilya dondurma.' },
  { ad: 'San Sebastian', kat: 'Tatlılar', fiyatKurus: 12000, sira: 3, aciklama: 'Karamelize üst, kremamsı iç.' },

  // Atıştırmalıklar
  { ad: 'Simit', kat: 'Atıştırmalıklar', fiyatKurus: 2500, sira: 1, aciklama: 'Susam kaplı, taze fırın.' },
  { ad: 'Peynirli Poğaça', kat: 'Atıştırmalıklar', fiyatKurus: 3500, sira: 2, aciklama: 'Beyaz peynir, maydanoz.', sefOnerisi: true },
  { ad: 'Tereyağlı Croissant', kat: 'Atıştırmalıklar', fiyatKurus: 5500, sira: 3, aciklama: 'Fransız tarzı, çok katmanlı.' },
];

// 20 masa
const MASALAR = Array.from({ length: 20 }, (_, i) => `M${i + 1}`);

// ── Helpers ────────────────────────────────────────────────────────────
const koleksiyonuBosalt = async (koleksiyon) => {
  const snap = await baseRef.collection(koleksiyon).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
};

const main = async () => {
  console.log(`Seed başlıyor → restoranlar/${restoranId}\n`);

  if (emulatorHost) {
    console.log('• Emulator modu — mevcut menü/masalar temizleniyor…');
    const k = await koleksiyonuBosalt('kategoriler');
    const u = await koleksiyonuBosalt('urunler');
    const m = await koleksiyonuBosalt('masalar');
    console.log(`  × ${k} kategori, ${u} urun, ${m} masa silindi\n`);
  } else {
    console.log('⚠ Production modu — mevcut veri ÜZERİNE eklenir.\n');
  }

  // Restoran meta — sahibi/şehir bilgisi
  await baseRef.set(
    {
      ad: 'Questo Coffea Co.',
      sehir: 'Manisa',
      yil: 2026,
    },
    { merge: true },
  );
  console.log('+ restoran: Questo Coffea Co. (Manisa)');

  // Kategoriler
  const katMap = {};
  for (const k of KATEGORILER) {
    const ref = await baseRef.collection('kategoriler').add({
      ad: k.ad,
      sira: k.sira,
      aktifMi: true,
      ...(k.roman ? { roman: k.roman } : {}),
      ...(k.tagline ? { tagline: k.tagline } : {}),
      ...(k.story ? { story: k.story } : {}),
      olusturulduAt: FieldValue.serverTimestamp(),
    });
    katMap[k.ad] = ref.id;
    console.log(`+ kategori: ${k.roman ?? ''} ${k.ad}`);
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
      ...(u.sefOnerisi ? { sefOnerisi: true } : {}),
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

  const email = process.env.SEED_SAHIP_EMAIL;
  const VARSAYILAN_SIFRE = 'questo123';
  if (email) {
    try {
      let user;
      try {
        user = await auth.getUserByEmail(email);
      } catch {
        // Kullanıcı yok — oluştur
        user = await auth.createUser({
          email,
          password: VARSAYILAN_SIFRE,
          emailVerified: true,
        });
        console.log(`+ kullanıcı oluşturuldu: ${email}  şifre: ${VARSAYILAN_SIFRE}`);
      }
      await auth.setCustomUserClaims(user.uid, {
        rol: 'kasiyer',
        sahip: true,
        restoranId,
      });
      console.log(`+ claim: ${email} → kasiyer + sahip`);
    } catch (e) {
      console.warn(
        `! ${email} için işlem başarısız: ${
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
