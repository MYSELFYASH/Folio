import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export function Profile() {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredGenres, setPreferredGenres] = useState(user?.preferred_genres || '');

  async function updateProfile(e) {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const payload = { preferred_genres: preferredGenres };
      if (password) {
        payload.password = password;
      }
      const { data } = await authApi.updateProfile(payload);
      // Ensure local user object gets updated if we handled user state synchronization
      toast.success('Profile updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update profile');
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl mb-8">Profile & Settings</h1>
      <Card className="p-6">
        <form onSubmit={updateProfile} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-ink2">Username</Label>
            <p className="font-medium text-ink">{user?.username}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-ink2">Email</Label>
            <p className="font-medium text-ink">{user?.email}</p>
          </div>

          <hr className="border-border" />

          <div className="space-y-2">
            <Label>Preferred Genres</Label>
            <Input
              value={preferredGenres}
              onChange={(e) => setPreferredGenres(e.target.value)}
              placeholder="e.g. Fiction, Sci-Fi"
            />
            <p className="text-xs text-ink2">Comma-separated genres you enjoy reading.</p>
          </div>

          <hr className="border-border" />

          <div className="space-y-2">
            <Label>Change Password (leave blank to keep current)</Label>
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              className="mt-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button type="submit">Save Changes</Button>
        </form>
      </Card>
    </div>
  );
}
