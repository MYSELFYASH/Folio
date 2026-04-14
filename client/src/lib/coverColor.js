const PALETTE = [
  '#f5e6dc',
  '#e8f0eb',
  '#e7d8c8',
  '#dce8f0',
  '#f0e8dc',
  '#e8e0f0',
  '#f0e0e8',
  '#e0f0e8',
  '#ede6d6',
  '#d6e8e8',
  '#e8d6e0',
  '#d8e0f5',
  '#f5dcd0',
  '#d0e8dc',
  '#e0dce8',
  '#f0e0d0',
  '#cde8d4',
  '#e8d4cd',
  '#d4d8e8',
  '#e8e8d4',
  '#d4e8e4',
  '#e4d4e8',
  '#e8e4d4',
  '#d4e4e8',
  '#e8dcd4',
  '#d4e8dc',
];

export function coverFallbackColor(title) {
  const t = (title || '?').trim().toUpperCase();
  const code = t.charCodeAt(0);
  const idx = code >= 65 && code <= 90 ? code - 65 : (code % PALETTE.length) || 0;
  return PALETTE[idx % PALETTE.length];
}
