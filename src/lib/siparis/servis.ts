import 'server-only';

import {
  FieldValue,
  Timestamp,
  type DocumentReference,
} from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { AppError } from '@/lib/utils/hata';
import type { SiparisIstegiT } from '@/lib/utils/zod-semalar';
import { istanbulGunId } from './sayac';

export interface SiparisYazSonuc {
  adisyonId: string;
  siparisId: string;
  gunlukNo: number;
  toplamKurus: number;
}

interface UrunOkuma {
  ad: string;
  fiyatKurus: number;
  stoktaMi: boolean;
}

interface AdisyonOkuma {
  toplamKurus: number;
  siparisSayisi: number;
}

interface SayacOkuma {
  gunlukSiparisNo: number;
}

interface RateLimitOkuma {
  pencere: number[];
}

interface IdempotencyOkuma {
  musteriUid: string;
  sonuc: SiparisYazSonuc;
}

// ── Rate limit ayarları ────────────────────────────────────────────────
const RATE_PENCERE_MS = 60_000;
const RATE_LIMIT = 10;
// ── Idempotency ──────────────────────────────────────────────────────
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

const restoranId = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new AppError('yapilandirma', 'Restoran tanımlı değil.', 500);
  return id;
};

/**
 * Müşteri siparişini transaction içinde yazar.
 *
 * Güvenlik garantileri:
 * - İstemciden gelen fiyat YOKSAYILIR; fiyatlar Firestore'dan okunur.
 * - Stokta olmayan ürün → işlem tümüyle geri alınır.
 * - Günlük sıra no atomik increment ile yazılır.
 * - Açık adisyon aynı transaction'da sorgulanıp tek tutulur (yarış koşulu yok).
 * - **Rate limit:** musteriUid başına 60 saniyede en fazla 10 sipariş.
 * - **Idempotency:** opsiyonel idempotencyKey ile aynı istek tekrarlanırsa
 *   önceki sonuç döner (24 saat TTL).
 */
export const siparisYaz = async (
  istek: SiparisIstegiT,
  musteriUid: string,
  idempotencyKey?: string,
): Promise<SiparisYazSonuc> => {
  const R = restoranId();
  const db = getAdminDb();

  const masalarRef = db.collection(`restoranlar/${R}/masalar`);
  const adisyonlarRef = db.collection(`restoranlar/${R}/adisyonlar`);
  const urunlerRefBase = db.collection(`restoranlar/${R}/urunler`);
  const sayacRef = db.doc(
    `restoranlar/${R}/sayaclar/${istanbulGunId()}`,
  );
  const rateRef = db.doc(`rateLimit/${musteriUid}`);
  const idempotencyRef = idempotencyKey
    ? db.doc(`idempotency/${idempotencyKey}`)
    : null;

  return await db.runTransaction(async (tx) => {
    // ── 1) Idempotency kontrolü ────────────────────────────────────────
    if (idempotencyRef) {
      const idemSnap = await tx.get(idempotencyRef);
      if (idemSnap.exists) {
        const data = idemSnap.data() as IdempotencyOkuma;
        if (data.musteriUid !== musteriUid) {
          throw new AppError(
            'idempotency_carpisma',
            'Bu istek anahtarı başka bir kullanıcıya ait.',
            409,
          );
        }
        return data.sonuc;
      }
    }

    // ── 2) Rate limit kontrolü ─────────────────────────────────────────
    const simdi = Date.now();
    const rateSnap = await tx.get(rateRef);
    const oncekiPencere = rateSnap.exists
      ? ((rateSnap.data() as RateLimitOkuma).pencere ?? [])
      : [];
    const guncelPencere = oncekiPencere.filter(
      (t) => simdi - t < RATE_PENCERE_MS,
    );
    if (guncelPencere.length >= RATE_LIMIT) {
      const ilkZaman = guncelPencere[0] ?? simdi;
      const beklemeSn = Math.ceil(
        (RATE_PENCERE_MS - (simdi - ilkZaman)) / 1000,
      );
      throw new AppError(
        'rate_limit',
        `Çok sık sipariş veriyorsunuz. ${beklemeSn} saniye sonra tekrar deneyin.`,
        429,
      );
    }

    // ── 3) Diğer okumalar (yazılardan önce HEPSİ) ──────────────────────
    const masaQ = masalarRef
      .where('token', '==', istek.masaToken)
      .where('aktifMi', '==', true)
      .limit(1);
    const masaSnap = await tx.get(masaQ);
    if (masaSnap.empty) {
      throw new AppError('masa_yok', 'Masa bulunamadı veya pasif.', 404);
    }
    const masaDoc = masaSnap.docs[0]!;
    const masaId = masaDoc.id;

    const acikQ = adisyonlarRef
      .where('masaId', '==', masaId)
      .where('durum', '==', 'acik')
      .limit(1);
    const acikSnap = await tx.get(acikQ);

    const urunRefler: DocumentReference[] = istek.kalemler.map((k) =>
      urunlerRefBase.doc(k.urunId),
    );
    const urunSnaps = await tx.getAll(...urunRefler);

    const sayacSnap = await tx.get(sayacRef);

    // ── 4) Hesaplama ───────────────────────────────────────────────────
    let toplamKurus = 0;
    const kalemler = urunSnaps.map((s, i) => {
      const istem = istek.kalemler[i]!;
      if (!s.exists) {
        throw new AppError(
          'urun_yok',
          `Ürün bulunamadı: ${istem.urunId}`,
          400,
        );
      }
      const u = s.data() as UrunOkuma;
      if (!u.stoktaMi) {
        throw new AppError('stok_yok', `Stokta yok: ${u.ad}`, 409);
      }
      const araToplamKurus = u.fiyatKurus * istem.adet;
      toplamKurus += araToplamKurus;
      return {
        urunId: s.id,
        ad: u.ad,
        birimFiyatKurus: u.fiyatKurus,
        adet: istem.adet,
        ...(istem.notlar ? { notlar: istem.notlar } : {}),
        araToplamKurus,
      };
    });

    const mevcutAdisyon = acikSnap.empty ? null : acikSnap.docs[0]!;
    const adisyonRef = mevcutAdisyon
      ? mevcutAdisyon.ref
      : adisyonlarRef.doc();

    const oncekiNo = sayacSnap.exists
      ? (sayacSnap.data() as SayacOkuma).gunlukSiparisNo
      : 0;
    const gunlukNo = oncekiNo + 1;

    const simdiTs = FieldValue.serverTimestamp();

    // ── 5) Yazımlar ────────────────────────────────────────────────────
    if (mevcutAdisyon) {
      const m = mevcutAdisyon.data() as AdisyonOkuma;
      tx.update(adisyonRef, {
        toplamKurus: m.toplamKurus + toplamKurus,
        siparisSayisi: m.siparisSayisi + 1,
      });
    } else {
      tx.set(adisyonRef, {
        masaId,
        durum: 'acik',
        toplamKurus,
        acilisAt: simdiTs,
        siparisSayisi: 1,
      });
    }

    tx.set(sayacRef, { gunlukSiparisNo: gunlukNo }, { merge: true });

    const siparisRef = adisyonRef.collection('siparisler').doc();
    tx.set(siparisRef, {
      adisyonId: adisyonRef.id,
      masaId,
      musteriUid,
      gunlukNo,
      kalemler,
      toplamKurus,
      durum: 'yeni',
      durumTarihleri: { yeni: simdiTs },
      olusturulduAt: simdiTs,
    });

    // Rate limit penceresini güncelle
    tx.set(rateRef, { pencere: [...guncelPencere, simdi] }, { merge: true });

    const sonuc: SiparisYazSonuc = {
      adisyonId: adisyonRef.id,
      siparisId: siparisRef.id,
      gunlukNo,
      toplamKurus,
    };

    // Idempotency doc'unu yaz (TTL field ile)
    if (idempotencyRef) {
      tx.set(idempotencyRef, {
        musteriUid,
        sonuc,
        expireAt: Timestamp.fromMillis(simdi + IDEMPOTENCY_TTL_MS),
      });
    }

    return sonuc;
  });
};
