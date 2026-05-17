/* ============================================================
   Questo · QR Menü prototipi (tek bileşen)
   - Landing  → Menu  → Detail (bottom sheet)
   - State ile yönetilir, sayfa yenilenmez
   - Mobile-first; iOS çerçevesinde sunulur
   ============================================================ */

const { useState, useEffect, useRef, useMemo } = React;

/* ---------- Mock menü verisi -------------------------------- */
const MENU = [
  {
    id: "kahveler",
    name: "Kahveler",
    short: "Tek menşeli, taze kavrum",
    items: [
      { id: "filtre",    name: "Filtre Kahve",    price: 75,  desc: "Etiyopya Yirgacheffe, V60 demleme. Çiçeksi, hafif asidik.", long: "Doğu Afrika'nın yüksek rakımlı bahçelerinden gelen tek menşeli çekirdek; her hafta küçük partilerde kavrulur. V60 ile 92°C suda 3 dakika demlenir.", tag: "Tek menşeli", swatch: "from-[#7a4a2b] to-[#3b2618]" },
      { id: "espresso",  name: "Espresso",        price: 55,  desc: "Tek shot, koyu kavrum. Kakao ve fındık notaları.", long: "İki farklı çekirdeğin harmanı. 9 bar basınçta 25 saniye ekstraksiyon. Yoğun crema, uzun kalıcı tat.", tag: "Sade", swatch: "from-[#5a3320] to-[#2b1810]" },
      { id: "cortado",   name: "Cortado",         price: 85,  desc: "Çift shot espresso + bir parmak buharlı süt.", long: "İspanyol/Latin köklü; espresso ile sütün 1:1 buluştuğu denge noktası. Köpük minimal, tat keskin.", tag: "Dengeli", swatch: "from-[#a07252] to-[#5a3a23]" },
      { id: "cappuccino",name: "Cappuccino",      price: 95,  desc: "Klasik İtalyan oranı, ipeksi mikro köpük.",       long: "1/3 espresso, 1/3 süt, 1/3 köpük. 65°C'ye getirilmiş tam yağlı sütle hazırlanır.", tag: "Klasik", swatch: "from-[#b48a66] to-[#7a4f30]" },
      { id: "flatwhite", name: "Flat White",      price: 95,  desc: "Avustralya tarzı, ince mikro köpüklü süt.",       long: "Çift ristretto üzerine ince dokulu süt. Cappuccino'ya göre daha az köpük, daha yoğun kahve karakteri.", tag: "Yoğun", swatch: "from-[#c5a07c] to-[#85593a]" },
      { id: "turk",      name: "Türk Kahvesi",    price: 60,  desc: "Bakır cezve, orta şekerli. Yanında lokum.",       long: "Geleneksel taş değirmende öğütülmüş, közde pişirilmiş. Az / orta / şekerli olarak seçilebilir.", tag: "Geleneksel", swatch: "from-[#4a2e1e] to-[#1f120a]" },
    ],
  },
  {
    id: "soguk",
    name: "Soğuk İçecekler",
    short: "Yaza ve molalara dair",
    items: [
      { id: "coldbrew",  name: "Cold Brew",          price: 105, desc: "16 saatlik soğuk demleme. Pürüzsüz, tatlımsı.", long: "Kaba çekilmiş çekirdek, 12-16 saat boyunca soğuk suda demlenir. Doğal tatlılık, düşük asidite.", tag: "16 saat", swatch: "from-[#3a2415] to-[#15100a]" },
      { id: "icedlatte", name: "Buzlu Latte",        price: 105, desc: "Espresso, soğuk süt, bolca buz.",               long: "Çift shot espresso doğrudan buzun üzerine; ardından soğuk tam yağlı süt.", tag: "Klasik", swatch: "from-[#cdb18e] to-[#8a6741]" },
      { id: "espresso-tonic", name: "Espresso Tonik",price: 115, desc: "Espresso + tonik + portakal kabuğu.",           long: "Tonik suyun üzerine yavaşça dökülmüş espresso. Ferahlatıcı, hafif acımsı, narenciye finişli.", tag: "Yenilik", swatch: "from-[#dcc89a] to-[#967a3c]" },
      { id: "limonata",  name: "Ev Limonatası",      price: 75,  desc: "Sıkma limon, nane, fesleğen, az şeker.",        long: "Günlük hazırlanır. Sıkma limon, taze fesleğen yaprakları, çubuk tarçınla ısıtılmış basit şurup.", tag: "Ev yapımı", swatch: "from-[#e8e7a8] to-[#a4a155]" },
      { id: "matcha",    name: "Matcha Latte",       price: 115, desc: "Tören sınıfı matcha + badem sütü.",             long: "Uji bölgesinden seramonyal matcha, bambu çırpıcıyla köpürtülür. Sıcak ya da buzlu sunulur.", tag: "Vegan", swatch: "from-[#a8c08a] to-[#5e7a3f]" },
    ],
  },
  {
    id: "tatlilar",
    name: "Tatlılar",
    short: "Şefin günlük seçkisi",
    items: [
      { id: "sansebastian", name: "San Sebastian",      price: 140, desc: "Yanık peynirli cheesecake, çatlak yüzey.",      long: "Bask bölgesi tarifi: yüksek ısıda pişirilmiş, dışı karamelize, içi neredeyse akışkan.", tag: "Ev yapımı", swatch: "from-[#d9b27f] to-[#7c4f25]" },
      { id: "brownie",      name: "Sıcak Brownie",     price: 95,  desc: "Akışkan ortalı, vanilyalı dondurma ile.",        long: "%70 bitter çikolata, az un. Servis öncesi ısıtılır; üzerine ev yapımı vanilyalı dondurma.", tag: "Sıcak", swatch: "from-[#4e2e1f] to-[#1a0e07]" },
      { id: "tahin",        name: "Tahinli Kurabiye",  price: 45,  desc: "Susam ve pekmez ile, ev yapımı.",                long: "Hafif tuzlu, kıtırımsı dış, lokum gibi iç. Pekmez ve karamelize susam ile süslenir.", tag: "Ev yapımı", swatch: "from-[#c8a26a] to-[#7a5a2e]" },
      { id: "tiramisu",     name: "Tiramisu",          price: 135, desc: "Mascarpone, espresso, sade kakao.",              long: "Bardakta sunulur. Espresso emdirilmiş kedidili üzerine mascarpone kreması, üstte acı kakao.", tag: "Klasik", swatch: "from-[#b08762] to-[#5f3e22]" },
      { id: "mevsim",       name: "Mevsim Pastası",    price: 110, desc: "Şefin günlük seçimi — bugün ne çıkacak?",        long: "Mutfak ekibinin günlük yaptığı pasta; bugünkü seçim için garsona danışın.", tag: "Günlük", swatch: "from-[#e3b1a4] to-[#9a5c4c]" },
    ],
  },
  {
    id: "atistirmalik",
    name: "Atıştırmalıklar",
    short: "Hafif öğünler ve ekşi maya",
    items: [
      { id: "avokado",   name: "Avokado Tost",          price: 165, desc: "Ekşi maya ekmek, kiraz domates, pul biber.", long: "El açımı ekşi maya ekmek üzerine ezilmiş avokado, kiraz domates, sumak ve limon yağı.", tag: "Vegan opsiyonu", swatch: "from-[#bcc88b] to-[#5d7038]" },
      { id: "sucuk",     name: "Sucuklu Yumurta",       price: 155, desc: "Köy yumurtası, fermente fıçı sucuğu.",      long: "Küçük dökme demir tavada servis edilir. İki köy yumurtası, ince dilim fermente sucuk, taze kekik.", tag: "Sıcak", swatch: "from-[#a44a30] to-[#5b2113]" },
      { id: "granola",   name: "Granola Kase",          price: 145, desc: "Yulaf, fındık, mevsim meyveleri, yoğurt.",  long: "Ev yapımı pekmezli granola, süzme yoğurt, mevsim meyveleri ve bir kaşık çiğ bal.", tag: "Sağlıklı", swatch: "from-[#e8d4a6] to-[#9a7d3e]" },
      { id: "simit",     name: "Simit & Beyaz Peynir",  price: 95,  desc: "Sıcak simit, beyaz peynir, zeytin, domates.", long: "Günlük fırından gelen simit, ezine peyniri, gemlik zeytin, kütür kütür salatalık ve domates.", tag: "Geleneksel", swatch: "from-[#d8b777] to-[#8a6428]" },
      { id: "mantar",    name: "Mantar Çorbası",        price: 125, desc: "Kuru porçini, krema ve kekik ile.",          long: "Kuru porçini ve taze kestane mantarıyla yapılır, krema ile kıvam alır. Üzerine kavrulmuş kekik.", tag: "Sıcak", swatch: "from-[#9b8870] to-[#4a3d2d]" },
    ],
  },
];

/* ---------- Küçük yardımcı ikon bileşenleri ----------------- */
/* Lucide yerine, paketli ve sade SVG'ler — okları kalem strokeli */
const Icon = {
  ArrowLeft: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
    </svg>
  ),
  ArrowRight: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  ),
  X: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  ),
  Bell: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  Spark: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  ),
};

/* ---------- Ürün görseli (placeholder) ---------------------- */
/* Her ürün için kategorisine uygun renk degradesi + ürün adının
   ilk harfini büyük serif olarak yerleştiren placeholder kart. */
function ProductImage({ item, large = false }) {
  return (
    <div className={`relative h-full w-full overflow-hidden ph-stripes bg-gradient-to-br ${item.swatch} ${large ? "rounded-2xl" : "rounded-xl"}`}>
      <div className="absolute inset-0 flex items-end justify-end p-2">
        <span className={`font-display text-white/85 leading-none ${large ? "text-7xl" : "text-3xl"}`}>
          {item.name.charAt(0)}
        </span>
      </div>
      {/* hafif soft-light vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 30% 10%, rgba(255,255,255,.22), transparent 50%)" }} />
    </div>
  );
}

/* ---------- Landing ekranı ---------------------------------- */
function Landing({ onEnter, tweaks }) {
  return (
    <div
      className="relative flex h-full flex-col anim-screen"
      style={{ background: "var(--bg)", paddingTop: 44 }}
    >
      {/* Üst etiket: masa numarası */}
      <div className="flex items-center justify-between px-6 pt-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--ink-mute)" }}>
          <span className="inline-block h-1 w-1 rounded-full" style={{ background: "var(--accent)" }} />
          Masa 07
        </div>
        <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--ink-mute)" }}>
          {tweaks.locale}
        </div>
      </div>

      {/* Ortada büyük tipografik logo */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* Marka logosu — yuvarlak çerçeveye maskelenmiş */}
        <div
          className="relative overflow-hidden rounded-full"
          style={{
            width: 240,
            height: 240,
            boxShadow: "0 18px 48px -18px rgba(40,20,10,0.45), 0 4px 12px -4px rgba(40,20,10,0.20)",
          }}
        >
          <img
            src="images/questo-logo.jpg"
            alt={`${tweaks.brand} logo`}
            className="h-full w-full object-cover"
            draggable="false"
          />
          {/* yumuşak iç parlaklık */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(70% 60% at 50% 35%, rgba(255,225,180,0.18), transparent 70%)",
              mixBlendMode: "soft-light",
            }}
          />
        </div>

        {/* alt başlık */}
        <div className="mt-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.32em]" style={{ color: "var(--ink-soft)" }}>
          <span className="h-px w-6" style={{ background: "var(--line)" }} />
          {tweaks.subtitle}
          <span className="h-px w-6" style={{ background: "var(--line)" }} />
        </div>

        {/* Karşılama */}
        <p className="mt-8 max-w-[300px] text-[15px] leading-[1.55]" style={{ color: "var(--ink-soft)" }}>
          {tweaks.welcome}
        </p>

        {/* Buton */}
        <button
          onClick={onEnter}
          className="group mt-8 inline-flex w-full max-w-[300px] items-center justify-between rounded-full px-6 py-4 text-[15px] font-medium transition active:scale-[0.98]"
          style={{ background: "var(--ink)", color: "var(--surface)" }}
        >
          <span>Menüyü Gör</span>
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:translate-x-1"
            style={{ background: "var(--accent)" }}
          >
            <Icon.ArrowRight className="h-4 w-4" />
          </span>
        </button>

        {/* Alt bilgi */}
        <p className="mt-5 text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--ink-mute)" }}>
          Servis · 08:00 – 23:00
        </p>
      </div>

      {/* Alt zarif dipnot */}
      <div className="flex items-center justify-center gap-2 pb-6 text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--ink-mute)" }}>
        <span>EST. 2024</span>
        <span className="h-px w-3" style={{ background: "var(--line)" }} />
        <span>İstanbul</span>
      </div>
    </div>
  );
}

/* ---------- Tek kategori sayfası (kitap sayfası içeriği) ---- */
/* Menu kabuğunun içinde sürüklenebilir bir "sayfa" — başlık + ürün listesi.
   React.memo ile sarmalı, çünkü sayfa şeritleri içinde aynı içerik birden
   çok kez render edilir — gereksiz yeniden çizimleri önlüyoruz. */
const NOOP = () => {};
const CategoryPage = React.memo(function CategoryPage({ cat, onSelect }) {
  return (
    <div className="flex h-full flex-col" style={{ background: "var(--bg-page)" }}>
      {/* Kategori başlığı */}
      <div className="px-5 pb-3 pt-1">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[34px] leading-none" style={{ color: "var(--ink)" }}>
            {cat.name}
          </h2>
          <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--ink-mute)" }}>
            {String(cat.items.length).padStart(2, "0")} ürün
          </span>
        </div>
        <p className="mt-1 text-[13px]" style={{ color: "var(--ink-mute)" }}>{cat.short}</p>
      </div>

      {/* Ürün listesi */}
      <div className="flex-1 overflow-y-auto pb-6">
        <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
          {cat.items.map((item, i) => (
            <li key={item.id} style={{ borderColor: "var(--line)" }}>
              <button
                onClick={() => onSelect(item)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition active:bg-black/[0.02]"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "var(--ink-mute)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {item.tag && (
                      <span
                        className="rounded-full px-2 py-[2px] text-[10px] uppercase tracking-[0.12em]"
                        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                      >
                        {item.tag}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 font-display text-[22px] leading-tight" style={{ color: "var(--ink)" }}>
                    {item.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-[1.5]" style={{ color: "var(--ink-soft)" }}>
                    {item.desc}
                  </p>
                  <div className="mt-2 text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                    {item.price} <span className="text-[12px]" style={{ color: "var(--ink-mute)" }}>₺</span>
                  </div>
                </div>
                <div className="h-[84px] w-[84px] shrink-0">
                  <ProductImage item={item} />
                </div>
              </button>
            </li>
          ))}
        </ul>

        <div className="px-5 pt-6 text-center text-[11px] uppercase tracking-[0.22em]" style={{ color: "var(--ink-mute)" }}>
          alerjenler için garsona danışınız
        </div>
      </div>
    </div>
  );
});

/* ---------- Menü ekranı (gerçek kitap-sayfası flip) -------- */
function Menu({ onBack, onSelect, tweaks }) {
  const [activeIdx, setActiveIdx] = useState(0);

  /* flip:
        null   → boştayız, yalnız aktif sayfa görünür
        { dir, progress, animating, fromIdx, toIdx, edge }
          dir         : 'next' | 'prev'
          progress    : 0..1, 0 = başlangıç, 1 = tamamlanmış
          animating   : true ise CSS transition aktif
          fromIdx/toIdx: kaynak ve hedef kategori
          edge        : true ise kenar rubber-band (kategori sonu)
  */
  const [flip, setFlip] = useState(null);
  /* Sahne genişliği — şerit pozisyonlarını piksel cinsinden hesaplamak için */
  const [stageW, setStageW] = useState(0);

  const gestureRef = useRef({ active: false });
  const stageRef = useRef(null);
  const tabRefs = useRef({});
  const tabsScrollerRef = useRef(null);
  const flipRef = useRef(null);

  /* setFlip helper'ı — son state'i her zaman bilelim diye ref ile takip */
  const updateFlip = (next) => {
    flipRef.current = typeof next === "function" ? next(flipRef.current) : next;
    setFlip(flipRef.current);
  };

  /* Üst sekmede aktifi ortala */
  useEffect(() => {
    const el = tabRefs.current[MENU[activeIdx].id];
    const scroller = tabsScrollerRef.current;
    if (el && scroller) {
      const target = el.offsetLeft - (scroller.clientWidth - el.offsetWidth) / 2;
      scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }
  }, [activeIdx]);

  /* requestAnimationFrame ile sürüş — clip-path + transform-origin değişen
     bir animasyonu CSS transition'a bırakamayız; ilerlemeyi her karede biz
     güncelliyoruz, böylece kıvrım çizgisi yumuşakça hareket eder. */
  const rafRef = useRef(null);
  const animateTo = (target, onDone) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = flipRef.current?.progress ?? 0;
    const t0 = performance.now();
    const dur = 540;
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = ease(t);
      const p = start + (target - start) * e;
      updateFlip((prev) => prev ? { ...prev, progress: p, animating: true } : prev);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else { rafRef.current = null; onDone && onDone(); }
    };
    rafRef.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  /* Sahne genişliğini ölç + viewport değişimini izle */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStageW(el.clientWidth);
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    } else {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
  }, []);

  /* Sekme veya alt nokta tıklanınca tek-yaprak animasyonu ile geç */
  const flipTo = (targetIdx) => {
    if (targetIdx === activeIdx || flip) return;
    if (targetIdx < 0 || targetIdx >= MENU.length) return;
    const dir = targetIdx > activeIdx ? "next" : "prev";
    updateFlip({
      dir, progress: 0, animating: false,
      fromIdx: activeIdx, toIdx: targetIdx, edge: false,
    });
    /* başlangıç state'i DOM'a yazılsın diye bir frame bekle */
    requestAnimationFrame(() => {
      animateTo(1, () => {
        setActiveIdx(targetIdx);
        updateFlip(null);
      });
    });
  };

  /* ----- Pointer jest yönetimi ----- */
  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (flipRef.current?.animating) return; /* snap esnasında yakalama */
    gestureRef.current = {
      active: true, decided: false,
      startX: e.clientX, startY: e.clientY, startT: Date.now(),
      flipDir: null, edge: false,
    };
  };

  const onPointerMove = (e) => {
    const g = gestureRef.current;
    if (!g.active) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;

    if (!g.decided) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        g.decided = true;
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
      } else {
        g.active = false;
        return;
      }
    }

    const w = stageRef.current?.clientWidth || 360;

    /* Yön ilk hareket anında karara bağlanır */
    if (!g.flipDir) {
      if (dx < 0) {
        g.flipDir = "next";
        if (activeIdx >= MENU.length - 1) g.edge = true;
      } else if (dx > 0) {
        g.flipDir = "prev";
        if (activeIdx <= 0) g.edge = true;
      } else return;
    }

    let p;
    if (g.flipDir === "next") p = Math.max(0, Math.min(1, -dx / w));
    else                       p = Math.max(0, Math.min(1, dx / w));
    if (g.edge) p = Math.min(0.12, p * 0.4); /* rubber-band */

    const fromIdx = activeIdx;
    const toIdx = g.edge ? activeIdx
      : g.flipDir === "next" ? activeIdx + 1 : activeIdx - 1;

    updateFlip({
      dir: g.flipDir, progress: p, animating: false,
      fromIdx, toIdx, edge: g.edge,
    });
  };

  const onPointerUp = (e) => {
    const g = gestureRef.current;
    if (!g.active) return;
    g.active = false;
    if (!g.decided) return;
    const cur = flipRef.current;
    if (!cur) return;

    /* Kenarda boş yere çekildiyse geri yaylan */
    if (cur.edge) {
      animateTo(0, () => updateFlip(null));
      return;
    }

    const dx = e.clientX - g.startX;
    const dt = Math.max(1, Date.now() - g.startT);
    const vel = dx / dt; /* px/ms */

    const shouldComplete =
      cur.progress > 0.42 ||
      (cur.dir === "next" && vel < -0.45) ||
      (cur.dir === "prev" && vel >  0.45);

    if (shouldComplete) {
      animateTo(1, () => {
        setActiveIdx(cur.toIdx);
        updateFlip(null);
      });
    } else {
      animateTo(0, () => updateFlip(null));
    }
  };

  /* ----- Akıcı tek-yaprak render -----
     Tek bir sayfa omurgası (sol kenar) etrafında 0° → 180° döner.
     Kıvrılma hissi sayfa yüzeyindeki gradient ile verilir — şerit
     kesintisi olmadan tamamen akıcı bir kâğıt çevirme görünür. */
  let beneathIdx = activeIdx;
  let flipIdx    = null;
  let rotY       = 0;
  if (flip) {
    if (flip.dir === "next") {
      beneathIdx = flip.toIdx;
      flipIdx    = flip.fromIdx;
      rotY       = -180 * flip.progress;        /* 0 → -180 */
    } else {
      beneathIdx = flip.fromIdx;
      flipIdx    = flip.toIdx;
      rotY       = -180 * (1 - flip.progress);  /* -180 → 0 */
    }
  }

  const absRot = Math.abs(rotY);
  const lift   = Math.sin(absRot * Math.PI / 180);             /* 0..1, 90°'de tepe */
  const curlFront = absRot < 90;                                /* ön yüz mü görünür? */

  return (
    <div className="flex h-full flex-col anim-screen" style={{ background: "var(--bg-page)", paddingTop: 44 }}>
      {/* Üst gezinme çubuğu */}
      <header className="flex items-center justify-between px-4 pt-3 pb-2">
        <button
          onClick={onBack}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95"
          style={{ background: "var(--surface)", color: "var(--ink)", boxShadow: "0 1px 0 rgba(0,0,0,0.03)" }}
          aria-label="Ana sayfaya dön"
        >
          <Icon.ArrowLeft className="h-[18px] w-[18px]" />
        </button>

        <div className="text-center leading-tight">
          <div className="font-display text-[20px]" style={{ color: "var(--ink)" }}>{tweaks.brand}</div>
          <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--ink-mute)" }}>
            Menü · Masa 07
          </div>
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95"
          style={{ background: "var(--surface)", color: "var(--ink)", boxShadow: "0 1px 0 rgba(0,0,0,0.03)" }}
          aria-label="Ara"
        >
          <Icon.Search className="h-[18px] w-[18px]" />
        </button>
      </header>

      {/* Kategori sekmeleri (hızlı atlama) */}
      <nav className="relative">
        <div ref={tabsScrollerRef} className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2 pt-1">
          {MENU.map((c, i) => {
            const active = i === activeIdx;
            return (
              <button
                key={c.id}
                ref={(el) => (tabRefs.current[c.id] = el)}
                onClick={() => flipTo(i)}
                className="whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition"
                style={{
                  background: active ? "var(--ink)" : "transparent",
                  color: active ? "var(--surface)" : "var(--ink-soft)",
                  border: active ? "1px solid var(--ink)" : "1px solid var(--line)",
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-1.5 pb-2">
          {MENU.map((c, i) => (
            <button
              key={c.id}
              onClick={() => flipTo(i)}
              className="h-1 rounded-full transition-all"
              style={{
                width: i === activeIdx ? 18 : 4,
                background: i === activeIdx ? "var(--ink)" : "var(--line)",
              }}
              aria-label={`Sayfa ${i + 1}`}
            />
          ))}
        </div>
      </nav>

      {/* Kitap sahnesi: perspective ile 3D alan */}
      <div
        ref={stageRef}
        className="relative flex-1 overflow-hidden select-none"
        style={{ perspective: 1800, perspectiveOrigin: "50% 45%", touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Arkadaki sayfa — flip yokken yalnız bu görünür ve etkileşimlidir */}
        <div
          className="absolute inset-0"
          style={{
            background: "var(--bg-page)",
            pointerEvents: flip ? "none" : "auto",
          }}
        >
          <CategoryPage cat={MENU[beneathIdx]} onSelect={onSelect} />
        </div>

        {/* Çevrilen yaprak — N şeride bölünmüş, silindirik kıvrım */}
        {flip && flipIdx != null && stageW > 0 && (
          <div
            className="absolute inset-0"
            style={{
              transformStyle:        "preserve-3d",
              WebkitTransformStyle:  "preserve-3d",
              pointerEvents: "none",
            }}
          >
            {strips.map((s) => {
              /* Her şeridin kendi açısına bağlı parlaklığı —
                 daha eğik şerit, daha karanlık (kıvrım gölgesi) */
              const aRad = s.angle * Math.PI / 180;
              const tilt = Math.abs(Math.sin(aRad));
              const brightness = 1 - 0.30 * tilt;
              return (
                <div
                  key={s.i}
                  style={{
                    position: "absolute",
                    left: 0, top: 0, height: "100%",
                    width: s.w + 0.6,                      /* hafif örtüşme — şeritler arasında çatlak olmasın */
                    transform: `translate3d(${s.X}px, 0, ${s.Z}px) rotateY(${s.angle}deg)`,
                    transformOrigin: "0 50%",
                    transformStyle:        "preserve-3d",
                    WebkitTransformStyle:  "preserve-3d",
                    overflow: "hidden",
                    backfaceVisibility:       "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    filter: `brightness(${brightness})`,
                    background: "var(--bg-page)",
                    willChange: "transform",
                  }}
                >
                  {/* Şeridin gösterdiği dilim — tüm sayfa içerden negatif sol konumla kaydırılıyor */}
                  <div
                    style={{
                      position: "absolute",
                      left: -s.i * s.w,
                      top: 0,
                      width: stageW,
                      height: "100%",
                    }}
                  >
                    <CategoryPage cat={MENU[flipIdx]} onSelect={NOOP} />
                  </div>
                </div>
              );
            })}

            {/* Genel düşürülmüş gölge — kıvrılan yaprağın altta yatan sayfaya
                bıraktığı yumuşak gölge (curlP=0..1 arttıkça koyulaşır) */}
            {curlP > 0 && curlP < 1 && (
              <div
                className="pointer-events-none absolute inset-y-0"
                style={{
                  left: 0,
                  width: "100%",
                  background: `radial-gradient(ellipse 80% 60% at 10% 50%, rgba(20,12,6,${0.15 * Math.sin(curlP * Math.PI)}) 0%, transparent 60%)`,
                  transform: "translateZ(0.1px)",
                }}
              />
            )}
          </div>
        )}

        {/* Omurga çizgisi */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[2px]"
          style={{ background: "linear-gradient(to right, rgba(40,25,15,0.18), transparent)" }}
        />

        <SwipeHint />
      </div>
    </div>
  );
}

/* Küçük sürükleme ipucu */
function SwipeHint() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 3600);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div
      className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] anim-fade"
      style={{
        background: "rgba(20,15,10,0.78)",
        color: "rgba(255,253,246,0.92)",
        backdropFilter: "blur(8px)",
      }}
    >
      ← sayfayı çevirmek için kaydır →
    </div>
  );
}

/* ---------- Ürün detay (bottom sheet) ----------------------- */
function Detail({ item, onClose }) {
  // Kart kapanırken animasyon
  const [closing, setClosing] = useState(false);
  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 240);
  };
  return (
    <div
      className="fixed inset-0 z-40 flex items-end anim-fade"
      style={{ background: "rgba(20,15,10,0.45)", animationDirection: closing ? "reverse" : "normal" }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full overflow-hidden ${closing ? "" : "anim-sheet"}`}
        style={{
          background: "var(--surface)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          maxHeight: "82%",
          transform: closing ? "translateY(100%)" : "translateY(0)",
          transition: closing ? "transform 240ms cubic-bezier(.2,.7,.2,1)" : undefined,
        }}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <span className="h-1.5 w-10 rounded-full" style={{ background: "var(--line)" }} />
        </div>

        {/* kapat */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95"
          style={{ background: "var(--bg)", color: "var(--ink)" }}
          aria-label="Kapat"
        >
          <Icon.X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-4 px-6 pb-7 pt-2">
          {/* Görsel */}
          <div className="h-[180px] w-full">
            <ProductImage item={item} large />
          </div>

          {/* Etiketler */}
          <div className="flex flex-wrap items-center gap-2">
            {item.tag && (
              <span className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                {item.tag}
              </span>
            )}
            <span className="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}>
              günlük taze
            </span>
            <span className="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]"
                  style={{ borderColor: "var(--line)", color: "var(--ink-soft)" }}>
              250 ml
            </span>
          </div>

          {/* Başlık + fiyat */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-[34px] leading-[1.05]" style={{ color: "var(--ink)" }}>
              {item.name}
            </h3>
            <div className="text-right">
              <div className="font-display text-[26px] leading-none" style={{ color: "var(--ink)" }}>{item.price} ₺</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--ink-mute)" }}>KDV dahil</div>
            </div>
          </div>

          {/* Açıklama */}
          <p className="text-[14px] leading-[1.6]" style={{ color: "var(--ink-soft)" }}>
            {item.long}
          </p>

          {/* Çift buton: bilgi + garsonu çağır */}
          <div className="mt-2 flex gap-3">
            <button
              className="flex-1 rounded-full px-4 py-3 text-[14px] font-medium transition active:scale-[0.98]"
              style={{ border: "1px solid var(--line)", color: "var(--ink)", background: "transparent" }}
            >
              <span className="inline-flex items-center gap-2">
                <Icon.Spark className="h-4 w-4" />
                Şefin notu
              </span>
            </button>
            <button
              className="flex-1 rounded-full px-4 py-3 text-[14px] font-medium transition active:scale-[0.98]"
              style={{ background: "var(--ink)", color: "var(--surface)" }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Icon.Bell className="h-4 w-4" />
                Garsonu Çağır
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Tweaks: paletten dile kadar küçük seçimler ------ */
const PALETTES = {
  "Krem & Terracotta": {
    "--bg":          "oklch(0.962 0.014 78)",
    "--bg-page":     "oklch(0.948 0.018 78)",
    "--surface":     "#fffdf6",
    "--ink":         "oklch(0.22 0.028 52)",
    "--ink-soft":    "oklch(0.42 0.022 52)",
    "--ink-mute":    "oklch(0.58 0.018 60)",
    "--line":        "oklch(0.86 0.018 75)",
    "--accent":      "oklch(0.55 0.13 38)",
    "--accent-soft": "oklch(0.92 0.04 40)",
  },
  "Süt & Zeytin": {
    "--bg":          "oklch(0.965 0.010 110)",
    "--bg-page":     "oklch(0.948 0.013 110)",
    "--surface":     "#fefdf7",
    "--ink":         "oklch(0.22 0.02 130)",
    "--ink-soft":    "oklch(0.42 0.022 120)",
    "--ink-mute":    "oklch(0.58 0.02 120)",
    "--line":        "oklch(0.86 0.02 110)",
    "--accent":      "oklch(0.55 0.12 130)",
    "--accent-soft": "oklch(0.92 0.04 130)",
  },
  "Sis & Kömür": {
    "--bg":          "oklch(0.95 0.005 250)",
    "--bg-page":     "oklch(0.93 0.006 250)",
    "--surface":     "#fbfbfb",
    "--ink":         "oklch(0.2 0.01 250)",
    "--ink-soft":    "oklch(0.4 0.01 250)",
    "--ink-mute":    "oklch(0.58 0.008 250)",
    "--line":        "oklch(0.86 0.008 250)",
    "--accent":      "oklch(0.5 0.13 25)",
    "--accent-soft": "oklch(0.92 0.04 25)",
  },
  "Gece & Bakır": {
    "--bg":          "oklch(0.18 0.015 60)",
    "--bg-page":     "oklch(0.15 0.015 60)",
    "--surface":     "oklch(0.22 0.018 60)",
    "--ink":         "oklch(0.95 0.014 78)",
    "--ink-soft":    "oklch(0.78 0.014 78)",
    "--ink-mute":    "oklch(0.6 0.014 78)",
    "--line":        "oklch(0.32 0.018 60)",
    "--accent":      "oklch(0.72 0.12 50)",
    "--accent-soft": "oklch(0.3 0.06 50)",
  },
};

/* ---------- Uygulama kabuğu --------------------------------- */
const DEFAULTS = /*EDITMODE-BEGIN*/{
  "brand": "Questo",
  "eyebrow": "BIR FINCAN · BIR MOLA",
  "subtitle": "kahve & mola",
  "welcome": "Hoş geldiniz. Sakin bir köşeye yerleşin, menü artık parmaklarınızın ucunda. Demin hazır.",
  "locale": "TR",
  "palette": "Krem & Terracotta"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = window.useTweaks(DEFAULTS);
  /* appState: 'landing' | 'opening' | 'menu' | 'closing'
       - 'landing'  → yalnız ana sayfa görünür
       - 'opening'  → kapak (ana sayfa) açılıyor, menü altta belirir
       - 'menu'     → yalnız menü görünür
       - 'closing'  → kapak kapanıyor, menü altta görünmez oluyor */
  const [appState, setAppState] = useState("landing");
  const [detail, setDetail] = useState(null);

  // Tweaks: palet değişince CSS değişkenlerini güncelle
  useEffect(() => {
    const palette = PALETTES[tweaks.palette] || PALETTES["Krem & Terracotta"];
    const root = document.documentElement;
    Object.entries(palette).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [tweaks.palette]);

  const COVER_DUR = 760; /* ms — kapak animasyonu süresi */

  const goToMenu = () => {
    if (appState !== "landing") return;
    setAppState("opening");
    setTimeout(() => setAppState("menu"), COVER_DUR);
  };
  const goToLanding = () => {
    if (appState !== "menu") return;
    setDetail(null);
    setAppState("closing");
    setTimeout(() => setAppState("landing"), COVER_DUR);
  };

  const transitioning = appState === "opening" || appState === "closing";
  const landingShown  = appState === "landing" || transitioning;
  const menuShown     = appState === "menu" || transitioning;

  /* Kapak animasyonu — easeInOutCubic benzeri */
  const coverAnim =
    appState === "opening" ? `coverOpen ${COVER_DUR}ms cubic-bezier(.6,.05,.3,1) forwards`
  : appState === "closing" ? `coverClose ${COVER_DUR}ms cubic-bezier(.6,.05,.3,1) forwards`
  : "none";

  const screenContent = (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ perspective: 1800, perspectiveOrigin: "50% 45%" }}
    >
      {/* MENÜ — kapak açıkken altta görünür. Geçiş sırasında da render edilir. */}
      {menuShown && (
        <div className="absolute inset-0">
          <Menu
            onBack={goToLanding}
            onSelect={(item) => setDetail(item)}
            tweaks={tweaks}
          />
        </div>
      )}

      {/* ANA SAYFA / KAPAK — sol omurga etrafında açılıp kapanır */}
      {landingShown && (
        <div
          className="absolute inset-0"
          style={{
            transformOrigin: "left center",
            backfaceVisibility:       "hidden",
            WebkitBackfaceVisibility: "hidden",
            animation: coverAnim,
            /* kapak hareket ederken sağa düşen gölge */
            boxShadow: transitioning ? "12px 0 38px -10px rgba(20,12,6,0.35)" : "none",
            willChange: transitioning ? "transform" : "auto",
            pointerEvents: appState === "landing" ? "auto" : "none",
          }}
        >
          <Landing onEnter={goToMenu} tweaks={tweaks} />
        </div>
      )}

      {/* Detay alt-paneli sadece menü ekranındayken */}
      {detail && appState === "menu" && (
        <Detail item={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#1c1814" }}>
      {/* iPhone çerçevesi */}
      <window.IOSDevice>
        {screenContent}
      </window.IOSDevice>

      {/* Tweaks paneli */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Marka">
          <window.TweakText
            label="Restoran adı"
            value={tweaks.brand}
            onChange={(v) => setTweak("brand", v)}
          />
          <window.TweakText
            label="Alt başlık"
            value={tweaks.subtitle}
            onChange={(v) => setTweak("subtitle", v)}
          />
          <window.TweakText
            label="Üst etiket"
            value={tweaks.eyebrow}
            onChange={(v) => setTweak("eyebrow", v)}
          />
          <window.TweakText
            label="Karşılama metni"
            value={tweaks.welcome}
            onChange={(v) => setTweak("welcome", v)}
          />
        </window.TweakSection>

        <window.TweakSection label="Görünüm">
          <window.TweakSelect
            label="Renk paleti"
            value={tweaks.palette}
            options={Object.keys(PALETTES)}
            onChange={(v) => setTweak("palette", v)}
          />
          <window.TweakRadio
            label="Dil etiketi"
            value={tweaks.locale}
            options={["TR", "EN"]}
            onChange={(v) => setTweak("locale", v)}
          />
        </window.TweakSection>

        <window.TweakSection label="Akış">
          <window.TweakButton label="← Ana sayfaya dön" onClick={goToLanding} />
          <window.TweakButton label="Menüye atla →" onClick={goToMenu} />
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
