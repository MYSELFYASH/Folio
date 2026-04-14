import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/Layout';
import { Landing } from '@/pages/Landing';
import { Library } from '@/pages/Library';
import { BookDetail } from '@/pages/BookDetail';
import { Goals } from '@/pages/Goals';
import { Lists } from '@/pages/Lists';
import { Profile } from '@/pages/Profile';
import { Onboarding } from '@/pages/Onboarding';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/library" element={<Library />} />
        <Route path="/books/:userBookId" element={<BookDetail />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/lists" element={<Lists />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </BrowserRouter>
  );
}
