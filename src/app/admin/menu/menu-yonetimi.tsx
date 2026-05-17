'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { getClientDb } from '@/lib/firebase/client';
import {
  kategoriConverter,
  urunConverter,
} from '@/lib/firebase/converters';
import type { Kategori, Urun } from '@/types/model';
import { formatTL, tlToKurus } from '@/lib/utils/para';
import { cn } from '@/lib/utils';

const RESTORAN = process.env.NEXT_PUBLIC_RESTORAN_ID as string;

interface KategoriForm {
  ad: string;
  sira: number;
  aktifMi: boolean;
}
interface UrunForm {
  ad: string;
  kategoriId: string;
  fiyatTL: string;
  aciklama: string;
  stoktaMi: boolean;
  sira: number;
}

const bosKategori: KategoriForm = { ad: '', sira: 0, aktifMi: true };
const bosUrun: UrunForm = {
  ad: '',
  kategoriId: '',
  fiyatTL: '',
  aciklama: '',
  stoktaMi: true,
  sira: 0,
};

export function MenuYonetimi() {
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [aktif, setAktif] = useState<string | null>(null);
  const [katForm, setKatForm] = useState<{
    acik: boolean;
    duzenleId: string | null;
    veri: KategoriForm;
  }>({ acik: false, duzenleId: null, veri: bosKategori });
  const [urunForm, setUrunForm] = useState<{
    acik: boolean;
    duzenleId: string | null;
    veri: UrunForm;
  }>({ acik: false, duzenleId: null, veri: bosUrun });
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    const db = getClientDb();
    const kQ = query(
      collection(db, `restoranlar/${RESTORAN}/kategoriler`).withConverter(
        kategoriConverter,
      ),
      orderBy('sira', 'asc'),
    );
    const uQ = query(
      collection(db, `restoranlar/${RESTORAN}/urunler`).withConverter(
        urunConverter,
      ),
      orderBy('sira', 'asc'),
    );
    const u1 = onSnapshot(kQ, (s) => setKategoriler(s.docs.map((d) => d.data())));
    const u2 = onSnapshot(uQ, (s) => setUrunler(s.docs.map((d) => d.data())));
    return () => {
      u1();
      u2();
    };
  }, []);

  useEffect(() => {
    if (!aktif && kategoriler[0]) setAktif(kategoriler[0].id);
  }, [kategoriler, aktif]);

  const goruntulenenUrunler = useMemo(
    () => urunler.filter((u) => u.kategoriId === aktif),
    [urunler, aktif],
  );

  const istek = async (
    yol: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    body?: unknown,
  ) => {
    setHata(null);
    const res = await fetch(yol, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { mesaj?: string };
      throw new Error(j.mesaj ?? 'İşlem başarısız.');
    }
    return res.json();
  };

  // ── Kategori işlemleri ─────────────────────────────────────────────
  const kategoriKaydet = async () => {
    try {
      const veri = katForm.veri;
      if (katForm.duzenleId) {
        await istek(`/api/admin/kategori/${katForm.duzenleId}`, 'PATCH', veri);
      } else {
        await istek('/api/admin/kategori', 'POST', veri);
      }
      setKatForm({ acik: false, duzenleId: null, veri: bosKategori });
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Hata');
    }
  };

  const kategoriSil = async (id: string) => {
    if (!window.confirm('Kategoriyi silmek istediğinize emin misiniz?')) return;
    try {
      await istek(`/api/admin/kategori/${id}`, 'DELETE');
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Hata');
    }
  };

  // ── Ürün işlemleri ─────────────────────────────────────────────────
  const urunKaydet = async () => {
    try {
      const v = urunForm.veri;
      const tl = parseFloat(v.fiyatTL.replace(',', '.'));
      if (Number.isNaN(tl) || tl < 0) throw new Error('Geçersiz fiyat.');
      const payload = {
        ad: v.ad,
        kategoriId: v.kategoriId || aktif,
        fiyatKurus: tlToKurus(tl),
        aciklama: v.aciklama || undefined,
        stoktaMi: v.stoktaMi,
        sira: v.sira,
      };
      if (urunForm.duzenleId) {
        await istek(`/api/admin/urun/${urunForm.duzenleId}`, 'PATCH', payload);
      } else {
        await istek('/api/admin/urun', 'POST', payload);
      }
      setUrunForm({ acik: false, duzenleId: null, veri: bosUrun });
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Hata');
    }
  };

  const urunSil = async (id: string) => {
    if (!window.confirm('Ürünü silmek istediğinize emin misiniz?')) return;
    try {
      await istek(`/api/admin/urun/${id}`, 'DELETE');
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Hata');
    }
  };

  const stokDegistir = async (u: Urun, yeni: boolean) => {
    try {
      await istek(`/api/admin/urun/${u.id}`, 'PATCH', { stoktaMi: yeni });
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Hata');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
      {hata && (
        <p
          role="alert"
          className="md:col-span-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {hata}
        </p>
      )}

      {/* ── Kategoriler ── */}
      <aside className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Kategoriler</h2>
          <button
            type="button"
            onClick={() =>
              setKatForm({ acik: true, duzenleId: null, veri: bosKategori })
            }
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
          >
            <Plus className="size-3.5" />
            Ekle
          </button>
        </div>
        <ul className="space-y-1">
          {kategoriler.map((k) => (
            <li key={k.id}>
              <div
                className={cn(
                  'group flex items-center justify-between gap-2 rounded-md border px-2 py-1.5',
                  aktif === k.id && 'border-primary bg-accent',
                )}
              >
                <button
                  type="button"
                  onClick={() => setAktif(k.id)}
                  className="flex-1 text-left text-sm"
                >
                  {k.ad}
                  {!k.aktifMi && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (pasif)
                    </span>
                  )}
                </button>
                <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label="Düzenle"
                    onClick={() =>
                      setKatForm({
                        acik: true,
                        duzenleId: k.id,
                        veri: { ad: k.ad, sira: k.sira, aktifMi: k.aktifMi },
                      })
                    }
                    className="p-1"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Sil"
                    onClick={() => kategoriSil(k.id)}
                    className="p-1 text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {katForm.acik && (
          <div className="space-y-2 rounded-md border bg-card p-3">
            <input
              type="text"
              placeholder="Kategori adı"
              value={katForm.veri.ad}
              onChange={(e) =>
                setKatForm((f) => ({
                  ...f,
                  veri: { ...f.veri, ad: e.target.value },
                }))
              }
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                placeholder="Sıra"
                value={katForm.veri.sira}
                onChange={(e) =>
                  setKatForm((f) => ({
                    ...f,
                    veri: { ...f.veri, sira: Number(e.target.value) },
                  }))
                }
                className="w-20 rounded-md border bg-background px-2 py-1.5 text-sm"
              />
              <label className="inline-flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={katForm.veri.aktifMi}
                  onChange={(e) =>
                    setKatForm((f) => ({
                      ...f,
                      veri: { ...f.veri, aktifMi: e.target.checked },
                    }))
                  }
                />
                Aktif
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={kategoriKaydet}
                disabled={!katForm.veri.ad.trim()}
                className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
              >
                {katForm.duzenleId ? 'Güncelle' : 'Ekle'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setKatForm({ acik: false, duzenleId: null, veri: bosKategori })
                }
                className="rounded-md border px-3 py-1.5 text-sm"
              >
                İptal
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Ürünler ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">
            Ürünler
            {aktif && (
              <span className="ml-2 text-xs text-muted-foreground">
                · {kategoriler.find((k) => k.id === aktif)?.ad}
              </span>
            )}
          </h2>
          {aktif && (
            <button
              type="button"
              onClick={() =>
                setUrunForm({
                  acik: true,
                  duzenleId: null,
                  veri: { ...bosUrun, kategoriId: aktif },
                })
              }
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
            >
              <Plus className="size-3.5" />
              Ürün ekle
            </button>
          )}
        </div>

        {urunForm.acik && (
          <div className="space-y-2 rounded-md border bg-card p-3">
            <input
              type="text"
              placeholder="Ürün adı"
              value={urunForm.veri.ad}
              onChange={(e) =>
                setUrunForm((f) => ({
                  ...f,
                  veri: { ...f.veri, ad: e.target.value },
                }))
              }
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            />
            <textarea
              placeholder="Açıklama (opsiyonel)"
              rows={2}
              value={urunForm.veri.aciklama}
              onChange={(e) =>
                setUrunForm((f) => ({
                  ...f,
                  veri: { ...f.veri, aciklama: e.target.value },
                }))
              }
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={urunForm.veri.kategoriId}
                onChange={(e) =>
                  setUrunForm((f) => ({
                    ...f,
                    veri: { ...f.veri, kategoriId: e.target.value },
                  }))
                }
                className="rounded-md border bg-background px-2 py-1.5 text-sm"
              >
                {kategoriler.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.ad}
                  </option>
                ))}
              </select>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Fiyat (TL)"
                value={urunForm.veri.fiyatTL}
                onChange={(e) =>
                  setUrunForm((f) => ({
                    ...f,
                    veri: { ...f.veri, fiyatTL: e.target.value },
                  }))
                }
                className="rounded-md border bg-background px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                placeholder="Sıra"
                value={urunForm.veri.sira}
                onChange={(e) =>
                  setUrunForm((f) => ({
                    ...f,
                    veri: { ...f.veri, sira: Number(e.target.value) },
                  }))
                }
                className="rounded-md border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <label className="inline-flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={urunForm.veri.stoktaMi}
                onChange={(e) =>
                  setUrunForm((f) => ({
                    ...f,
                    veri: { ...f.veri, stoktaMi: e.target.checked },
                  }))
                }
              />
              Stokta
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={urunKaydet}
                disabled={!urunForm.veri.ad.trim() || !urunForm.veri.fiyatTL}
                className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
              >
                {urunForm.duzenleId ? 'Güncelle' : 'Ekle'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setUrunForm({ acik: false, duzenleId: null, veri: bosUrun })
                }
                className="rounded-md border px-3 py-1.5 text-sm"
              >
                İptal
              </button>
            </div>
          </div>
        )}

        <ul className="space-y-2">
          {goruntulenenUrunler.length === 0 ? (
            <li className="rounded-lg border border-dashed bg-card/50 p-6 text-center text-xs text-muted-foreground">
              Henüz ürün yok.
            </li>
          ) : (
            goruntulenenUrunler.map((u) => (
              <li
                key={u.id}
                className="flex items-start gap-3 rounded-lg border bg-card p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{u.ad}</div>
                  {u.aciklama && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {u.aciklama}
                    </p>
                  )}
                  <div className="mt-1 text-sm font-semibold">
                    {formatTL(u.fiyatKurus)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={u.stoktaMi}
                      onChange={(e) => stokDegistir(u, e.target.checked)}
                    />
                    Stokta
                  </label>
                  <button
                    type="button"
                    aria-label="Düzenle"
                    onClick={() =>
                      setUrunForm({
                        acik: true,
                        duzenleId: u.id,
                        veri: {
                          ad: u.ad,
                          kategoriId: u.kategoriId,
                          fiyatTL: (u.fiyatKurus / 100).toString(),
                          aciklama: u.aciklama ?? '',
                          stoktaMi: u.stoktaMi,
                          sira: u.sira,
                        },
                      })
                    }
                    className="p-1.5"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Sil"
                    onClick={() => urunSil(u.id)}
                    className="p-1.5 text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
