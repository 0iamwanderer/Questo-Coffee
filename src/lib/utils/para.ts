import type { Kurus } from '@/types/model';

export const formatTL = (kurus: Kurus | number): string => {
  const tl = (kurus as number) / 100;
  return tl.toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  });
};

export const tlToKurus = (tl: number): number => Math.round(tl * 100);
