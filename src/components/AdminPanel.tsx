import React, { useState, useEffect } from 'react';
import { getAllUsers, addUser, removeUser } from '../supabaseClient';

interface AuthorizedUser {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newEmail || !newName) {
      setError('Preencha email e nome');
      return;
    }

    try {
      await addUser(newEmail, newName, newRole);
      setSuccess('Usuário adicionado!');
      setNewEmail('');
      setNewName('');
      setNewRole('user');
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar');
    }
  };

  const handleRemoveUser = async (id: number, email: string) => {
    if (!confirm(`Remover ${email}?`)) return;
    
    try {
      await removeUser(id);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Erro ao remover');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-[3px] w-8 bg-[#00e5ff] rounded-full"></div>
        <h2 className="text-black font-[1000] text-2xl md:text-3xl tracking-tighter uppercase">Painel Admin</h2>
      </div>

      {/* Formulário para adicionar usuário */}
      <div className="bg-white rounded-[24px] p-6 md:p-8 border-2 border-slate-200 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest mb-6">Adicionar Usuário</h3>
        
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-black outline-none font-medium"
            />
            <input
              type="text"
              placeholder="Nome"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-black outline-none font-medium"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-black outline-none font-medium"
            >
              <option value="user">Usuário</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <button
            type="submit"
            className="h-12 px-8 bg-black text-white rounded-xl font-black text-[11px] tracking-widest uppercase hover:bg-slate-800 transition-all"
          >
            Adicionar
          </button>
        </form>

        {error && <p className="mt-4 text-red-500 text-sm font-bold">{error}</p>}
        {success && <p className="mt-4 text-green-500 text-sm font-bold">{success}</p>}
      </div>

      {/* Lista de usuários */}
      <div className="bg-white rounded-[24px] p-6 md:p-8 border-2 border-slate-200 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-widest mb-6">Usuários Autorizados</h3>
        
        {loading ? (
          <p className="text-slate-400">Carregando...</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
              >
                <div className="flex-grow">
                  <p className="font-bold text-black">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                    user.role === 'admin' 
                      ? 'bg-[#00e5ff] text-black' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {user.role}
                  </span>
                  <button
                    onClick={() => handleRemoveUser(user.id, user.email)}
                    className="text-red-500 hover:text-red-700 text-sm font-bold"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
