import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onAdminClick?: () => void;
  showAdminButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onAdminClick, showAdminButton }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between max-w-6xl">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-[1000] tracking-tighter text-black leading-none">acritica</span>
              <span className="text-2xl font-[300] tracking-tighter text-[#00e5ff] leading-none">lab</span>
            </div>
            <span className="mono text-[10px] font-black text-[#00e5ff] tracking-[0.2em] uppercase mt-1">
              editorial_xp
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {showAdminButton && (
            <button
              onClick={onAdminClick}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Admin
            </button>
          )}
          
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-black text-black uppercase tracking-widest">{user.name}</span>
            <span className="text-[9px] text-slate-400 font-bold mono">{user.role === 'admin' ? 'ADMIN' : 'XP_ACCESS'}</span>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 hover:border-[#00e5ff] transition-all"
          >
            <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
