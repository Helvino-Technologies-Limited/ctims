import { create } from 'zustand';
import api from '../config/api';

interface User {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  institution_id: string;
  institution_name: string;
  institution_type: string;
  logo_url?: string;
  student_id?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('ctims_token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data.data;
      localStorage.setItem('ctims_token', token);
      localStorage.setItem('ctims_user', JSON.stringify(user));
      set({ token, user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('ctims_token');
    localStorage.removeItem('ctims_user');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('ctims_token');
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.data });
    } catch {
      localStorage.removeItem('ctims_token');
      set({ user: null, token: null });
    }
  },
}));
