'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface SepetKalemi {
  urunId: string;
  adet: number;
  notlar?: string;
}

interface SepetState {
  /** Sepetin bağlı olduğu masa token'ı. Token değişirse sepet sıfırlanır. */
  aktifMasaToken: string | null;
  kalemler: SepetKalemi[];

  masaAyarla: (token: string) => void;
  ekle: (urunId: string, adet?: number) => void;
  cikar: (urunId: string) => void;
  guncelle: (urunId: string, adet: number) => void;
  notGuncelle: (urunId: string, notlar: string | undefined) => void;
  temizle: () => void;

  // türetilmiş
  adetGetir: (urunId: string) => number;
  toplamAdet: () => number;
}

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

      ekle: (urunId, adet = 1) =>
        set((s) => {
          const mevcut = s.kalemler.find((k) => k.urunId === urunId);
          if (mevcut) {
            return {
              kalemler: s.kalemler.map((k) =>
                k.urunId === urunId ? { ...k, adet: k.adet + adet } : k,
              ),
            };
          }
          return { kalemler: [...s.kalemler, { urunId, adet }] };
        }),

      cikar: (urunId) =>
        set((s) => ({
          kalemler: s.kalemler.filter((k) => k.urunId !== urunId),
        })),

      guncelle: (urunId, adet) =>
        set((s) => {
          if (adet <= 0) {
            return {
              kalemler: s.kalemler.filter((k) => k.urunId !== urunId),
            };
          }
          return {
            kalemler: s.kalemler.map((k) =>
              k.urunId === urunId ? { ...k, adet } : k,
            ),
          };
        }),

      notGuncelle: (urunId, notlar) =>
        set((s) => ({
          kalemler: s.kalemler.map((k) =>
            k.urunId === urunId ? { ...k, notlar } : k,
          ),
        })),

      temizle: () => set({ kalemler: [] }),

      adetGetir: (urunId) =>
        get().kalemler.find((k) => k.urunId === urunId)?.adet ?? 0,
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
