import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    useSepet.getState().ekle('u1', { adet: 2 });
    const k = useSepet.getState().kalemler;
    expect(k).toHaveLength(1);
    expect(k[0]?.urunId).toBe('u1');
    expect(k[0]?.adet).toBe(2);
    expect(k[0]?.satirId).toMatch(/^[0-9A-Za-z]{10}$/);
  });

  it('ekle: aynı ürün secimsiz iki kez eklenince adet birleşir', () => {
    useSepet.getState().ekle('u1');
    useSepet.getState().ekle('u1', { adet: 3 });
    expect(useSepet.getState().kalemler).toHaveLength(1);
    expect(useSepet.getState().adetGetir('u1')).toBe(4);
  });

  it('ekle: aynı ürün farklı secimlerle iki ayrı satır olur', () => {
    useSepet
      .getState()
      .ekle('u1', { secimler: [{ grupId: 'boy', secenekIds: ['kucuk'] }] });
    useSepet
      .getState()
      .ekle('u1', { secimler: [{ grupId: 'boy', secenekIds: ['buyuk'] }] });
    expect(useSepet.getState().kalemler).toHaveLength(2);
    expect(useSepet.getState().adetGetir('u1')).toBe(2);
  });

  it('ekle: aynı ürün aynı secimlerle birleşir (sıra önemsiz)', () => {
    useSepet.getState().ekle('u1', {
      secimler: [
        { grupId: 'a', secenekIds: ['x', 'y'] },
        { grupId: 'b', secenekIds: ['z'] },
      ],
    });
    useSepet.getState().ekle('u1', {
      secimler: [
        { grupId: 'b', secenekIds: ['z'] },
        { grupId: 'a', secenekIds: ['y', 'x'] }, // farklı sıra
      ],
    });
    expect(useSepet.getState().kalemler).toHaveLength(1);
    expect(useSepet.getState().kalemler[0]?.adet).toBe(2);
  });

  it('guncelle: 0 adet kalemi siler', () => {
    useSepet.getState().ekle('u1', { adet: 2 });
    const id = useSepet.getState().kalemler[0]!.satirId;
    useSepet.getState().guncelle(id, 0);
    expect(useSepet.getState().kalemler).toEqual([]);
  });

  it('cikar: satirId ile siler', () => {
    useSepet.getState().ekle('u1');
    useSepet.getState().ekle('u2');
    const id = useSepet.getState().kalemler[0]!.satirId;
    useSepet.getState().cikar(id);
    expect(useSepet.getState().kalemler).toHaveLength(1);
    expect(useSepet.getState().kalemler[0]?.urunId).toBe('u2');
  });

  it('notGuncelle: yalnız ilgili kaleme not yazar', () => {
    useSepet.getState().ekle('u1');
    useSepet.getState().ekle('u2');
    const id = useSepet.getState().kalemler[0]!.satirId;
    useSepet.getState().notGuncelle(id, 'az şekerli');
    expect(useSepet.getState().kalemler[0]?.notlar).toBe('az şekerli');
    expect(useSepet.getState().kalemler[1]?.notlar).toBeUndefined();
  });

  it('masaAyarla: token değişirse sepeti temizler', () => {
    useSepet.getState().masaAyarla('TOKEN_A');
    useSepet.getState().ekle('u1');
    useSepet.getState().masaAyarla('TOKEN_B');
    expect(useSepet.getState().kalemler).toEqual([]);
    expect(useSepet.getState().aktifMasaToken).toBe('TOKEN_B');
  });

  it('toplamAdet: tüm kalemlerin adetleri', () => {
    useSepet.getState().ekle('u1', { adet: 2 });
    useSepet.getState().ekle('u2', { adet: 3 });
    expect(useSepet.getState().toplamAdet()).toBe(5);
  });
});
