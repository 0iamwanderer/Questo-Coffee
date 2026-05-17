'use client';

import { customAlphabet } from 'nanoid';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface SepetSecim {
  grupId: string;
  secenekIds: string[];
}

export interface SepetKalemi {
  /** Sepet satırının uniq id'si — aynı urunId farklı opsiyonlar ile birden fazla satır olabilir */
  satirId: string;
  urunId: string;
  adet: number;
  notlar?: string;
  secimler?: SepetSecim[];
}

interface SepetState {
  aktifMasaToken: string | null;
  kalemler: SepetKalemi[];

  masaAyarla: (token: string) => void;
  ekle: (
    urunId: string,
    opts?: { adet?: number; secimler?: SepetSecim[]; notlar?: string },
  ) => void;
  cikar: (satirId: string) => void;
  guncelle: (satirId: string, adet: number) => void;
  notGuncelle: (satirId: string, notlar: string | undefined) => void;
  temizle: () => void;

  /** Ürünün sepetteki tüm varyantlarının toplam adedi */
  adetGetir: (urunId: string) => number;
  toplamAdet: () => number;
}

const satirIdUret = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  10,
);

const secimAnahtar = (secimler?: SepetSecim[]): string => {
  if (!secimler || secimler.length === 0) return '';
  return secimler
    .map((s) => `${s.grupId}:${[...s.secenekIds].sort().join(',')}`)
    .sort()
    .join('|');
};

export const useSepet = create<SepetState>()(
  persist(
    (set, get) => ({
      aktifMasaToken: null,
      kalemler: [],

      masaAyarla: (token) => {
        const cur = get().aktifMasaToken;
        if (cur && cur !== token) {
          set({ aktifMasaToken: token, kalemler: [] });
        } else if (cur !== token) {
          set({ aktifMasaToken: token });
        }
      },

      ekle: (urunId, opts = {}) => {
        const { adet = 1, secimler, notlar } = opts;
        const yeniAnahtar = secimAnahtar(secimler);
        set((s) => {
          const mevcut = s.kalemler.find(
            (k) =>
              k.urunId === urunId &&
              secimAnahtar(k.secimler) === yeniAnahtar,
          );
          if (mevcut) {
            return {
              kalemler: s.kalemler.map((k) =>
                k.satirId === mevcut.satirId
                  ? {
                      ...k,
                      adet: k.adet + adet,
                      ...(notlar !== undefined ? { notlar } : {}),
                    }
                  : k,
              ),
            };
          }
          return {
            kalemler: [
              ...s.kalemler,
              {
                satirId: satirIdUret(),
                urunId,
                adet,
                ...(secimler && secimler.length > 0 ? { secimler } : {}),
                ...(notlar ? { notlar } : {}),
              },
            ],
          };
        });
      },

      cikar: (satirId) =>
        set((s) => ({
          kalemler: s.kalemler.filter((k) => k.satirId !== satirId),
        })),

      guncelle: (satirId, adet) =>
        set((s) => {
          if (adet <= 0) {
            return {
              kalemler: s.kalemler.filter((k) => k.satirId !== satirId),
            };
          }
          return {
            kalemler: s.kalemler.map((k) =>
              k.satirId === satirId ? { ...k, adet } : k,
            ),
          };
        }),

      notGuncelle: (satirId, notlar) =>
        set((s) => ({
          kalemler: s.kalemler.map((k) =>
            k.satirId === satirId ? { ...k, notlar } : k,
          ),
        })),

      temizle: () => set({ kalemler: [] }),

      adetGetir: (urunId) =>
        get()
          .kalemler.filter((k) => k.urunId === urunId)
          .reduce((a, k) => a + k.adet, 0),
      toplamAdet: () => get().kalemler.reduce((a, b) => a + b.adet, 0),
    }),
    {
      name: 'questo-sepet',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        aktifMasaToken: s.aktifMasaToken,
        kalemler: s.kalemler,
      }),
    },
  ),
);
