export function completionPct(currentPage, totalPages) {
  const c = Number(currentPage) || 0;
  const t = Number(totalPages);
  if (!t || t <= 0) return 0;
  return Math.min(100, Math.round((c / t) * 100));
}
