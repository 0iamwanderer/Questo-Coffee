# Questo — QR Kodlu Sipariş ve Adisyon Sistemi

Tek restoran için, müşterinin masadaki QR'ı okutup mobil tarayıcıdan sipariş
verdiği, kasanın canlı olarak takip edip kapattığı sistem.

## Teknoloji

- **Frontend:** Next.js 15 (App Router) · TypeScript (strict) · Tailwind +
  shadcn/ui · Zustand (sepet)
- **Backend:** Firebase Firestore + Auth + App Check; güvenilir mutasyonlar
  Admin SDK ile Next.js route handler'lar üzerinden
- **Para:** Tüm tutarlar **kuruş (integer)** olarak saklanır
- **Sipariş güvenliği:** Müşteri yalnızca `{urunId, adet}` gönderir; toplam
  sunucuda menüden okunarak hesaplanır, snapshot olarak yazılır

## Klasör Yapısı (üst seviye)

```
src/
  app/              # Next.js App Router (m/[token], kasa, admin, api)
  components/       # UI parçaları (musteri, kasa, admin, ui)
  lib/
    firebase/       # client.ts, admin.ts, converters.ts
    auth/           # session, guard, anon
    siparis/        # transactional sipariş servisi
    utils/          # para, token, zod-semalar, hata
  stores/           # zustand sepet
  types/            # domain modelleri
```

## Kurulum

```bash
npm install
cp .env.example .env.local   # değerleri doldur
npm run dev
```

## Emulator Akışı (Geliştirme)

Firebase emulators ile (Firebase project veya kredi kartı gerektirmez):

```bash
# 1. Emulator'ları başlat (ayrı terminal)
npm run emulators

# 2. Diğer terminalde demo veriyi seed et
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
NEXT_PUBLIC_RESTORAN_ID=demo-1 \
npm run seed

# 3. Next.js'i emulator değişkenleri ile çalıştır
FIRESTORE_EMULATOR_HOST=localhost:8080 \
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
npm run dev
```

Emulator UI: <http://localhost:4000>

> Not: PowerShell'de değişken atamak için `$env:FIRESTORE_EMULATOR_HOST = 'localhost:8080'` kullanın.

## Üretim'e seed (opsiyonel)

```bash
node --env-file=.env.local scripts/seed.mjs
# veya:
npm run seed
```

`.env.local`'da `SEED_SAHIP_EMAIL` ayarlıysa, o e-posta ile yaratılmış Auth
kullanıcısına otomatik `kasiyer + sahip` claim'i atanır.

## İlk Kasiyer/Sahip Atama (bir kerelik)

1. Firebase Console > Authentication üzerinden e-posta/şifre ile bir kullanıcı oluştur.
2. `.env.local` içinde `ADMIN_SETUP_TOKEN` rastgele bir string olarak ayarla.
3. Dev sunucusu açıkken:
   ```bash
   curl -X POST http://localhost:3000/api/admin/rol \
     -H 'content-type: application/json' \
     -d '{"setupToken":"<token>","email":"sahip@kafem.com","sahip":true}'
   ```
4. Kullanıcı `/kasa/giris` üzerinden oturum açabilir.
5. Güvenlik için `ADMIN_SETUP_TOKEN`'ı sonradan `.env.local`'dan kaldır.

## Güvenlik — Üretim Notu

**Idempotency TTL'i etkinleştir** (Firestore Console > Indexes > TTL):
- Koleksiyon: `idempotency`
- Field: `expireAt`

Bu, idempotency dokümanlarının 24 saat sonra otomatik silinmesini sağlar.
Etkinleştirilmezse koleksiyon zamanla büyür.

**Rate limit:** Her müşteri Anon UID için 60 saniyede 10 sipariş. Aşılırsa
HTTP 429 döner. Limiti `lib/siparis/servis.ts` içinden değiştirebilirsin.

**Audit log:** Tüm admin yazımları `restoranlar/{R}/kullaniciAksiyonlari`
altına yazılır. Yalnız sahip okuyabilir (Firestore rules).

## Cloud Functions (SLA Bildirim)

`functions/` altında 2 fonksiyon:
- **slaKontrol** — her 5 dk'da bir çalışır. `yeni` durumda 10+ dk veya
  `hazirlaniyor` durumda 15+ dk kalmış siparişlere `slaUyari: true` yazar.
  Kasa Kanban'da kırmızı "Geç" rozeti olarak görünür.
- **slaUyariniTemizle** — sipariş ileri durumlara geçtiğinde `slaUyari` alanını
  siler.

Deploy (Firebase Blaze planı gereklidir):

```bash
cd functions && npm install && npm run build && cd ..
firebase functions:params:set RESTORAN_ID
firebase deploy --only functions
```

Emulator'da:

```bash
cd functions && npm run build && cd ..
firebase emulators:start --only firestore,functions,auth
```

## Faz Planı

- [x] Faz 0 — Konfig iskeleti
- [x] Faz 1 — Tipler & temel altyapı
- [x] Faz 2 — Güvenlik & rol (firestore.rules, session, middleware, kasa girişi)
- [x] Faz 3 — Müşteri akışı (menü, sepet, sipariş transaction)
- [x] Faz 4 — Kasa (Kanban, adisyon paneli, durum güncelleme)
- [x] Faz 5 — Admin (menü/masa CRUD, QR PDF)
- [x] Faz 6 — Operasyonel + Cloud Functions (SLA bildirim)
- [x] Faz 7 — Güvenlik sertleştirme (rate limit + idempotency + audit log)
