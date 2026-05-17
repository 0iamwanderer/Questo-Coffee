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

## Faz Planı

- [x] Faz 0 — Konfig iskeleti
- [x] Faz 1 — Tipler & temel altyapı
- [ ] Faz 2 — Güvenlik & rol (firestore.rules, session, middleware, kasa girişi)
- [ ] Faz 3 — Müşteri akışı (menü, sepet, sipariş transaction)
- [ ] Faz 4 — Kasa (Kanban, adisyon paneli, durum güncelleme)
- [ ] Faz 5 — Admin (menü/masa CRUD, QR PDF)
