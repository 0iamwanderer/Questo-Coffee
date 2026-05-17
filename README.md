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

## Faz Planı

- [x] Faz 0 — Konfig iskeleti
- [x] Faz 1 — Tipler & temel altyapı
- [x] Faz 2 — Güvenlik & rol (firestore.rules, session, middleware, kasa girişi)
- [x] Faz 3 — Müşteri akışı (menü, sepet, sipariş transaction)
- [x] Faz 4 — Kasa (Kanban, adisyon paneli, durum güncelleme)
- [x] Faz 5 — Admin (menü/masa CRUD, QR PDF)
