'use client';

/**
 * Tarayıcılar AudioContext'i kullanıcı etkileşimi olmadan başlatmaya izin vermez.
 * Bu modül "Vardiyayı Başlat" düğmesinde tek tıklamayla context'i açar; sonrasında
 * yeniSiparisSesi() arka planda çalabilir.
 */

let ctx: AudioContext | null = null;
let kilitAcildi = false;

const sesContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  const w = window as Window & {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
};

export const sesKilitAc = async (): Promise<void> => {
  const c = sesContext();
  if (!c) return;
  if (c.state === 'suspended') await c.resume();
  // iOS Safari için sessiz "wake" — kullanıcı gestürünün hemen ardından
  const o = c.createOscillator();
  const g = c.createGain();
  g.gain.value = 0;
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + 0.01);
  kilitAcildi = true;
};

export const sesKilidiAcikMi = (): boolean => kilitAcildi;

export const yeniSiparisSesi = (): void => {
  if (!kilitAcildi) return;
  const c = sesContext();
  if (!c) return;
  const t0 = c.currentTime;

  const bip = (freq: number, baslangic: number, sure: number) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    const t = t0 + baslangic;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + sure + 0.05);
  };

  bip(880, 0, 0.15);
  bip(1320, 0.18, 0.2);
};
