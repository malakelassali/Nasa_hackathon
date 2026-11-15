import { words } from '../../demo/copy';
import type { Locale } from '../../demo/types';

export const crops = ['Wheat', 'Barley', 'Chickpea', 'Fallow'];

export function cropName(crop: string, locale: Locale): string {
  const names: Record<string, [string, string, string]> = {
    Wheat: ['Wheat', 'Blé', 'القمح'],
    Barley: ['Barley', 'Orge', 'الشعير'],
    Chickpea: ['Chickpea', 'Pois chiche', 'الحمص'],
    Fallow: ['Fallow', 'Jachère', 'راحة الأرض'],
  };
  const name = names[crop] ?? names.Wheat!;
  return words(locale, name[0], name[1], name[2]);
}
