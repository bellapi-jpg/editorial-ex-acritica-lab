import React, { useState } from 'react';
import { isEmailAuthorized, getAuthorizedUser } from '../supabaseClient';

interface LoginProps {
  onLogin: (email: string, name: string, role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Verifica se o email está autorizado no Supabase
      const isAuthorized = await isEmailAuthorized(email);
      
      if (!isAuthorized) {
        setError('Acesso negado: Email não autorizado');
        setIsLoading(false);
        return;
      }

      // Busca os dados do usuário
      const user = await getAuthorizedUser(email);
      
      if (user) {
        onLogin(user.email, user.name, user.role);
      } else {
        setError('Erro ao carregar dados do usuário');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-white">
      <div className="w-full max-w-[420px] space-y-10 md:space-y-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center items-baseline gap-1">
            <h1 className="text-4xl md:text-6xl font-[1000] tracking-tighter text-black">acritica</h1>
            <h1 className="text-4xl md:text-6xl font-[200] tracking-tighter text-[#00e5ff]">lab</h1>
          </div>
          <div className="inline-block px-4 py-1.5 bg-black rounded-xl">
             <span className="mono text-[10px] md:text-[11px] font-black text-[#00e5ff] tracking-widest uppercase italic">editorial_xp</span>
          </div>
        </div>

        <div className="bg-white p-1.5 md:p-2 rounded-[32px] md:rounded-[40px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-slate-100">
          <form onSubmit={handleLogin} className="p-6 md:p-8 space-y-8">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mono">A CRÍTICA ID</label>
                <div className="flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                   <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mono italic">secured</span>
                </div>
              </div>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full h-14 bg-slate-50 border border-slate-200 rounded-[22px] px-6 text-black input-tech-focus transition-all outline-none font-medium text-lg placeholder:text-slate-300"
                required
              />
            </div>

            {error && <p className="text-[10px] font-bold text-red-500 text-center mono uppercase">{error}</p>}

            <div className="flex justify-center pt-2">
              <button 
                disabled={isLoading}
                className="w-full md:w-auto px-10 h-12 bg-black text-white rounded-full font-black text-[10px] tracking-widest uppercase btn-tech-glow transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? "VERIFICANDO..." : "Acessar Lab"}
              </button>
            </div>
          </form>
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-slate-400 text-[10px] mono uppercase tracking-widest font-bold">
            acritica lab // internal tooling — v0.3
          </p>
          <p className="text-slate-400 text-[9px] mono uppercase tracking-[0.2em] font-medium opacity-80">
            shipped by Studio C
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
