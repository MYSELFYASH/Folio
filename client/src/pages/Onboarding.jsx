import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi, goalsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const PREDEFINED_GENRES = [
  'Fiction', 'Non-fiction', 'Sci-Fi', 'Fantasy', 'History',
  'Biography', 'Self-Help', 'Business', 'Mystery', 'Romance'
];

export function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('12');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleFinish(e) {
    e?.preventDefault();
    setLoading(true);
    try {
      // Create yearly goal
      const g = parseInt(goal, 10);
      if (g > 0) {
        await goalsApi.create({
          goal_type: 'books_per_year',
          target_value: g,
          year: new Date().getFullYear()
        });
      }
      // Update genres
      if (selectedGenres.length > 0) {
        await authApi.updateProfile({ preferred_genres: selectedGenres.join(', ') });
      }
      toast.success("All set! Welcome to Folio.");
      navigate('/library');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong during setup');
      navigate('/library'); // continue anyway
    } finally {
      setLoading(false);
    }
  }

  function toggleGenre(genre) {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream text-ink p-6">
      <Card className="w-full max-w-lg p-8 border-border bg-cream2/50 relative overflow-hidden">
        <h1 className="font-serif text-3xl mb-2 text-terra">Welcome, {user?.username || 'Reader'}</h1>
        <p className="text-ink2 mb-8">Let's personalize your library in just a few steps.</p>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium">What's your reading goal?</h2>
            <div className="space-y-2">
              <Label>Books per year</Label>
              <Input
                type="number"
                min="1"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. 12"
              />
              <p className="text-xs text-ink2">Most users aim for 1-2 books a month.</p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setStep(2)}>Skip</Button>
              <Button onClick={() => setStep(2)}>Next</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-medium">Pick your favorite genres</h2>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_GENRES.map(genre => {
                const isSelected = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-4 py-2 text-sm border rounded-full transition-colors ${
                      isSelected
                        ? 'bg-terra text-white border-terra'
                        : 'bg-cream text-ink border-border hover:border-terra/50 hover:bg-terra/10'
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button variant="secondary" onClick={() => handleFinish()}>Skip</Button>
              <Button onClick={() => handleFinish()} disabled={loading}>
                {loading ? 'Saving...' : 'Finish Setup'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
