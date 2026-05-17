import { z } from 'zod';

// ── Müşteri → sipariş POST ──────────────────────────────────────────────
export const SiparisKalemiGirdi = z.object({
  urunId: z.string().min(1).max(64),
  adet: z.number().int().min(1).max(99),
  notlar: z.string().trim().max(200).optional(),
});

export const SiparisIstegi = z.object({
  masaToken: z.string().min(16).max(64),
  kalemler: z.array(SiparisKalemiGirdi).min(1).max(50),
});
export type SiparisIstegiT = z.infer<typeof SiparisIstegi>;

// ── Admin: ürün / kategori / masa ───────────────────────────────────────
export const UrunGirdi = z.object({
  kategoriId: z.string().min(1),
  ad: z.string().trim().min(1).max(120),
  aciklama: z.string().trim().max(500).optional(),
  fiyatKurus: z.number().int().min(0).max(1_000_000),
  stoktaMi: z.boolean(),
  sira: z.number().int().min(0).max(9999).default(0),
  gorselUrl: z.string().url().optional(),
});
export type UrunGirdiT = z.infer<typeof UrunGirdi>;

export const KategoriGirdi = z.object({
  ad: z.string().trim().min(1).max(80),
  sira: z.number().int().min(0).max(9999).default(0),
  aktifMi: z.boolean().default(true),
});
export type KategoriGirdiT = z.infer<typeof KategoriGirdi>;

export const MasaGirdi = z.object({
  ad: z.string().trim().min(1).max(40),
});
export type MasaGirdiT = z.infer<typeof MasaGirdi>;

// ── Kasa: durum güncelleme ──────────────────────────────────────────────
export const DurumGirdi = z.object({
  durum: z.enum(['hazirlaniyor', 'hazir', 'teslim', 'iptal']),
});
export type DurumGirdiT = z.infer<typeof DurumGirdi>;
