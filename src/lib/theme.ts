export type AccentId = 'nova' | 'bento' | 'midnight' | 'sunset' | 'mono';

export interface AccentDef {
  id: AccentId;
  name: string;
  swatch: string;
}

export const ACCENTS: readonly AccentDef[] = [
  { id: 'nova', name: 'Nova Cream', swatch: '#ff6b2c' },
  { id: 'bento', name: 'Bento Blue', swatch: '#6366f1' },
  { id: 'midnight', name: 'Midnight Lab', swatch: '#d6ff57' },
  { id: 'sunset', name: 'Sunset Pop', swatch: '#ff7a3d' },
  { id: 'mono', name: 'Mono Stone', swatch: '#111111' },
];

export type ThemeMode = 'light' | 'dark';

export function getGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'k';
  return String(n);
}
