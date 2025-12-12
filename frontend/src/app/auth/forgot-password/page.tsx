'use client';

import { useState, FormEvent } from 'react';
import { api } from '@/services/api';
import Link from 'next/link';
import styles from './forgot-password.module.css';
import imgLogin from '@/assets/imgs/loginImage.png';
import Image from 'next/image';
import ErrorMsg from '@/components/errorMsg/ErrorMsg';

type Step = 'email' | 'code';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSendCode(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      await api.post('/auth/forgot-password', { email });
      setMessage('Código de verificação enviado para seu e-mail!');
      setTimeout(() => {
        setStep('code');
        setMessage(null);
      }, 2000);
    } catch {
      setError(
        'Ocorreu um erro ao enviar o código. Tente novamente mais tarde.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    // Validate passwords match
    if (senha !== confirmacaoSenha) {
      setError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/reset-password', { code, senha, confirmacaoSenha });
      setMessage('Senha redefinida com sucesso! Redirecionando...');
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código inválido ou expirado.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className={styles.container}>
      <form
        onSubmit={step === 'email' ? handleSendCode : handleResetPassword}
        className={styles.form}
      >
        <div className={styles.title}>
          <h1>Recuperar Senha</h1>
          <p>
            {step === 'email'
              ? 'Digite seu e-mail para receber um código de verificação.'
              : 'Digite o código enviado para seu e-mail e defina uma nova senha.'}
          </p>
        </div>

        {message ? (
          <div className={styles.successMessage}>
            <p>{message}</p>
          </div>
        ) : (
          <>
            <div className={styles.inputs}>
              {step === 'email' ? (
                <label>
                  <p>E-mail</p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </label>
              ) : (
                <>
                  <label>
                    <p>Código de Verificação</p>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </label>
                  <label>
                    <p>Nova Senha</p>
                    <input
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      required
                    />
                  </label>
                  <label>
                    <p>Confirmar Nova Senha</p>
                    <input
                      type="password"
                      value={confirmacaoSenha}
                      onChange={(e) => setConfirmacaoSenha(e.target.value)}
                      placeholder="Digite a senha novamente"
                      minLength={6}
                      required
                    />
                  </label>
                </>
              )}
            </div>

            {error && <ErrorMsg text={error} />}

            <button
              type="submit"
              disabled={isLoading}
              className={styles.button}
            >
              {isLoading
                ? 'Processando...'
                : step === 'email'
                ? 'Enviar Código'
                : 'Redefinir Senha'}
            </button>
          </>
        )}

        <div className={styles.links}>
          {step === 'code' && (
            <button
              type="button"
              onClick={() => setStep('email')}
              className={styles.backLink}
            >
              Voltar para enviar novo código
            </button>
          )}
          <Link href="/auth/login" className={styles.backLink}>
            Voltar para o Login
          </Link>
        </div>
      </form>

      <div className={styles.imageContainer}>
        <Image src={imgLogin} alt="Imagem da tela de recuperação de senha" />
        <div className={styles.circle01}></div>
        <div className={styles.circle02}></div>
      </div>
    </section>
  );
}
