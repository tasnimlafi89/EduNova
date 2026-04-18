import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Landing } from './pages/Landing';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Learn } from './pages/Learn';
import { ChatPage } from './pages/ChatPage';
import { ProgressPage } from './pages/ProgressPage';

const queryClient = new QueryClient();

// Main Layout for authenticated pages
const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface">
      <nav className="sticky top-0 z-50 bg-[#0B0E14]/80 backdrop-blur-md shadow-[0_4px_24px_0_rgba(138,43,226,0.1)] border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8 h-16">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">rocket_launch</span>
            <span className="text-xl font-bold text-white tracking-widest font-headline">EduNova</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-on-surface-variant hover:text-white transition-colors font-medium">Dashboard</Link>
            <Link to="/progress" className="text-on-surface-variant hover:text-white transition-colors font-medium">Progress</Link>
            <Link to="/chat" className="text-on-surface-variant hover:text-white transition-colors font-medium">Tutor AI</Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-sm">
              S
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/learn/:topicId" element={<Learn />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/progress" element={<ProgressPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
