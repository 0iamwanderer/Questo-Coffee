import Link from 'next/link';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { formatTL } from '@/lib/utils/para';
import { istanbulGunId } from '@/lib/siparis/sayac';
import type { SiparisDurumu } from '@/types/model';
import { YazdirButton } from './yazdir-btn';
import { RaporSiparisListesi, type RaporSiparis } from './siparis-listesi';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Istanbul saatine göre biçimleyiciler (belge başlığı + hızlı gün butonları)
const istFmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', ...opts });

// yyyy-mm-dd → o günü temsil eden Date (öğle, Istanbul) — biçimleme için güvenli
const gunDate = (yyyymmdd: string) => new Date(`${yyyymmdd}T12:00:00+03:00`);

const R = (): string => {
  const id = process.env.NEXT_PUBLIC_RESTORAN_ID;
  if (!id) throw new Error('NEXT_PUBLIC_RESTORAN_ID tanımlı değil.');
  return id;
};

interface Props {
  searchParams: Promise<{ tarih?: string }>;
}

interface KalemRapor {
  ad: string;
  adet: number;
  ciroKurus: number;
}

const tarihAraligi = (yyyymmdd: string) => {
  // Europe/Istanbul'da o günün başlangıcı ve bitişi → UTC Date
  // Basit yaklaşım: yerel saat olarak yorumla, +03:00 ekle (TR DST yok)
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  if (!y || !m || !d) throw new Error('Geçersiz tarih.');
  // 00:00 Istanbul = 21:00 UTC önceki gün
  const baslangic = new Date(Date.UTC(y, m - 1, d, -3, 0, 0));
  const bitis = new Date(Date.UTC(y, m - 1, d, 21, 0, 0));
  return { baslangic, bitis };
};

export default async function RaporSayfasi({ searchParams }: Props) {
  const { tarih } = await searchParams;
  const seciliTarih = tarih ?? istanbulGunId();
  const { bitis } = tarihAraligi(seciliTarih);
  const db = getAdminDb();
  const restoranId = R();

  // Restoran meta — belge başlığı için ad/şehir
  const restoranSnap = await db.doc(`restoranlar/${restoranId}`).get();
  const restoranMeta = (restoranSnap.data() ?? {}) as {
    ad?: string;
    sehir?: string;
  };
  const restoranAd = restoranMeta.ad ?? 'Questo';

  // Son 7 gün (bugün dahil) — hızlı erişim butonları için
  const sonYediGun = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86_400_000);
    return istanbulGunId(d);
  });
  const bugunId = sonYediGun[0]!;

  // Haftalık pencere: SEÇİLİ günle biten son 7 gün (eskiden yeniye sıralı)
  const seciliDate = gunDate(seciliTarih);
  const haftaGunleri = Array.from({ length: 7 }, (_, i) =>
    istanbulGunId(new Date(seciliDate.getTime() - (6 - i) * 86_400_000)),
  );
  const haftaBaslangic = tarihAraligi(haftaGunleri[0]!).baslangic;

  // Tek sorgu: 7 günlük pencere → hem günlük detay hem haftalık özet bundan üretilir
  const siparisSnap = await db
    .collectionGroup('siparisler')
    .where('olusturulduAt', '>=', Timestamp.fromDate(haftaBaslangic))
    .where('olusturulduAt', '<=', Timestamp.fromDate(bitis))
    .get();

  const ilgiliTum = siparisSnap.docs.filter((d) =>
    d.ref.path.startsWith(`restoranlar/${restoranId}/`),
  );

  // Ürün→kategori, kategori adları, masa adları (kategori satış + sipariş listesi)
  const [urunlerSnap, kategorilerSnap, masalarSnap] = await Promise.all([
    db.collection(`restoranlar/${restoranId}/urunler`).get(),
    db.collection(`restoranlar/${restoranId}/kategoriler`).get(),
    db.collection(`restoranlar/${restoranId}/masalar`).get(),
  ]);
  const urunKategori = new Map<string, string>();
  urunlerSnap.docs.forEach((d) =>
    urunKategori.set(d.id, (d.data() as { kategoriId?: string }).kategoriId ?? ''),
  );
  const kategoriAd = new Map<string, string>();
  kategorilerSnap.docs.forEach((d) =>
    kategoriAd.set(d.id, (d.data() as { ad?: string }).ad ?? '—'),
  );
  const masaAdMap = new Map<string, string>();
  masalarSnap.docs.forEach((d) =>
    masaAdMap.set(d.id, (d.data() as { ad?: string }).ad ?? '—'),
  );

  // Haftalık ciro: günId → ciro (iptal + rapor dışı hariç)
  const haftaCiro = new Map<string, number>();
  haftaGunleri.forEach((g) => haftaCiro.set(g, 0));

  // ── Seçili gün detay birikimleri ────────────────────────────────────
  let toplamCiro = 0;
  let iptalCiro = 0;
  let teslimSayisi = 0;
  let iptalSayisi = 0;
  let toplamSiparisSayisi = 0; // yalnız rapora dahil
  let haricSayisi = 0;
  let haricCiro = 0;
  const kalemler = new Map<string, KalemRapor>();
  const saatSayisi = new Array<number>(24).fill(0);
  const saatCiro = new Array<number>(24).fill(0);
  const kategoriCiro = new Map<
    string,
    { ad: string; adet: number; ciroKurus: number }
  >();
  const gunSiparisListesi: RaporSiparis[] = [];

  for (const d of ilgiliTum) {
    const s = d.data() as {
      adisyonId?: string;
      masaId?: string;
      gunlukNo?: number;
      durum: SiparisDurumu;
      toplamKurus: number;
      raporDisi?: boolean;
      kalemler: Array<{
        urunId: string;
        ad: string;
        adet: number;
        araToplamKurus: number;
      }>;
      olusturulduAt: Timestamp;
    };
    const dt = s.olusturulduAt.toDate();
    const gunId = istanbulGunId(dt);
    const haric = s.raporDisi === true;
    const iptal = s.durum === 'iptal';

    // Haftalık ciro — tüm 7 gün (iptal ve rapor dışı sayılmaz)
    if (!iptal && !haric) {
      haftaCiro.set(gunId, (haftaCiro.get(gunId) ?? 0) + s.toplamKurus);
    }

    // Bundan sonrası yalnız SEÇİLİ gün detayı
    if (gunId !== seciliTarih) continue;

    const adisyonId = s.adisyonId ?? d.ref.parent.parent?.id ?? '';
    const saat = istFmt({ hour: '2-digit', minute: '2-digit' }).format(dt);
    const ozet = (s.kalemler ?? [])
      .map((k) => `${k.adet}× ${k.ad}`)
      .join(', ');

    gunSiparisListesi.push({
      adisyonId,
      siparisId: d.id,
      gunlukNo: s.gunlukNo ?? 0,
      masaAd: s.masaId ? (masaAdMap.get(s.masaId) ?? '—') : '—',
      durum: s.durum,
      toplamKurus: s.toplamKurus,
      saat,
      raporDisi: haric,
      ozet,
    });

    // Rapor dışı: listede görünür ama hiçbir istatistiğe girmez
    if (haric) {
      haricSayisi++;
      if (!iptal) haricCiro += s.toplamKurus;
      continue;
    }

    toplamSiparisSayisi++;
    if (iptal) {
      iptalSayisi++;
      iptalCiro += s.toplamKurus;
      continue;
    }

    toplamCiro += s.toplamKurus;
    if (s.durum === 'teslim') teslimSayisi++;

    const istSaat = (dt.getUTCHours() + 3) % 24;
    saatSayisi[istSaat] = (saatSayisi[istSaat] ?? 0) + 1;
    saatCiro[istSaat] = (saatCiro[istSaat] ?? 0) + s.toplamKurus;

    for (const k of s.kalemler ?? []) {
      const mevcut = kalemler.get(k.urunId);
      if (mevcut) {
        mevcut.adet += k.adet;
        mevcut.ciroKurus += k.araToplamKurus;
      } else {
        kalemler.set(k.urunId, {
          ad: k.ad,
          adet: k.adet,
          ciroKurus: k.araToplamKurus,
        });
      }
      const katId = urunKategori.get(k.urunId) ?? '';
      const katAd = kategoriAd.get(katId) ?? 'Diğer';
      const kc = kategoriCiro.get(katId) ?? { ad: katAd, adet: 0, ciroKurus: 0 };
      kc.adet += k.adet;
      kc.ciroKurus += k.araToplamKurus;
      kategoriCiro.set(katId, kc);
    }
  }

  // Sipariş listesini saate göre sırala
  gunSiparisListesi.sort((a, b) => a.saat.localeCompare(b.saat));

  const enCokSatan = [...kalemler.values()]
    .sort((a, b) => b.adet - a.adet)
    .slice(0, 10);

  const kategoriler = [...kategoriCiro.values()].sort(
    (a, b) => b.ciroKurus - a.ciroKurus,
  );

  const satilanSiparis = toplamSiparisSayisi - iptalSayisi;
  const ortalamaBilet = satilanSiparis > 0 ? toplamCiro / satilanSiparis : 0;

  // Saatlik ciro — yalnız aktif saatler gösterilsin (sıfır saatler gizlenir)
  const aktifSaatler = saatCiro
    .map((ciro, saat) => ({ saat, ciro, sayi: saatSayisi[saat] ?? 0 }))
    .filter((x) => x.sayi > 0);
  const maxSaatCiro = Math.max(...aktifSaatler.map((x) => x.ciro), 1);

  // Haftalık — düne göre değişim
  const haftaDeger = haftaGunleri.map((g) => haftaCiro.get(g) ?? 0);
  const maxHafta = Math.max(...haftaDeger, 1);
  const bugunCiro = haftaDeger[6] ?? 0;
  const dunCiro = haftaDeger[5] ?? 0;
  const degisimYuzde =
    dunCiro > 0 ? Math.round(((bugunCiro - dunCiro) / dunCiro) * 100) : null;
  const haftaToplam = haftaDeger.reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6 rapor-belge">
      {/* Baskıya özel belge başlığı (ekranda gizli, PDF'te görünür) */}
      <div className="belge-baslik">
        <h1>{restoranAd} — Günlük Rapor</h1>
        <div className="belge-alt">
          {restoranMeta.sehir ? `${restoranMeta.sehir} · ` : ''}
          {istFmt({
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(gunDate(seciliTarih))}
          {' · '}
          Oluşturuldu: {istFmt({ dateStyle: 'short', timeStyle: 'short' }).format(new Date())}
        </div>
      </div>

      <div className="yazdir-gizle space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Günlük Rapor</h1>
          <div className="flex items-center gap-2">
            <YazdirButton />
            <form className="flex items-center gap-2">
              <input
                type="date"
                name="tarih"
                defaultValue={seciliTarih}
                className="rounded-md border bg-background px-2 py-1 text-sm"
              />
              <button
                type="submit"
                className="rounded-md border px-3 py-1 text-sm"
              >
                Göster
              </button>
            </form>
          </div>
        </div>

        {/* Son 7 gün — hızlı erişim */}
        <div className="flex flex-wrap gap-1.5">
          {sonYediGun.map((g, i) => {
            const secili = g === seciliTarih;
            const d = gunDate(g);
            const ustEtiket =
              g === bugunId
                ? 'Bugün'
                : i === 1
                  ? 'Dün'
                  : istFmt({ weekday: 'short' }).format(d);
            const altEtiket = istFmt({ day: '2-digit', month: '2-digit' }).format(d);
            return (
              <Link
                key={g}
                href={`/admin/rapor?tarih=${g}`}
                className={`flex min-w-16 flex-col items-center rounded-md border px-3 py-1.5 text-center text-xs transition ${
                  secili
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="font-medium capitalize">{ustEtiket}</span>
                <span className="tabular-nums opacity-80">{altEtiket}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Özet kartları ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kart
          etiket="Net ciro"
          deger={formatTL(toplamCiro)}
          alt={
            degisimYuzde !== null
              ? `düne göre ${degisimYuzde >= 0 ? '+' : ''}${degisimYuzde}%`
              : undefined
          }
        />
        <Kart
          etiket="Sipariş sayısı"
          deger={`${toplamSiparisSayisi}`}
          alt={`${iptalSayisi} iptal`}
        />
        <Kart etiket="Teslim edilen" deger={`${teslimSayisi}`} />
        <Kart
          etiket="Ortalama bilet"
          deger={formatTL(Math.round(ortalamaBilet))}
        />
      </div>

      {iptalCiro > 0 && (
        <p className="text-xs text-muted-foreground">
          İptal edilen tutar: {formatTL(iptalCiro)} (cirodan düşüldü)
        </p>
      )}
      {haricSayisi > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          {haricSayisi} sipariş rapordan hariç tutuldu
          {haricCiro > 0 ? ` (${formatTL(haricCiro)} sayılmadı)` : ''}.
        </p>
      )}

      {/* ── Haftalık özet ── */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Haftalık ciro (son 7 gün)</h2>
          <span className="text-xs text-muted-foreground">
            Toplam {formatTL(haftaToplam)}
          </span>
        </div>
        <div className="flex items-end justify-between gap-1.5 rounded-lg border bg-card p-3">
          {haftaGunleri.map((g, i) => {
            const ciro = haftaDeger[i] ?? 0;
            const secili = g === seciliTarih;
            const d = gunDate(g);
            return (
              <Link
                key={g}
                href={`/admin/rapor?tarih=${g}`}
                className="group flex flex-1 flex-col items-center gap-1"
                title={`${g} · ${formatTL(ciro)}`}
              >
                <span className="text-[9px] tabular-nums text-muted-foreground">
                  {ciro > 0 ? `₺${Math.round(ciro / 100)}` : ''}
                </span>
                <span className="flex h-24 w-full items-end justify-center">
                  <span
                    className={`w-full max-w-7 rounded-t transition-all ${
                      secili ? 'bg-primary' : 'bg-primary/35 group-hover:bg-primary/60'
                    }`}
                    style={{ height: `${Math.max(2, (ciro / maxHafta) * 100)}%` }}
                  />
                </span>
                <span
                  className={`text-[10px] capitalize ${
                    secili ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {istFmt({ weekday: 'short' }).format(d)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* En çok satan ürünler */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium">En çok satan ürünler</h2>
          {enCokSatan.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              Bu tarihte sipariş yok.
            </p>
          ) : (
            <ul className="space-y-1">
              {enCokSatan.map((k) => (
                <li
                  key={k.ad}
                  className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">{k.ad}</span>
                  <span className="shrink-0 text-right">
                    <span className="tabular-nums font-medium">{k.adet}</span>
                    <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                      {formatTL(k.ciroKurus)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Kategori bazlı satış */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Kategori bazlı satış</h2>
          {kategoriler.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              Bu tarihte satış yok.
            </p>
          ) : (
            <ul className="space-y-1.5 rounded-lg border bg-card p-3">
              {kategoriler.map((k) => {
                const yuzde = toplamCiro > 0 ? (k.ciroKurus / toplamCiro) * 100 : 0;
                return (
                  <li key={k.ad} className="space-y-0.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="min-w-0 truncate">{k.ad}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {formatTL(k.ciroKurus)} · %{Math.round(yuzde)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-sm bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${yuzde}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ── Saatlik ciro ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Saatlik ciro (₺)</h2>
        {aktifSaatler.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
            Bu tarihte satış yok.
          </p>
        ) : (
          <div className="space-y-1 rounded-lg border bg-card p-3">
            {aktifSaatler.map(({ saat, ciro, sayi }) => (
              <div key={saat} className="flex items-center gap-2 text-xs">
                <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
                  {saat.toString().padStart(2, '0')}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-sm bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(ciro / maxSaatCiro) * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right tabular-nums">
                  {formatTL(ciro)}
                </span>
                <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">
                  {sayi} sip.
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Sipariş listesi — rapordan çıkar/geri ekle (ekran-içi araç) ── */}
      <section className="yazdir-gizle space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Siparişler</h2>
          <span className="text-xs text-muted-foreground">
            Denemelik siparişleri rapordan çıkarabilirsin
          </span>
        </div>
        <RaporSiparisListesi siparisler={gunSiparisListesi} />
      </section>

      <p className="yazdir-gizle text-xs text-muted-foreground">
        <Link href="/admin/menu" className="underline">
          Menü
        </Link>
        {' · '}
        <Link href="/admin/masalar" className="underline">
          Masalar
        </Link>
      </p>

      {/* Baskıya özel dipnot (ekranda gizli) */}
      <div className="belge-dipnot">
        {restoranAd} · Bu belge {istFmt({ dateStyle: 'long', timeStyle: 'short' }).format(new Date())} tarihinde Questo tarafından oluşturulmuştur.
      </div>
    </div>
  );
}

function Kart({
  etiket,
  deger,
  alt,
}: {
  etiket: string;
  deger: string;
  alt?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{etiket}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{deger}</div>
      {alt && <div className="text-xs text-muted-foreground">{alt}</div>}
    </div>
  );
}
