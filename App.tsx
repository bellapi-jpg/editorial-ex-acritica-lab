import React, { useState, useEffect } from 'react';
import { User } from './src/types';
import Login from './src/components/Login';
import Editor from './src/components/Editor';
import Header from './src/components/Header';
import AdminPanel from './src/components/AdminPanel';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

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
    setShowAdmin(false);
    localStorage.removeItem('acritica_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onAdminClick={() => setShowAdmin(!showAdmin)}
        showAdminButton={user.role === 'admin'}
      />
      <main className="flex-grow container mx-auto px-4 py-16 max-w-6xl">
        {showAdmin ? <AdminPanel /> : <Editor />}
      </main>
      <footer className="py-16 border-t border-slate-50">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-slate-400 text-[10px] mono uppercase tracking-widest font-bold">
            acritica lab // internal tooling — v0.3
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
