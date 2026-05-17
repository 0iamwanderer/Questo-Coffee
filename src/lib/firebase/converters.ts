import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import type {
  Adisyon,
  Kategori,
  Masa,
  Siparis,
  Urun,
} from '@/types/model';

const timestampToDate = (v: unknown): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (typeof (v as Timestamp).toDate === 'function') {
    return (v as Timestamp).toDate();
  }
  return undefined;
};

const baseConverter = <T extends { id: string }>(
  hydrate?: (raw: Record<string, unknown>) => Record<string, unknown>,
): FirestoreDataConverter<T> => ({
  toFirestore: (data) => {
    const { id: _id, ...rest } = data as T & { id?: string };
    return rest as Record<string, unknown>;
  },
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const raw = snap.data();
    const hydrated = hydrate ? hydrate(raw) : raw;
    return { id: snap.id, ...hydrated } as T;
  },
});

export const kategoriConverter = baseConverter<Kategori>();
export const urunConverter = baseConverter<Urun>();

export const masaConverter = baseConverter<Masa>((raw) => ({
  ...raw,
  olusturulduAt: timestampToDate(raw.olusturulduAt),
}));

export const adisyonConverter = baseConverter<Adisyon>((raw) => ({
  ...raw,
  acilisAt: timestampToDate(raw.acilisAt),
  kapanisAt: timestampToDate(raw.kapanisAt),
}));

export const siparisConverter = baseConverter<Siparis>((raw) => {
  const dt = (raw.durumTarihleri ?? {}) as Record<string, unknown>;
  return {
    ...raw,
    olusturulduAt: timestampToDate(raw.olusturulduAt),
    durumTarihleri: {
      yeni: timestampToDate(dt.yeni),
      hazirlaniyor: timestampToDate(dt.hazirlaniyor),
      hazir: timestampToDate(dt.hazir),
      teslim: timestampToDate(dt.teslim),
      iptal: timestampToDate(dt.iptal),
    },
  };
});
