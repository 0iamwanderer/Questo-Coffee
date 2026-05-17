# design-reference/

Bu klasör müşteri yüzünün tasarım kaynağı olan **prototip dosyalarını** içerir.
Build'e dahil edilmezler, salt referans amaçlıdır.

| Dosya | Amaç |
|---|---|
| `app.jsx` | Üç ekranlı QR menü prototipi (Landing → Menu → Detail). Renk paleti, tipografi, etkileşimler. |
| `index.html` | Prototipin host'u. |
| `ios-frame.jsx` | iOS 26 cihaz çerçevesi — yalnız dev preview için, üretime girmedi. |
| `tweaks-panel.jsx` | Live-edit paneli — geliştirici aracı, üretim dışı. |

## Prototipten Üretime Aktarılanlar

- **Renk paleti**: OKLch krem + terracotta → HSL eşdeğerlerine çevrildi
  ([src/app/globals.css](../src/app/globals.css)).
- **Tipografi**: Instrument Serif (display) + Manrope (body)
  ([src/app/layout.tsx](../src/app/layout.tsx)).
- **Bottom sheet** ürün detay etkileşimi.
- **Pill / badge** stilleri.

## Çıkarılanlar

- iOS cihaz çerçevesi (üretim mobil tarayıcıda zaten gerçek cihazda çalışır).
- Book-flip Landing → Menu geçişi (mobil UX'i ağırlaştırır, atlandı).
- Tweaks paneli (dev tool).

> Bu dosyaları doğrudan düzenlemek üretim koduna yansımaz; değişiklik
> [src/components/musteri/](../src/components/musteri/) altında yapılır.
