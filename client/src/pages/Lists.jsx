import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { listsApi, userBooksApi } from '@/lib/api';
import { coverFallbackColor } from '@/lib/coverColor';

export function Lists() {
  const [lists, setLists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [newName, setNewName] = useState('');
  const [library, setLibrary] = useState([]);
  const [addBookId, setAddBookId] = useState('');

  const loadLists = useCallback(async () => {
    const { data } = await listsApi.list();
    setLists(data);
  }, []);

  const loadLibrary = useCallback(async () => {
    const { data } = await userBooksApi.list();
    setLibrary(data);
  }, []);

  useEffect(() => {
    loadLists().catch(() => {});
    loadLibrary().catch(() => {});
  }, [loadLists, loadLibrary]);

  const openList = async (listId) => {
    setSelected(listId);
    const { data } = await listsApi.get(listId);
    setDetail(data);
  };

  async function createList(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await listsApi.create({ name: newName.trim() });
      setNewName('');
      toast.success('List created');
      loadLists();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not create');
    }
  }

  async function removeList(id) {
    if (!confirm('Delete this list?')) return;
    try {
      await listsApi.remove(id);
      if (selected === id) {
        setSelected(null);
        setDetail(null);
      }
      toast.success('List deleted');
      loadLists();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete');
    }
  }

  async function addToList() {
    if (!selected || !addBookId) return;
    try {
      await listsApi.addItem(selected, { book_id: parseInt(addBookId, 10) });
      toast.success('Book added to list');
      openList(selected);
      setAddBookId('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not add');
    }
  }

  async function removeItem(bookId) {
    if (!selected) return;
    try {
      await listsApi.removeItem(selected, bookId);
      openList(selected);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not remove');
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <h1 className="font-serif text-3xl mb-8">Custom lists</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <form onSubmit={createList} className="flex gap-2">
            <Input placeholder="New list name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button type="submit">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
          <div className="space-y-2">
            {lists.map((l) => (
              <Card
                key={l.list_id}
                className={`p-4 flex justify-between items-center cursor-pointer border-2 ${
                  selected === l.list_id ? 'border-terra' : 'border-border'
                }`}
                onClick={() => openList(l.list_id)}
              >
                <div>
                  <p className="font-medium">{l.name}</p>
                  <p className="text-xs text-ink2">{l.item_count ?? 0} books</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeList(l.list_id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
            {lists.length === 0 ? <p className="text-ink2 text-sm">No lists yet. Create one above.</p> : null}
          </div>
        </div>

        <div>
          {detail ? (
            <Card className="p-6">
              <h2 className="font-serif text-xl mb-2">{detail.list.name}</h2>
              {detail.list.description ? <p className="text-sm text-ink2 mb-4">{detail.list.description}</p> : null}

              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <div className="flex-1 space-y-1">
                  <Label>Add from your library (catalog book)</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-border bg-cream px-3 text-sm"
                    value={addBookId}
                    onChange={(e) => setAddBookId(e.target.value)}
                  >
                    <option value="">Choose book…</option>
                    {library.map((b) => (
                      <option key={b.user_book_id} value={b.book_id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="button" className="sm:mt-6" onClick={addToList} disabled={!addBookId}>
                  Add
                </Button>
              </div>

              <ul className="space-y-3">
                {detail.items.map((item) => {
                  const bg = coverFallbackColor(item.title);
                  return (
                    <li key={item.book_id} className="flex gap-3 items-center border border-border rounded-lg p-2">
                      <div
                        className="h-14 w-10 rounded overflow-hidden shrink-0 border border-border"
                        style={{ backgroundColor: item.cover_image_url ? undefined : bg }}
                      >
                        {item.cover_image_url ? (
                          <img src={item.cover_image_url} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-xs text-ink2 truncate">{item.authors}</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.book_id)}>
                        Remove
                      </Button>
                    </li>
                  );
                })}
              </ul>
              {detail.items.length === 0 ? <p className="text-sm text-ink2">This list is empty.</p> : null}
            </Card>
          ) : (
            <p className="text-ink2 text-sm">Select a list to manage items.</p>
          )}
        </div>
      </div>
    </div>
  );
}
