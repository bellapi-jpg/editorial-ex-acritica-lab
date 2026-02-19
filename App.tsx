import React, { useState, useEffect } from 'react';
import { User } from './src/types';
import Login from './src/components/Login';
import Editor from './src/components/Editor';
import Header from './src/components/Header';
import AdminPanel from './src/components/AdminPanel';
import { SocialAutomation } from './src/components/SocialAutomation';

type AppView = 'editor' | 'social' | 'admin';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>('editor');

  useEffect(() => {
    const savedUser = localStorage.getItem('acritica_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (email: string, name: string, role: string) => {
    const newUser: User = {
      email,
      name,
      role,
      photoUrl: `https://picsum.photos/seed/${email}/100`
    };
    setUser(newUser);
    localStorage.setItem('acritica_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    setView('editor');
    localStorage.removeItem('acritica_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const navItems: { id: AppView; label: string; adminOnly?: boolean }[] = [
    { id: 'editor', label: 'Editor' },
    { id: 'social', label: 'Social Auto' },
    { id: 'admin', label: 'Admin', adminOnly: true },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header
        user={user}
        onLogout={handleLogout}
        onAdminClick={() => setView(view === 'admin' ? 'editor' : 'admin')}
        showAdminButton={user.role === 'admin'}
      />

      {/* Secondary navigation */}
      <div className="border-b border-slate-100">
        <div className="container mx-auto px-4 max-w-6xl flex">
          {navItems
            .filter((item) => !item.adminOnly || user.role === 'admin')
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`px-4 py-2.5 text-[10px] mono uppercase tracking-widest font-bold border-b-2 -mb-px transition-colors ${
                  view === item.id
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 py-10 max-w-6xl">
        {view === 'editor' && <Editor />}
        {view === 'social' && <SocialAutomation />}
        {view === 'admin' && <AdminPanel />}
      </main>

      <footer className="py-16 border-t border-slate-50">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-slate-400 text-[10px] mono uppercase tracking-widest font-bold">
            acritica lab // internal tooling — v0.4
          </p>
          <p className="text-slate-400 text-[9px] mono uppercase tracking-[0.2em] font-medium opacity-80">
            shipped by Studio C
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
