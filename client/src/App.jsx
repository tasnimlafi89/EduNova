import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from './components/ui/Notification';
import { Landing } from './pages/Landing';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Learn } from './pages/Learn';
import { ChatPage } from './pages/ChatPage';
import { ProgressPage } from './pages/ProgressPage';
import { TodoPage } from './pages/TodoPage';
import { MaterialsPage } from './pages/MaterialsPage';

const queryClient = new QueryClient();

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

const AppLayout = () => {
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
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center font-bold text-sm shadow-[0_0_12px_rgba(138,43,226,0.3)]">
              S
            </div>
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/onboarding" element={<Onboarding />} />
            
            <Route element={<AppLayout />}>
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
  );
}

export default App;
