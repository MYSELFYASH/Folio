import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen, LineChart, Search, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

const QUOTES = [
  { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin" },
  { text: "Fairy tales are more than true: not because they tell us that dragons exist, but because they tell us that dragons can be beaten.", author: "Neil Gaiman" },
  { text: "We read to know we are not alone.", author: "C.S. Lewis" },
  { text: "I have always imagined that Paradise will be a kind of library.", author: "Jorge Luis Borges" }
];

export function Landing() {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/library', { replace: true });
  }, [isAuthenticated, navigate]);

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirm, setConfirm] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'register') {
        if (password !== confirm) {
           toast.error('Passwords do not match');
           return;
        }
        await register(username, email, password);
        if (remember) localStorage.setItem('folio_remember', '1');
        else localStorage.removeItem('folio_remember');
        toast.success('Welcome to Folio');
        navigate('/onboarding');
      } else {
        // user might enter username in email field, backend now supports both
        await login(email, password);
        if (remember) localStorage.setItem('folio_remember', '1');
        else localStorage.removeItem('folio_remember');
        toast.success('Welcome back');
        navigate('/library');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  const pills = [
    { icon: BookOpen, label: 'Library management' },
    { icon: LineChart, label: 'Progress tracking' },
    { icon: Target, label: 'Reading goals' },
    { icon: Search, label: 'Smart search' },
  ];

  const currentQuote = QUOTES[quoteIdx];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-cream text-ink font-sans selection:bg-terra/20">
      
      {/* Left elegant quote pane */}
      <div className="flex-1 relative flex flex-col justify-between p-12 lg:p-20 bg-cream2 border-b lg:border-b-0 lg:border-r border-border overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none radial-gradient-mask" />
        
        <div className="relative z-10 flex items-center gap-3 font-serif text-2xl font-semibold text-terra tracking-wide">
          <BookOpen className="h-7 w-7" />
          fo.lio
        </div>

        <div className="relative z-10 my-16 max-w-xl transition-opacity duration-1000 ease-in-out">
          <p className="font-serif text-4xl lg:text-5xl font-medium leading-[1.15] text-ink mb-8">
            <span className="text-terra/50 mr-2">{"\u201C"}</span>{currentQuote.text}
          </p>
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-12 bg-terra/40"></div>
            <p className="text-lg text-ink2 uppercase tracking-widest font-medium">
              {currentQuote.author}
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 max-w-lg mt-auto">
          {pills.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 text-sm text-ink2 group transition-colors hover:text-ink"
            >
              <div className="p-2 rounded-md bg-cream shadow-sm border border-border group-hover:border-terra/30 transition-colors">
                <Icon className="h-4 w-4 text-terra" />
              </div>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Right login pane */}
      <div className="w-full lg:w-[500px] shrink-0 flex flex-col items-center justify-center p-8 lg:p-12 bg-cream">
        <Card className="w-full max-w-[400px] p-8 lg:p-10 border-none shadow-xl bg-white/60 backdrop-blur-xl ring-1 ring-border rounded-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-serif font-medium mb-2 text-ink">
              {mode === 'login' ? 'Welcome back.' : 'Start your journey.'}
            </h2>
            <p className="text-sm text-ink2">
              {mode === 'login' ? 'Log in to your Folio account.' : 'Create an account to track your reading.'}
            </p>
          </div>

          <div className="flex gap-1 p-1 bg-cream2 rounded-lg mb-8">
            <button
              type="button"
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-white shadow-sm text-ink' : 'text-ink2 hover:text-ink'}`}
              onClick={() => setMode('login')}
            >
              Log in
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'register' ? 'bg-white shadow-sm text-ink' : 'text-ink2 hover:text-ink'}`}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-ink2">Username</Label>
                <Input
                  id="username"
                  className="bg-cream/50"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-ink2">
                {mode === 'login' ? 'Email or Username' : 'Email'}
              </Label>
              <Input
                id="email"
                type={mode === 'register' ? "email" : "text"}
                className="bg-cream/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-ink2">Password</Label>
              <Input
                id="password"
                type="password"
                className="bg-cream/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-ink2">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  className="bg-cream/50"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}
            {mode === 'login' && (
              <label className="flex items-center gap-2 text-sm text-ink2 pt-1 cursor-pointer select-none">
                <input type="checkbox" className="accent-terra rounded" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
            )}
            
            <Button type="submit" className="w-full h-11 text-base mt-2 transition-transform active:scale-[0.98]" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          {mode === 'login' && (
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-ink2 text-center flex flex-col gap-1">
                <span>Demo seed user:</span>
                <span className="font-mono bg-cream2 px-2 py-1 rounded text-ink">demo@folio.local / password123</span>
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
