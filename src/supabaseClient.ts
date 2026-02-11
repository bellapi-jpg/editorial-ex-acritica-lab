import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verifica se um email está autorizado
export async function isEmailAuthorized(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('authorized_users')
    .select('email')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) {
    return false;
  }
  return true;
}

// Busca os dados do usuário autorizado
export async function getAuthorizedUser(email: string) {
  const { data, error } = await supabase
    .from('authorized_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) {
    return null;
  }
  return data;
}

// Busca todos os usuários (pra admin)
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('authorized_users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }
  return data;
}

// Adiciona um novo usuário (pra admin)
export async function addUser(email: string, name: string, role: string = 'user') {
  const { data, error } = await supabase
    .from('authorized_users')
    .insert([{ email: email.toLowerCase(), name, role }])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Remove um usuário (pra admin)
export async function removeUser(id: number) {
  const { error } = await supabase
    .from('authorized_users')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
  return true;
}
