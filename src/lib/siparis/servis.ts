import 'server-only';

import {
  FieldValue,
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

const restoranId = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new AppError('yapilandirma', 'Restoran tanımlı değil.', 500);
  return id;
};

/**
 * Müşteri siparişini transaction içinde yazar.
 *
 * Güvenlik garantileri:
 * - İstemciden gelen fiyat YOKSAYILIR; tüm fiyatlar Firestore'dan okunur.
 * - Stokta olmayan ürün → işlem tümüyle geri alınır.
 * - Günlük sıra no, sayaç doc'una atomik increment ile yazılır.
 * - Açık adisyon aynı masada birden fazla olamaz: aynı transaction'da
 *   açık adisyon sorgulanır, yoksa oluşturulur (yarış koşulu transaction
 *   tarafından çözülür).
 */
export const siparisYaz = async (
  istek: SiparisIstegiT,
  musteriUid: string,
): Promise<SiparisYazSonuc> => {
  const R = restoranId();
  const db = getAdminDb();

  const masalarRef = db.collection(`restoranlar/${R}/masalar`);
  const adisyonlarRef = db.collection(`restoranlar/${R}/adisyonlar`);
  const urunlerRefBase = db.collection(`restoranlar/${R}/urunler`);
  const sayacRef = db.doc(
    `restoranlar/${R}/sayaclar/${istanbulGunId()}`,
  );

  return await db.runTransaction(async (tx) => {
    // ── 1) Okumalar (yazılardan önce HEPSİ) ────────────────────────────
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

    // ── 2) Hesaplama (sunucu fiyatı) ───────────────────────────────────
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

    // ── 3) Adisyon ref + günlük no ─────────────────────────────────────
    const mevcutAdisyon = acikSnap.empty ? null : acikSnap.docs[0]!;
    const adisyonRef = mevcutAdisyon
      ? mevcutAdisyon.ref
      : adisyonlarRef.doc();

    const oncekiNo = sayacSnap.exists
      ? (sayacSnap.data() as SayacOkuma).gunlukSiparisNo
      : 0;
    const gunlukNo = oncekiNo + 1;

    const simdi = FieldValue.serverTimestamp();

    // ── 4) Yazımlar ────────────────────────────────────────────────────
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
        acilisAt: simdi,
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
      durumTarihleri: { yeni: simdi },
      olusturulduAt: simdi,
    });

    return {
      adisyonId: adisyonRef.id,
      siparisId: siparisRef.id,
      gunlukNo,
      toplamKurus,
    };
  });
};
