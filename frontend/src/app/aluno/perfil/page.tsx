'use client';

import ErrorMsg from '@/components/errorMsg/ErrorMsg';
import Loading from '@/components/loading/Loading';
import Section from '@/components/section/Section';
import { useAlunoPerfil } from '@/hooks/perfilAluno/useAlunoPerfil';
import {
  LuPencilLine,
  LuMail,
  LuCalendarDays,
  LuFileText,
  LuLockKeyholeOpen,
  LuLockKeyhole,
} from 'react-icons/lu';
import { MdPerson } from 'react-icons/md';
import { VscMortarBoard } from 'react-icons/vsc';
import styles from './aluno.module.css';
import { useEffect, useState } from 'react';
import Modal from '@/components/modal/Modal';

export default function PerfilPage() {
  const {
    error: hookError,
    isLoading,
    profile,
    modifyPerfil,
  } = useAlunoPerfil();
  const [activeModal, setActiveModal] = useState(false);
  const [email, setEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setEmail(profile?.email);
      setSenhaAtual('');
      setSenhaNova('');
      setConfirmarSenha('');
      setLocalError(null);
    }
  }, [isLoading, profile]);

  async function modificarEmailESenha(event: React.FormEvent) {
    event.preventDefault();
    setLocalError(null);

    if (senhaNova && senhaNova !== confirmarSenha) {
      setLocalError('As senhas não coincidem.');
      return;
    }

    await modifyPerfil(email, senhaNova, senhaAtual);
    // Close modal if successful? The hook doesn't return success status easily,
    // but usually we might want to close it or wait for profile update.
    // For now, let's keep it open or let the user close it,
    // but clearing passwords might be good if successful.
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  if (isLoading) {
    return <Loading />;
  }
  if (!profile) {
    return <ErrorMsg text={'Erro ao carregar o perfil'} />;
  }

  const error = localError || hookError;

  return (
    <>
      <Section maxWidth={1300}>
        {/* ... (profile display remains same) ... */}
        <div className={styles.perfilContainer}>
          <h1>Meu perfil</h1>
          <div className={styles.cardsContainer}>
            <div className={styles.perfilCard}>
              <div className={styles.infoAluno}>
                <div
                  className={styles.infoIniciais}
                  style={{
                    backgroundImage: profile.fotoUrl
                      ? `url(${profile.fotoUrl})`
                      : '',
                  }}
                >
                  {!profile.fotoUrl ? getInitials(profile.nome) : ''}
                </div>
                <div>
                  <h3>{profile.nome}</h3>
                  <p>
                    <span>{profile.turma}</span>
                    <span>{profile.escola}</span>
                  </p>
                  <span
                    className={`${styles.status} ${
                      profile.status
                        ? styles.activeStatus
                        : styles.inativeStatus
                    }`}
                  >
                    Aluno {profile.status ? 'ativo' : 'inativo'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(true)}
                className={styles.buttonEditarPerfil}
              >
                <LuPencilLine /> Editar Perfil
              </button>
            </div>
            <div className={styles.infoPessoais}>
              <h2>Informações Pessoais</h2>
              <ul>
                <li>
                  <h4>
                    <LuMail /> Email
                  </h4>
                  <p>{profile.email}</p>
                </li>
                <li>
                  <h4>
                    <LuCalendarDays /> Data de nascimento
                  </h4>
                  <p>
                    {profile.dataNascimento
                      ? new Date(profile.dataNascimento).toLocaleDateString(
                          'pt-br',
                        )
                      : 'Informação não existe'}
                  </p>
                </li>
                <li>
                  <h4>
                    <LuFileText /> Matrícula
                  </h4>
                  <p>{profile.numeroMatricula}</p>
                </li>
              </ul>
            </div>
            <div className={styles.infoAcademicas}>
              <h2>Informações Acadêmicas</h2>
              <ul>
                <li>
                  <h4>
                    <VscMortarBoard /> Série/Ano
                  </h4>
                  <p>{profile.turma}</p>
                </li>
                <li>
                  <h4>
                    <MdPerson /> Escola
                  </h4>
                  <p>{profile.escola}</p>
                </li>
                <li>
                  <h4>
                    <LuMail /> Email Responsável
                  </h4>
                  <p>{profile.emailResponsavel || 'emailexemplo@gmail.com'}</p>
                </li>
              </ul>
            </div>
            <div className={styles.estatisticas}>
              <h2>Estátisticas Detalhadas</h2>
              <ul>
                <li>
                  {profile.totalAtividadesEntregues}
                  <p>Atividades entregues</p>
                </li>
                <li>
                  {profile.provasFeitas}
                  <p>Provas Feitas</p>
                </li>
                <li>
                  {profile.mediaGlobal}
                  <p>Média Geral</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>
      <Modal
        isOpen={activeModal}
        title="Modificar email ou senha"
        showCloseButton={true}
        onClose={() => setActiveModal(false)}
        width={700}
      >
        <div className={styles.modalContainer}>
          <form onSubmit={modificarEmailESenha} className={styles.formulario}>
            <label>
              <p>
                <LuMail /> Email:
              </p>
              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={({ target }) => setEmail(target.value)}
              />
            </label>
            <label>
              <p>
                <LuLockKeyhole /> Senha Atual:
              </p>
              <input
                type="password"
                placeholder="Senha Atual"
                value={senhaAtual}
                onChange={({ target }) => setSenhaAtual(target.value)}
              />
            </label>
            <label>
              <p>
                <LuLockKeyholeOpen /> Senha nova:
              </p>
              <input
                type="password"
                placeholder="Senha nova"
                value={senhaNova}
                onChange={({ target }) => setSenhaNova(target.value)}
              />
            </label>
            <label>
              <p>
                <LuLockKeyholeOpen /> Confirmar senha:
              </p>
              <input
                type="password"
                placeholder="Confirmar senha"
                value={confirmarSenha}
                onChange={({ target }) => setConfirmarSenha(target.value)}
              />
            </label>
            {error && <ErrorMsg text={error} />}
            <div className={styles.buttons}>
              <button type="button" onClick={() => setActiveModal(false)}>
                Cancelar
              </button>
              <button type="submit">Modificar</button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
