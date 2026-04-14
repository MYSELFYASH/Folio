import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/StarRating';
import { booksApi, userBooksApi } from '@/lib/api';
import { coverFallbackColor } from '@/lib/coverColor';
import { cn } from '@/lib/utils';

function mapGoogleToCreatePayload(item) {
  return {
    title: item.title,
    authors: item.authors || [],
    publisher: item.publisher,
    published_year: item.published_year,
    page_count: item.page_count,
    cover_url: item.cover_url,
    description: item.description,
    avg_rating: item.avg_rating,
    genre: item.genre,
    isbn: item.isbn,
  };
}

export function AddBookModal({ open, onOpenChange, onAdded, library = [] }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [manual, setManual] = useState({
    title: '',
    author: '',
    genre: '',
    pages: '',
    publisher: '',
    year: '',
    isbn: '',
    status: 'want_to_read',
  });

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  async function runSearch() {
    if (!query.trim()) {
      toast.error('Enter a search query');
      return;
    }
    setLoading(true);
    try {
      const { data } = await booksApi.search(query.trim());
      setResults(data);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  async function addFromGoogle(item, status) {
    try {
      const { data } = await booksApi.create(mapGoogleToCreatePayload(item));
      const book_id = data.book_id;
      await userBooksApi.add({ book_id, status });
      toast.success('Added to your library');
      onAdded?.();
      onOpenChange?.(false);
    } catch (e) {
      if (e.response?.status === 409) {
        toast.error('Already in your library');
      } else {
        toast.error(e.response?.data?.error || 'Could not add book');
      }
    }
  }

  async function addManual(e) {
    e.preventDefault();
    if (!manual.title.trim() || !manual.author.trim()) {
      toast.error('Title and author are required');
      return;
    }
    try {
      const { data } = await booksApi.create({
        title: manual.title.trim(),
        authors: [manual.author.trim()],
        genre: manual.genre || null,
        page_count: manual.pages ? parseInt(manual.pages, 10) : null,
        publisher: manual.publisher || null,
        published_year: manual.year ? parseInt(manual.year, 10) : null,
        isbn: manual.isbn || null,
      });
      await userBooksApi.add({ book_id: data.book_id, status: manual.status });
      toast.success('Book added');
      onAdded?.();
      onOpenChange?.(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add book');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Add a book</DialogTitle>
          <DialogDescription>Search Google Books or enter details manually.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search results</TabsTrigger>
            <TabsTrigger value="manual">Add manually</TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Title, author, ISBN…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), runSearch())}
              />
              <Button type="button" onClick={runSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-1" />
                {loading ? '…' : 'Search'}
              </Button>
            </div>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {results.map((item, idx) => {
                const bg = coverFallbackColor(item.title);
                const norm = (s) => String(s || '').trim().toLowerCase();
                const inLib = library.some((b) => {
                  if (item.isbn && b.isbn && String(b.isbn).replace(/-/g, '') === String(item.isbn).replace(/-/g, '')) {
                    return true;
                  }
                  return norm(b.title) === norm(item.title);
                });
                return (
                  <div
                    key={item.google_id || idx}
                    className="flex gap-3 rounded-lg border border-border p-3 bg-cream2/40"
                  >
                    <div
                      className="h-24 w-16 shrink-0 rounded overflow-hidden border border-border"
                      style={{ backgroundColor: item.cover_url ? undefined : bg }}
                    >
                      {item.cover_url ? (
                        <img src={item.cover_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[8px] text-center p-1 text-ink2">
                          {item.title}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <h4 className="font-serif font-medium leading-snug">{item.title}</h4>
                        <p className="text-xs text-ink2">
                          {(item.authors || []).join(', ')} · {item.published_year || '—'} ·{' '}
                          {item.page_count || '?'} pp.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.genre ? <Badge className="text-[10px]">{item.genre}</Badge> : null}
                        {item.avg_rating != null ? (
                          <span className="text-xs text-ink2 flex items-center gap-1">
                            <StarRating value={Math.round(item.avg_rating)} readOnly className="scale-75 origin-left" />
                            {item.avg_rating}
                          </span>
                        ) : null}
                      </div>
                      {inLib ? (
                        <Badge variant="success">Already in your library</Badge>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => addFromGoogle(item, 'want_to_read')}>
                            Want to read
                          </Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => addFromGoogle(item, 'reading')}>
                            Reading
                          </Button>
                          <Button type="button" size="sm" onClick={() => addFromGoogle(item, 'finished')}>
                            Finished
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {!results.length ? (
                <p className="text-sm text-ink2 text-center py-8">Search to see titles from Google Books.</p>
              ) : null}
            </div>
          </TabsContent>
          <TabsContent value="manual">
            <form onSubmit={addManual} className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label>Title *</Label>
                <Input
                  value={manual.title}
                  onChange={(e) => setManual((m) => ({ ...m, title: e.target.value }))}
                  required
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>Author *</Label>
                <Input
                  value={manual.author}
                  onChange={(e) => setManual((m) => ({ ...m, author: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Genre</Label>
                <Input value={manual.genre} onChange={(e) => setManual((m) => ({ ...m, genre: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Pages</Label>
                <Input
                  type="number"
                  value={manual.pages}
                  onChange={(e) => setManual((m) => ({ ...m, pages: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Publisher</Label>
                <Input
                  value={manual.publisher}
                  onChange={(e) => setManual((m) => ({ ...m, publisher: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input type="number" value={manual.year} onChange={(e) => setManual((m) => ({ ...m, year: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>ISBN</Label>
                <Input value={manual.isbn} onChange={(e) => setManual((m) => ({ ...m, isbn: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className={cn(
                    'flex h-10 w-full rounded-md border border-border bg-cream px-3 py-2 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-terra'
                  )}
                  value={manual.status}
                  onChange={(e) => setManual((m) => ({ ...m, status: e.target.value }))}
                >
                  <option value="want_to_read">Want to read</option>
                  <option value="reading">Reading</option>
                  <option value="finished">Finished</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button type="submit">Add to library</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
