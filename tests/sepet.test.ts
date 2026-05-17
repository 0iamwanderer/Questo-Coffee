import { beforeEach, describe, expect, it, vi } from 'vitest';

// localStorage shim (Zustand persist Node test ortamında window bekliyor)
const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => storage.set(k, v),
  removeItem: (k: string) => storage.delete(k),
  clear: () => storage.clear(),
} satisfies Storage as unknown as Storage);

import { useSepet } from '@/stores/sepet';

describe('sepet store', () => {
  beforeEach(() => {
    useSepet.setState({ aktifMasaToken: null, kalemler: [] });
    storage.clear();
  });

  it('ekle: yeni ürün ekler', () => {
    useSepet.getState().ekle('u1', 2);
    expect(useSepet.getState().kalemler).toEqual([{ urunId: 'u1', adet: 2 }]);
  });

  it('ekle: var olan ürünün adetini artırır', () => {
    useSepet.getState().ekle('u1', 1);
    useSepet.getState().ekle('u1', 3);
    expect(useSepet.getState().adetGetir('u1')).toBe(4);
  });

  it('guncelle: 0 veya negatif adet ürünü siler', () => {
    useSepet.getState().ekle('u1', 2);
    useSepet.getState().guncelle('u1', 0);
    expect(useSepet.getState().kalemler).toEqual([]);
  });

  it('masaAyarla: token değişirse sepeti temizler', () => {
    useSepet.getState().masaAyarla('TOKEN_A');
    useSepet.getState().ekle('u1', 1);
    useSepet.getState().masaAyarla('TOKEN_B');
    expect(useSepet.getState().kalemler).toEqual([]);
    expect(useSepet.getState().aktifMasaToken).toBe('TOKEN_B');
  });

  it('masaAyarla: aynı token verilirse sepet korunur', () => {
    useSepet.getState().masaAyarla('TOKEN_A');
    useSepet.getState().ekle('u1', 1);
    useSepet.getState().masaAyarla('TOKEN_A');
    expect(useSepet.getState().adetGetir('u1')).toBe(1);
  });

  it('toplamAdet: tüm kalemler toplanır', () => {
    useSepet.getState().ekle('u1', 2);
    useSepet.getState().ekle('u2', 3);
    expect(useSepet.getState().toplamAdet()).toBe(5);
  });

  it('notGuncelle: sadece ilgili kalemin notunu değiştirir', () => {
    useSepet.getState().ekle('u1', 1);
    useSepet.getState().ekle('u2', 1);
    useSepet.getState().notGuncelle('u1', 'az şekerli');
    const k1 = useSepet.getState().kalemler.find((k) => k.urunId === 'u1');
    const k2 = useSepet.getState().kalemler.find((k) => k.urunId === 'u2');
    expect(k1?.notlar).toBe('az şekerli');
    expect(k2?.notlar).toBeUndefined();
  });
});
