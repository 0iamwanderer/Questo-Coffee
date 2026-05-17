import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import type { OturumKullanicisi } from '@/lib/auth/guard';

export interface AuditKayit {
  /** Eylem adı — '<kaynak>.<işlem>' formatinda, ör. 'urun.create' */
  aksiyon: string;
  /** İlgili belge yolu veya iş kimliği */
  kaynak: string;
  oncekiVeri?: unknown;
  sonrakiVeri?: unknown;
  meta?: Record<string, unknown>;
}

/**
 * Admin eylemlerini denetim kaydı olarak tutar. Hata durumunda sessizce
 * loglar — denetim yazımı asıl operasyonu engellemez.
 */
export const auditLogla = async (
  u: OturumKullanicisi,
  restoranId: string,
  kayit: AuditKayit,
): Promise<void> => {
  try {
    await getAdminDb()
      .collection(`restoranlar/${restoranId}/kullaniciAksiyonlari`)
      .add({
        uid: u.uid,
        eposta: u.email ?? null,
        ...kayit,
        zaman: FieldValue.serverTimestamp(),
      });
  } catch (e) {
    console.error('[audit] log yazılamadı:', e);
  }
};
