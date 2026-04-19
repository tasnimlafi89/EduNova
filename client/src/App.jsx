import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { AuthProvider } from './components/AuthProvider';
import { NotificationProvider } from './components/ui/Notification';
import { Landing } from './pages/Landing';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Learn } from './pages/Learn';
import { ChatPage } from './pages/ChatPage';
import { ProgressPage } from './pages/ProgressPage';
import { TodoPage } from './pages/TodoPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const queryClient = new QueryClient();

// ── Navigation Link ─────────────────────────────────────────────
const NavLink = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
  
  return (
    <Link 
      to={to} 
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
        isActive 
          ? 'bg-primary/15 text-primary' 
          : 'text-on-surface-variant hover:text-white hover:bg-surface-container-high'
      }`}
    >
      <span className="material-symbols-outlined text-lg" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
        {icon}
      </span>
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
};

// ── Authenticated App Layout ────────────────────────────────────
const AppLayout = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
      <nav className="sticky top-0 z-50 bg-[#0B0E14]/80 backdrop-blur-xl shadow-[0_4px_24px_0_rgba(138,43,226,0.08)] border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 h-16">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <span className="material-symbols-outlined text-primary text-2xl transition-transform group-hover:rotate-12" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
            <span className="text-xl font-bold text-white tracking-widest font-headline">EduNova</span>
          </Link>
          <div className="flex items-center gap-1">
            <NavLink to="/dashboard" icon="dashboard" label="Dashboard" />
            <NavLink to="/progress" icon="insights" label="Progress" />
            <NavLink to="/tasks" icon="checklist" label="Tasks" />
            <NavLink to="/materials" icon="folder_open" label="Materials" />
            <NavLink to="/chat" icon="smart_toy" label="AI Tutor" />
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden md:inline text-sm text-on-surface-variant font-medium mr-1">
                {user.firstName || 'Navigator'}
              </span>
            )}
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: 'w-9 h-9 shadow-[0_0_12px_rgba(138,43,226,0.3)]',
                  userButtonPopoverCard: 'bg-surface-container border border-outline-variant/10',
                  userButtonPopoverActionButton: 'text-on-surface hover:bg-surface-container-high',
                  userButtonPopoverActionButtonText: 'text-on-surface',
                  userButtonPopoverActionButtonIcon: 'text-on-surface-variant',
                  userButtonPopoverFooter: 'hidden'
                }
              }}
            />
          </div>
        </div>
      </nav>
      <main className="flex-1 flex flex-col">
        <div className="animate-cosmic-fade">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// ── Protected Route Wrapper ─────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut><Navigate to="/sign-in" replace /></SignedOut>
    </>
  );
};

// ── Root App ────────────────────────────────────────────────────
function App() {
  if (!CLERK_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest text-on-surface p-8">
        <div className="max-w-lg text-center space-y-4">
          <span className="material-symbols-outlined text-error text-5xl">error</span>
          <h1 className="font-headline text-2xl font-bold text-white">Clerk Key Missing</h1>
          <p className="text-on-surface-variant">
            Set <code className="px-2 py-0.5 rounded bg-surface-container text-primary text-sm">VITE_CLERK_PUBLISHABLE_KEY</code> in 
            <code className="px-2 py-0.5 rounded bg-surface-container text-primary text-sm ml-1">client/.env</code>
          </p>
          <div className="bg-surface-container rounded-xl p-4 text-left text-sm text-on-surface-variant font-mono">
            <p># client/.env</p>
            <p>VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/sign-in/*" element={<SignInPage />} />
                <Route path="/sign-up/*" element={<SignUpPage />} />
                <Route path="/onboarding" element={<Onboarding />} />
                
                {/* Protected routes */}
                <Route element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/learn/:topicId" element={<Learn />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/progress" element={<ProgressPage />} />
                  <Route path="/tasks" element={<TodoPage />} />
                  <Route path="/materials" element={<MaterialsPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ClerkProvider>
  );
}

export default App;
