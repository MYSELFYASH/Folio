export function computeReadingStreak(sessionDates) {
  const set = new Set(sessionDates.map((d) => String(d).slice(0, 10)));
  const today = new Date();
  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  let streak = 0;
  let started = false;

  for (let i = 0; i < 400; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = fmt(d);

    if (set.has(dateStr)) {
      streak++;
      started = true;
    } else {
      if (i === 0) continue; // It's okay if they haven't read *yet* today
      if (started) break;
    }
  }
  return streak;
}
