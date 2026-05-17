/**
 * Tüm para alanları kuruş (integer). Kayan nokta yok.
 * Kurus branded type — kazara TL ile karışmasını TS engelliyor.
 */
export type Kurus = number & { readonly __brand: 'Kurus' };

export const Kurus = (n: number): Kurus => {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`Geçersiz kuruş değeri: ${n}`);
  }
  return n as Kurus;
};

export type SiparisDurumu =
  | 'yeni'
  | 'hazirlaniyor'
  | 'hazir'
  | 'teslim'
  | 'iptal';

export type AdisyonDurumu = 'acik' | 'kapali';

export type PersonelRolu = 'kasiyer';

export interface PersonelClaims {
  rol: PersonelRolu;
  sahip?: boolean; // menü/masa/kullanıcı yönetim yetkisi
  restoranId: string;
}

export interface Kategori {
  id: string;
  ad: string;
  sira: number;
  aktifMi: boolean;
}

export interface Urun {
  id: string;
  kategoriId: string;
  ad: string;
  aciklama?: string;
  fiyatKurus: Kurus;
  stoktaMi: boolean;
  gorselUrl?: string;
  sira: number;
}

export interface Masa {
  id: string;
  ad: string;
  token: string;
  aktifMi: boolean;
  olusturulduAt: Date;
}

export interface SiparisKalemi {
  urunId: string;
  ad: string;
  birimFiyatKurus: Kurus;
  adet: number;
  notlar?: string;
  araToplamKurus: Kurus;
}

export interface SiparisDurumTarihleri {
  yeni: Date;
  hazirlaniyor?: Date;
  hazir?: Date;
  teslim?: Date;
  iptal?: Date;
}

export interface Siparis {
  id: string;
  adisyonId: string;
  masaId: string;
  musteriUid: string;
  gunlukNo: number;
  kalemler: SiparisKalemi[];
  toplamKurus: Kurus;
  durum: SiparisDurumu;
  durumTarihleri: SiparisDurumTarihleri;
  olusturulduAt: Date;
}

export interface Adisyon {
  id: string;
  masaId: string;
  durum: AdisyonDurumu;
  toplamKurus: Kurus;
  acilisAt: Date;
  kapanisAt?: Date;
  siparisSayisi: number;
}
