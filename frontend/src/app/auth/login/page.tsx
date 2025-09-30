'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import styles from './login.module.css';
import imgLogin from '@/assets/imgs/loginImage.png';
import Image from 'next/image';

export default function LoginPage() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signIn({ email, senha });
    } catch (err) {
      setError('Falha no login. Verifique seu email e senha.');
      setIsLoading(false);
    }
  }

  return (
    <section className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.title}>
          <h1>Educa+</h1>
          <p>Faça login para acessar o portal educa+ e utilizar a plataforma</p>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          required
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={isLoading} className={styles.button}>
          {isLoading ? 'Carregando...' : 'Entrar'}
        </button>
        <Link href="/forgot-password" className={styles.forgotPasswordLink}>
          Não lembro a senha
        </Link>
      </form>
      <div className={styles.imgImage}>
        <Image src={imgLogin} alt="Imagem da tela de login" />
        <div className={styles.circle01}></div>
        <div className={styles.circle02}></div>
      </div>
    </section>
  );
}
