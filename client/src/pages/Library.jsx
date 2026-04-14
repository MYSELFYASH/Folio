import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, Flame, Plus, Search } from 'lucide-react';
import { BookCard, SummaryMini } from '@/components/BookCard';
import { AddBookModal } from '@/components/AddBookModal';
import { LogSessionModal } from '@/components/LogSessionModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { userBooksApi, statsApi } from '@/lib/api';
import { computeReadingStreak } from '@/lib/streak';

export function Library() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagesYear, setPagesYear] = useState(0);
  const [streakDates, setStreakDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('');
  const [q, setQ] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [logTarget, setLogTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [libRes, sumRes, streakRes, pagesRes] = await Promise.all([
        userBooksApi.list({ status: status || undefined, genre: genre || undefined, sort: sort || undefined, search: q || undefined }),
        statsApi.summary(),
        statsApi.readingStreak(),
        statsApi.pagesThisYear(),
      ]);
      setBooks(libRes.data);
      setSummary(sumRes.data);
      setStreakDates(streakRes.data.session_dates || []);
      setPagesYear(pagesRes.data.pages || 0);
    } finally {
      setLoading(false);
    }
  }, [status, genre, sort, q]);

  useEffect(() => {
    load();
  }, [load]);

  const streak = useMemo(() => computeReadingStreak(streakDates), [streakDates]);

  const genres = useMemo(() => {
    const s = new Set();
    books.forEach((b) => {
      if (b.genres) String(b.genres).split(',').forEach((g) => s.add(g.trim()));
    });
    return Array.from(s).filter(Boolean).sort();
  }, [books]);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-8">
        <h1 className="font-serif text-3xl">My library</h1>
        <div className="flex flex-1 gap-2 max-w-xl w-full sm:justify-end">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink3" />
            <Input
              className="pl-9"
              placeholder="Search title or author…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
          </div>
          <Button type="button" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add book
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <SummaryMini label="Total books" value={summary?.total_books ?? '—'} icon={BookMarked} />
        <SummaryMini label="Reading now" value={summary?.reading ?? '—'} />
        <SummaryMini label="Finished" value={summary?.finished ?? '—'} />
        <SummaryMini label="Day streak" value={streak} icon={Flame} />
        <SummaryMini label="Pages this year" value={pagesYear} />
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-8 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            ['', 'All'],
            ['reading', 'Reading'],
            ['finished', 'Finished'],
            ['want_to_read', 'Want to read'],
          ].map(([val, label]) => (
            <Button
              key={val || 'all'}
              type="button"
              size="sm"
              variant={status === val ? 'default' : 'secondary'}
              onClick={() => setStatus(val)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border border-border bg-cream px-3 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="">Sort: Added (newest)</option>
            <option value="added_asc">Added (oldest)</option>
            <option value="title_asc">Title A–Z</option>
            <option value="title_desc">Title Z–A</option>
            <option value="completion_desc">Progress</option>
          </select>
          <select
            className="h-9 rounded-md border border-border bg-cream px-3 text-sm"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">All genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-ink2">Loading your shelf…</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {books.map((b) => (
            <BookCard
              key={b.user_book_id}
              book={b}
              onOpen={() => navigate(`/books/${b.user_book_id}`)}
              onLogSession={(row) => {
                setLogTarget(row);
                setLogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {!loading && books.length === 0 ? (
        <p className="text-center text-ink2 py-16">No books match your filters. Try adding one.</p>
      ) : null}

      <AddBookModal open={addOpen} onOpenChange={setAddOpen} onAdded={load} library={books} />
      <LogSessionModal
        open={logOpen}
        onOpenChange={setLogOpen}
        userBookId={logTarget?.user_book_id}
        bookTitle={logTarget?.title}
        onLogged={load}
      />
    </div>
  );
}
