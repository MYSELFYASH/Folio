import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StarRating } from '@/components/StarRating';
import { LogSessionModal } from '@/components/LogSessionModal';
import { userBooksApi, sessionsApi, highlightsApi } from '@/lib/api';
import { coverFallbackColor } from '@/lib/coverColor';
import { completionPct } from '@/lib/progress';

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN');
  } catch {
    return String(d);
  }
}

export function BookDetail() {
  const { userBookId } = useParams();
  const id = parseInt(userBookId, 10);
  const [book, setBook] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [review, setReview] = useState('');
  const [notePage, setNotePage] = useState('');
  const [noteText, setNoteText] = useState('');
  const [logOpen, setLogOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [inlineDate, setInlineDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [inlinePages, setInlinePages] = useState('10');
  const [inlineDur, setInlineDur] = useState('');

  const showCover = book?.cover_image_url && !imgError;

  const loadBook = useCallback(async () => {
    const { data } = await userBooksApi.detail(id);
    setBook(data);
    setReview(data.review || '');
  }, [id]);

  const loadSessions = useCallback(async () => {
    const { data } = await sessionsApi.listForBook(id);
    setSessions(data);
  }, [id]);

  const loadNotes = useCallback(async () => {
    const { data } = await highlightsApi.list(id);
    setNotes(data);
  }, [id]);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    loadBook().catch(() => toast.error('Could not load book'));
    loadSessions().catch(() => {});
    loadNotes().catch(() => {});
  }, [id, loadBook, loadSessions, loadNotes]);

  const pct = useMemo(() => completionPct(book?.current_page, book?.total_pages), [book]);
  const bg = coverFallbackColor(book?.title);

  async function saveReview() {
    try {
      await userBooksApi.patch(id, { review });
      toast.success('Review saved');
      loadBook();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    }
  }

  async function onRating(r) {
    try {
      await userBooksApi.patch(id, { user_rating: r });
      toast.success('Rating updated');
      loadBook();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Update failed');
    }
  }

  async function onStatusChange(v) {
    try {
      const body = { status: v };
      if (v === 'reading' && !book.started_at) body.started_at = new Date().toISOString().slice(0, 10);
      if (v === 'finished') body.finished_at = new Date().toISOString().slice(0, 10);
      await userBooksApi.patch(id, body);
      toast.success('Status updated');
      loadBook();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Update failed');
    }
  }

  async function addNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      await highlightsApi.create({
        user_book_id: id,
        page_number: notePage === '' ? null : parseInt(notePage, 10),
        content: noteText.trim(),
      });
      setNoteText('');
      setNotePage('');
      toast.success('Note saved');
      loadNotes();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Could not save note');
    }
  }

  async function inlineLog(e) {
    e.preventDefault();
    const p = parseInt(inlinePages, 10);
    if (!p || p < 1) return;
    try {
      const { data } = await sessionsApi.create({
        user_book_id: id,
        pages_read: p,
        session_date: inlineDate,
        duration_minutes: inlineDur === '' ? null : parseInt(inlineDur, 10),
      });
      if (data.just_finished) toast.success('You finished ' + (data.book_title || book.title) + '!');
      else toast.success(`Logged ${p} pages`);
      loadBook();
      loadSessions();
      setInlinePages('10');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Log failed');
    }
  }

  async function deleteSession(sid) {
    try {
      await sessionsApi.remove(sid);
      toast.success('Session removed');
      loadBook();
      loadSessions();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Delete failed');
    }
  }

  if (!book) {
    return <div className="p-10 text-ink2">Loading…</div>;
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-ink2 mb-8">
        <Link to="/library" className="hover:text-terra">
          My books
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-ink font-medium truncate">{book.title}</span>
      </nav>

      <div className="flex flex-col sm:flex-row gap-8">
        <div className="w-48 shrink-0 space-y-4">
          <div
            className="w-full aspect-[2/3] rounded-lg overflow-hidden shadow-sm border border-border"
            style={{ backgroundColor: showCover ? undefined : bg }}
          >
            {showCover ? (
              <img 
                src={book.cover_image_url} 
                alt="" 
                className="h-full w-full object-cover" 
                onError={() => setImgError(true)} 
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-4 text-center text-sm font-medium text-ink2">
                {book.title}
              </div>
            )}
          </div>
          <Card className="p-4 space-y-2">
            <p className="text-xs uppercase text-ink2">Online ratings</p>
            {(book.online_ratings || []).length ? (
              book.online_ratings.map((r) => (
                <div key={r.rating_id} className="flex justify-between text-sm">
                  <span>{r.source_name}</span>
                  <span className="font-medium">{r.score}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink2">No synced ratings</p>
            )}
            {book.avg_online_rating != null ? (
              <p className="text-sm text-ink2 pt-2">Avg. {book.avg_online_rating}</p>
            ) : null}
          </Card>
          <div className="text-sm text-ink2 space-y-1">
            {book.publication_year ? <p>Published {book.publication_year}</p> : null}
            {book.total_pages ? <p>{book.total_pages} pages</p> : null}
          </div>
        </div>

        <div>
          <h1 className="font-serif text-[34px] leading-tight">{book.title}</h1>
          <p className="text-ink2 mt-2">{(book.authors || []).join(', ') || 'Unknown author'}</p>

          <div className="flex flex-wrap gap-4 mt-6 items-center">
            <div className="w-48">
              <Label className="text-xs text-ink2">Status</Label>
              <Select value={book.status} onValueChange={onStatusChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want_to_read">Want to read</SelectItem>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-ink2">Started</Label>
              <p className="text-sm mt-1">{formatDate(book.started_at)}</p>
            </div>
            <div>
              <Label className="text-xs text-ink2">Finished</Label>
              <p className="text-sm mt-1">{formatDate(book.finished_at)}</p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="mt-10">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div>
                <Label className="text-ink2 text-xs">Your rating</Label>
                <StarRating value={book.user_rating || 0} onChange={onRating} className="mt-2" />
              </div>
              <div>
                <Label>Review</Label>
                <Textarea className="mt-2" value={review} onChange={(e) => setReview(e.target.value)} rows={5} />
                <Button type="button" className="mt-2" size="sm" onClick={saveReview}>
                  Save review
                </Button>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <Card className="p-4">
                  <p className="text-xs text-ink2">Completion</p>
                  <p className="font-serif text-2xl mt-1">{pct}%</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-ink2">Pages read (logged)</p>
                  <p className="font-serif text-2xl mt-1">{book.total_pages_logged ?? 0}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-ink2">Sessions</p>
                  <p className="font-serif text-2xl mt-1">{book.total_sessions ?? 0}</p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>
                    {book.current_page || 0} / {book.total_pages || '—'} ({pct}%)
                  </span>
                </div>
                <Progress value={pct} className="h-4" />
              </div>

              <Card className="p-4">
                <p className="font-medium mb-3">Log session</p>
                <form onSubmit={inlineLog} className="grid sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={inlineDate} onChange={(e) => setInlineDate(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Pages</Label>
                    <Input
                      type="number"
                      min={1}
                      value={inlinePages}
                      onChange={(e) => setInlinePages(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Minutes (optional)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={inlineDur}
                      onChange={(e) => setInlineDur(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-3 flex gap-2">
                    <Button type="submit">Log</Button>
                    <Button type="button" variant="secondary" onClick={() => setLogOpen(true)}>
                      Full form
                    </Button>
                  </div>
                </form>
              </Card>

              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-cream2/80">
                    <tr>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Pages</th>
                      <th className="text-left p-3">Duration</th>
                      <th className="text-left p-3">Cumulative</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.session_id} className="border-t border-border">
                        <td className="p-3">{formatDate(s.session_date)}</td>
                        <td className="p-3">{s.pages_read}</td>
                        <td className="p-3">{s.duration_minutes ?? '—'}</td>
                        <td className="p-3">{s.cumulative_pages}</td>
                        <td className="p-3 text-right">
                          <Button type="button" variant="ghost" size="sm" onClick={() => deleteSession(s.session_id)}>
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sessions.length === 0 ? <p className="p-6 text-ink2 text-center">No sessions yet.</p> : null}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
              <form onSubmit={addNote} className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Page (optional)</Label>
                  <Input type="number" min={0} value={notePage} onChange={(e) => setNotePage(e.target.value)} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Note</Label>
                  <Textarea className="mt-1" value={noteText} onChange={(e) => setNoteText(e.target.value)} required rows={3} />
                </div>
                <Button type="submit">Save note</Button>
              </form>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-cream2/80">
                    <tr>
                      <th className="text-left p-3">Page</th>
                      <th className="text-left p-3">Note</th>
                      <th className="text-left p-3">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map((n) => (
                      <tr key={n.highlight_id} className="border-t border-border">
                        <td className="p-3">{n.page_number ?? '—'}</td>
                        <td className="p-3 max-w-md">{n.content}</td>
                        <td className="p-3">{formatDate(n.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {notes.length === 0 ? <p className="p-6 text-ink2 text-center">No notes yet.</p> : null}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <LogSessionModal
        open={logOpen}
        onOpenChange={setLogOpen}
        userBookId={id}
        bookTitle={book.title}
        onLogged={() => {
          loadBook();
          loadSessions();
        }}
      />
    </div>
  );
}
