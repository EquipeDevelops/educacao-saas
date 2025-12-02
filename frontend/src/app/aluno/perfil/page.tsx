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
  const { error, isLoading, profile, modifyPerfil } = useAlunoPerfil();
  const [activeModal, setActiveModal] = useState(false);
  const [email, setEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');

  useEffect(() => {
    if (profile) {
      setEmail(profile?.email);
      setSenhaAtual('');
      setSenhaNova('');
    }
  }, [isLoading]);

  async function modificarEmailESenha(event: SubmitEvent) {
    event.preventDefault();

    modifyPerfil(email, senhaNova, senhaAtual);
  }

  function getInitials(name: string | undefined): string {
    if (!name) {
      return '...';
    }
    const nameParts = name.trim().split(' ');

    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }

    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];

    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  if (isLoading) {
    return <Loading />;
  }
  if (!profile) {
    return <ErrorMsg text={'Erro ao carregar o perfil'} />;
  }

  console.log('Profile Data:', profile);

  return (
    <>
      {' '}
      <Section childrenWidth={1300}>
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
              <button onClick={() => setActiveModal(true)}>
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
      <Modal isOpen={activeModal} setIsOpen={setActiveModal} maxWidth={700}>
        <div className={styles.modalContainer}>
          <h2>Modificar email ou senha</h2>
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
                value={senhaNova}
                onChange={({ target }) => setSenhaNova(target.value)}
              />
            </label>
            {error && <ErrorMsg text={error} />}
            <div className={styles.buttons}>
              <button onClick={() => setActiveModal(false)}>Cancelar</button>
              <button type="submit">Modificar</button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
