import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { LogSessionModal } from '@/components/LogSessionModal';
import { goalsApi, statsApi, userBooksApi } from '@/lib/api';
import { computeReadingStreak } from '@/lib/streak';

function GoalRing({ current, target }) {
  const t = Math.max(1, target || 1);
  const c = Math.min(current || 0, t);
  const pct = c / t;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct);
  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" className="stroke-cream2" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          className="stroke-folgreen"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={dash}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-3xl font-medium">{c}</span>
        <span className="text-xs text-ink2">of {t} books</span>
      </div>
    </div>
  );
}

function localDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function Heatmap({ activity }) {
  const map = useMemo(() => {
    const m = new Map();
    (activity || []).forEach((a) => {
      const k = String(a.session_date).slice(0, 10);
      m.set(k, (m.get(k) || 0) + a.pages);
    });
    return m;
  }, [activity]);

  const weeks = 16;
  const days = 7;
  const end = new Date();
  const columns = [];

  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < days; d++) {
      const dt = new Date(end);
      const daysBack = (weeks - 1 - w) * 7 + (6 - d);
      dt.setDate(dt.getDate() - daysBack);
      const key = localDateKey(dt);
      const pages = map.get(key) || 0;
      let level = 0;
      if (pages > 0) level = 1;
      if (pages >= 20) level = 2;
      if (pages >= 50) level = 3;
      if (pages >= 100) level = 4;
      col.push({ key, level, pages });
    }
    columns.push(col);
  }

  const levelColor = ['bg-cream2', 'bg-folgreen/30', 'bg-folgreen/50', 'bg-folgreen/75', 'bg-folgreen'];

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-1 min-w-max">
        {columns.map((col, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {col.map((cell) => (
              <div
                key={cell.key}
                title={`${cell.key}: ${cell.pages} pages`}
                className={`w-3 h-3 rounded-sm ${levelColor[cell.level]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-ink2 mt-2">16 weeks × 7 days · greener = more pages that day</p>
    </div>
  );
}

export function Goals() {
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [bpm, setBpm] = useState([]);
  const [genres, setGenres] = useState([]);
  const [streakDates, setStreakDates] = useState([]);
  const [activity, setActivity] = useState([]);
  const [sessionsRecent, setSessionsRecent] = useState([]);
  const [readingBooks, setReadingBooks] = useState([]);
  const [editTarget, setEditTarget] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('12');
  const [logOpen, setLogOpen] = useState(false);
  const [pagesYear, setPagesYear] = useState(0);

  const load = useCallback(async () => {
    const [g, s, m, gb, st, act, recent, lib, py] = await Promise.all([
      goalsApi.list(),
      statsApi.summary(),
      statsApi.booksPerMonth(),
      statsApi.genreBreakdown(),
      statsApi.readingStreak(),
      statsApi.activity(),
      statsApi.recentSessions(),
      userBooksApi.list({ status: 'reading' }),
      statsApi.pagesThisYear(),
    ]);
    setGoals(g.data);
    setSummary(s.data);
    setPagesYear(py.data.pages || 0);
    setBpm(m.data);
    setGenres(gb.data);
    setStreakDates(st.data.session_dates || []);
    setActivity(act.data);
    setSessionsRecent(recent.data);
    setReadingBooks(lib.data);
  }, []);

  useEffect(() => {
    load().catch((e) => toast.error(e.message));
  }, [load]);

  const yearGoal = useMemo(() => {
    const y = new Date().getFullYear();
    return goals.find((g) => g.goal_type === 'books_per_year' && Number(g.year) === y) || goals[0];
  }, [goals]);

  useEffect(() => {
    if (yearGoal) setEditTarget(String(yearGoal.target_value));
  }, [yearGoal]);

  const streak = useMemo(() => computeReadingStreak(streakDates), [streakDates]);

  const maxGenre = useMemo(() => Math.max(1, ...genres.map((g) => g.book_count)), [genres]);
  const maxMonth = useMemo(() => Math.max(1, ...bpm.map((b) => b.books_finished)), [bpm]);

  const paceText = useMemo(() => {
    if (!yearGoal) return 'Set a yearly goal to see pacing.';
    if (yearGoal.current_value >= yearGoal.target_value) {
      return `Incredible work! You have successfully completed your reading goal for the year 🎉`;
    }
    const month = new Date().getMonth() + 1;
    const pace = month ? (yearGoal.current_value / month) * 12 : 0;
    if (pace >= yearGoal.target_value) {
      const early = Math.max(0, Math.floor(12 - yearGoal.target_value / (yearGoal.current_value / month || 1)));
      return `At your current pace, you may finish about ${Math.round(pace)} books this year — roughly ${early} months ahead of a linear schedule.`;
    }
    return 'Keep logging sessions to stay on track for your yearly target.';
  }, [yearGoal]);

  async function saveTarget() {
    if (!yearGoal) return;
    try {
      await goalsApi.patch(yearGoal.goal_id, { target_value: parseInt(editTarget, 10) });
      toast.success('Goal updated');
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not update');
    }
  }

  async function createGoal(e) {
    if (e) e.preventDefault();
    try {
      await goalsApi.create({
        goal_type: 'books_per_year',
        target_value: parseInt(newGoalTarget, 10),
        year: new Date().getFullYear()
      });
      toast.success('Yearly goal created 🎉');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not create goal');
    }
  }

  const monthBars = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const found = bpm.find((b) => Number(b.month) === i + 1);
      return { month: i + 1, count: found ? found.books_finished : 0 };
    });
  }, [bpm]);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-10">
      <h1 className="font-serif text-3xl">Goals &amp; stats</h1>

      <div className="grid lg:grid-cols-[1fr_280px] gap-8">
        <Card className="p-8">
          {yearGoal ? (
            <>
              <GoalRing current={yearGoal.current_value} target={yearGoal.target_value} />
              <div className="mt-8 space-y-4 max-w-xl mx-auto text-center lg:text-left">
                <h2 className="font-serif text-xl">Books finished this year</h2>
                <p className="text-sm text-ink2">{paceText}</p>
                <Progress value={Math.min(100, (yearGoal.current_value / yearGoal.target_value) * 100)} className="h-3" />
                <p className="text-xs text-ink2">
                  Target {yearGoal.target_value} · Current {yearGoal.current_value} · Year {yearGoal.year}
                </p>
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  <div className="flex gap-2 items-center">
                    <Input
                      className="w-24 h-9"
                      value={editTarget}
                      onChange={(e) => setEditTarget(e.target.value)}
                      type="number"
                      min={1}
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={saveTarget}>
                      Edit goal
                    </Button>
                  </div>
                  <Button type="button" size="sm" onClick={() => setLogOpen(true)}>
                    Log session
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="p-4 rounded-full bg-terralt text-terra">
                <Flame className="h-8 w-8" />
              </div>
              <div>
                <h2 className="font-serif text-xl mb-1">Set a yearly reading goal</h2>
                <p className="text-sm text-ink2">Track your progress and build a consistent reading habit.</p>
              </div>
              <form onSubmit={createGoal} className="flex gap-2 items-center mt-2">
                <Input
                  className="w-24 text-center"
                  type="number"
                  min={1}
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  required
                />
                <Button type="submit">Start tracking</Button>
              </form>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-terralt text-terra">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-ink2 uppercase">Streak</p>
              <p className="font-serif text-2xl">{streak} days</p>
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-ink2 uppercase">Avg rating</p>
            <p className="font-serif text-2xl">{summary?.avg_rating ?? '—'}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-ink2 uppercase">Pages this year</p>
            <p className="font-serif text-2xl">{pagesYear}</p>
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-4">
          <h3 className="font-serif font-medium mb-4">Books per month ({new Date().getFullYear()})</h3>
          <div className="flex items-end gap-2 h-40">
            {monthBars.map(({ month, count }) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-folgreen/80 rounded-t max-h-[120px] min-h-0"
                  style={{ height: `${(count / maxMonth) * 100}%`, minHeight: count ? '4px' : 0 }}
                />
                <span className="text-[10px] text-ink2">{month}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-serif font-medium mb-4">Genre breakdown</h3>
          <div className="space-y-2">
            {genres.map((g) => (
              <div key={g.genre}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{g.genre}</span>
                  <span>{g.book_count}</span>
                </div>
                <div className="h-2 rounded-full bg-cream2 border border-border overflow-hidden">
                  <div className="h-full bg-terra" style={{ width: `${(g.book_count / maxGenre) * 100}%` }} />
                </div>
              </div>
            ))}
            {genres.length === 0 ? <p className="text-sm text-ink2">No genre data yet.</p> : null}
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-serif font-medium mb-4">Recent sessions</h3>
          <ul className="text-sm space-y-2 max-h-52 overflow-y-auto">
            {sessionsRecent.map((s) => (
              <li key={s.session_id} className="flex justify-between gap-2 border-b border-border pb-2">
                <span className="truncate">{s.title}</span>
                <span className="text-ink2 shrink-0">
                  {String(s.session_date).slice(0, 10)} · {s.pages_read} pp
                </span>
              </li>
            ))}
          </ul>
          {sessionsRecent.length === 0 ? <p className="text-sm text-ink2">Log a session to see history here.</p> : null}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-serif font-medium mb-4">Activity heatmap</h3>
        <Heatmap activity={activity} />
      </Card>

      <LogSessionModal
        open={logOpen}
        onOpenChange={setLogOpen}
        selectableBooks={readingBooks.map((b) => ({ user_book_id: b.user_book_id, title: b.title }))}
        onLogged={load}
      />
    </div>
  );
}
