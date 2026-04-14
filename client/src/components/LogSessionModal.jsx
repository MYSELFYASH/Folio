import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sessionsApi } from '@/lib/api';

export function LogSessionModal({ open, onOpenChange, userBookId: initialUb, bookTitle, selectableBooks = [], onLogged }) {
  const [userBookId, setUserBookId] = useState(initialUb ?? '');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pages, setPages] = useState('20');
  const [duration, setDuration] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setUserBookId(initialUb != null ? String(initialUb) : selectableBooks[0]?.user_book_id ?? '');
      setSessionDate(new Date().toISOString().slice(0, 10));
      setPages('20');
      setDuration('');
      setNote('');
    }
  }, [open, initialUb, selectableBooks]);

  const showPicker = selectableBooks.length > 0 && initialUb == null;

  async function handleSubmit(e) {
    e.preventDefault();
    const ub = parseInt(userBookId, 10);
    const p = parseInt(pages, 10);
    if (!ub || Number.isNaN(ub)) {
      toast.error('Choose a book to log against.');
      return;
    }
    if (!p || p < 1) {
      toast.error('Pages read must be at least 1.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await sessionsApi.create({
        user_book_id: ub,
        pages_read: p,
        session_date: sessionDate,
        duration_minutes: duration === '' ? null : parseInt(duration, 10),
        note: note.trim() || null,
      });
      const title =
        data.book_title ||
        selectableBooks.find((b) => String(b.user_book_id) === String(ub))?.title ||
        bookTitle ||
        'your book';
      if (data.just_finished) {
        toast.success('You finished ' + title + '! ' + String.fromCodePoint(0x1f389));
      } else {
        toast.success(`Session logged! You've read ${p} pages today.`);
      }
      onOpenChange?.(false);
      onLogged?.(data);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Could not log session');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Log reading session</DialogTitle>
          <DialogDescription>Pages update your progress automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {showPicker ? (
            <div className="space-y-2">
              <Label>Book</Label>
              <Select value={String(userBookId)} onValueChange={(v) => setUserBookId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a book" />
                </SelectTrigger>
                <SelectContent>
                  {selectableBooks.map((b) => (
                    <SelectItem key={b.user_book_id} value={String(b.user_book_id)}>
                      {b.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-ink2">
              Logging for <span className="font-medium text-ink">{bookTitle || 'selected book'}</span>
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sess-date">Date</Label>
              <Input id="sess-date" type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sess-pages">Pages read</Label>
              <Input
                id="sess-pages"
                type="number"
                min={1}
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sess-dur">Duration (minutes, optional)</Label>
            <Input
              id="sess-dur"
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sess-note">Note (optional)</Label>
            <Input id="sess-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={255} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
