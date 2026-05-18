'use client';

interface FlyOpts {
  /** Kaynak görsel/buton DOM elementinin bounding rect'i */
  fromRect: DOMRect;
  imgUrl?: string;
  /** Görsel yoksa monogram harfi */
  harf?: string;
}

/**
 * Bir ürün sepete eklenirken görseli sepet pill'ine kavisli yörüngede uçurur.
 * Hedef: sayfada `[data-sepet-target]` attribute'lu element (SepetCekmecesi).
 * Pill DOM'da yoksa sessizce skip eder.
 *
 * Vanilla DOM ile yapılır: React state/store gerekmez, render yarışı yok.
 */
export const flyToCart = (opts: FlyOpts): void => {
  if (typeof document === 'undefined') return;

  const sepetEl = document.querySelector<HTMLElement>('[data-sepet-target]');
  if (!sepetEl) return;
  const toRect = sepetEl.getBoundingClientRect();

  const node = document.createElement('div');
  node.setAttribute('aria-hidden', 'true');
  node.style.position = 'fixed';
  node.style.left = `${opts.fromRect.left}px`;
  node.style.top = `${opts.fromRect.top}px`;
  node.style.width = `${opts.fromRect.width}px`;
  node.style.height = `${opts.fromRect.height}px`;
  node.style.borderRadius = '16px';
  node.style.overflow = 'hidden';
  node.style.zIndex = '60';
  node.style.pointerEvents = 'none';
  node.style.willChange = 'transform, opacity';
  node.style.boxShadow =
    '0 18px 48px -18px hsl(22 35% 16% / 0.45), 0 6px 16px -6px hsl(22 35% 16% / 0.25)';

  const fromCx = opts.fromRect.left + opts.fromRect.width / 2;
  const fromCy = opts.fromRect.top + opts.fromRect.height / 2;
  const toCx = toRect.left + toRect.width / 2;
  const toCy = toRect.top + toRect.height / 2;
  node.style.setProperty('--dx', `${toCx - fromCx}px`);
  node.style.setProperty('--dy', `${toCy - fromCy}px`);

  if (opts.imgUrl) {
    const img = document.createElement('img');
    img.src = opts.imgUrl;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.alt = '';
    node.appendChild(img);
  } else {
    node.style.background =
      'radial-gradient(70% 60% at 50% 35%, hsl(var(--accent)) 0%, hsl(var(--secondary)) 100%)';
    node.style.display = 'flex';
    node.style.alignItems = 'center';
    node.style.justifyContent = 'center';
    const span = document.createElement('span');
    span.textContent = (opts.harf ?? '?').toUpperCase();
    span.style.fontFamily =
      'var(--font-serif), Georgia, "Times New Roman", serif';
    span.style.fontWeight = '400';
    span.style.fontSize = `${Math.floor(opts.fromRect.width * 0.55)}px`;
    span.style.lineHeight = '1';
    span.style.color = 'hsl(14 50% 30% / 0.75)';
    node.appendChild(span);
  }

  node.classList.add('anim-fly-to-cart');
  document.body.appendChild(node);

  const sil = () => node.remove();
  node.addEventListener('animationend', sil, { once: true });
  // Güvenlik ağı — animasyon tetiklenmezse yine de temizle
  setTimeout(sil, 1200);

  // Sepet pill'in hedefe varış anında küçük bounce
  setTimeout(() => {
    sepetEl.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.06)' },
        { transform: 'scale(1)' },
      ],
      { duration: 260, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    );
  }, 600);
};
