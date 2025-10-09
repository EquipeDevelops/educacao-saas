'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';
import Cookies from 'js-cookie';
import { User } from '@/types/users';

type AuthContextData = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
};

type SignInCredentials = {
  email: string;
  senha: string;
};

const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    async function handleFech() {
      try {
        const token = await fetch('/api/auth/me');
        const tokenData = await token.json()
        const userData = localStorage.getItem('plataforma.user');
  
        if (tokenData.token && userData) {
          setUser(JSON.parse(userData));
          api.defaults.headers.common['Authorization'] = `Bearer ${tokenData.token}`;
        }
        setLoading(false);
      } catch(error) {
        return error
      }

    }

    handleFech();
  }, []);

  async function signIn({ email, senha }: SignInCredentials) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const { token, usuario } = await response.json();

      localStorage.setItem('plataforma.user', JSON.stringify(usuario));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(usuario);
      
      switch (usuario.papel) {
        case 'ALUNO':
          router.push('/aluno');
          break;
        case 'ADMINISTRADOR':
          router.push('/administrador');
          break;
        case 'PROFESSOR':
          router.push('/professor');
          break;
        case 'GESTOR':
          router.push('/gestor');
          break;
        default:
          router.push('/');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw new Error('Email ou senha inválidos.');
    }
  }

  async function signOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('plataforma.user');

      setUser(null);
      delete api.defaults.headers.common['Authorization'];

      router.push('/auth/login');
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
