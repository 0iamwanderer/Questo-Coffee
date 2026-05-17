import { initializeApp } from 'firebase-admin/app';
import {
  FieldValue,
  Timestamp,
  getFirestore,
} from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';

initializeApp();

// Deploy zamanında runtime parametresi olarak okunur:
//   firebase functions:config:set veya
//   firebase deploy ile --set-env veya parametre prompt
const restoranIdParam = defineString('RESTORAN_ID', {
  description: 'Restoran kimliği (tek-kiracı dağıtımı için).',
});

const SLA_DAKIKA = 10;
const SLA_HAZIRLAMA_DAKIKA = 15;

const ortakConfig = {
  region: 'europe-west1' as const,
  timeZone: 'Europe/Istanbul' as const,
};

/**
 * Her 5 dakikada bir çalışır. `yeni` durumda 10+ dk veya `hazirlaniyor`
 * durumda 15+ dk kalmış siparişlere `slaUyari = true` flag'i koyar.
 * Kanban kart bu flag'i kırmızı bir rozetle gösterir.
 */
export const slaKontrol = onSchedule(
  { ...ortakConfig, schedule: 'every 5 minutes' },
  async () => {
    const restoranId = restoranIdParam.value();
    if (!restoranId) {
      logger.warn('RESTORAN_ID parametre değeri boş, atlanıyor.');
      return;
    }

    const db = getFirestore();
    const simdi = Date.now();
    const yeniEsik = Timestamp.fromMillis(simdi - SLA_DAKIKA * 60_000);
    const hazirlamaEsik = Timestamp.fromMillis(
      simdi - SLA_HAZIRLAMA_DAKIKA * 60_000,
    );

    const restoranOnEk = `restoranlar/${restoranId}/`;

    const [yeniSnap, hazirlamaSnap] = await Promise.all([
      db
        .collectionGroup('siparisler')
        .where('durum', '==', 'yeni')
        .where('olusturulduAt', '<=', yeniEsik)
        .get(),
      db
        .collectionGroup('siparisler')
        .where('durum', '==', 'hazirlaniyor')
        .where('olusturulduAt', '<=', hazirlamaEsik)
        .get(),
    ]);

    const ilgili = [...yeniSnap.docs, ...hazirlamaSnap.docs].filter(
      (d) => d.ref.path.startsWith(restoranOnEk) && !d.get('slaUyari'),
    );

    if (ilgili.length === 0) {
      logger.info('SLA kontrol: gecikmiş sipariş yok.');
      return;
    }

    const batch = db.batch();
    ilgili.forEach((d) => batch.update(d.ref, { slaUyari: true }));
    await batch.commit();

    logger.warn('SLA uyarısı işaretlendi.', {
      sayi: ilgili.length,
      ids: ilgili.map((d) => d.id),
    });
  },
);

/**
 * Sipariş durumu ilerlediğinde slaUyari flag'i otomatik temizlenir.
 */
export const slaUyariniTemizle = onDocumentUpdated(
  {
    ...ortakConfig,
    document:
      'restoranlar/{restoranId}/adisyonlar/{adisyonId}/siparisler/{siparisId}',
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const ilerletildi =
      before.durum !== after.durum &&
      after.durum !== 'yeni' &&
      after.durum !== 'hazirlaniyor';

    if (ilerletildi && after.slaUyari === true) {
      await event.data!.after.ref.update({
        slaUyari: FieldValue.delete(),
      });
    }
  },
);
