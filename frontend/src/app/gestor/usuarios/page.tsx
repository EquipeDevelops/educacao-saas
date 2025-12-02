'use client';

import { useState, useEffect, useMemo, FormEvent, ChangeEvent } from 'react';
import { api } from '@/services/api';
import styles from './usuarios.module.css';
import Loading from '@/components/loading/Loading';
import Modal from '@/components/modal/Modal';
import ImportarAlunosModal from '@/components/gestor/usuarios/ImportarAlunosModal';
import { FiPlus, FiSearch, FiUpload, FiEdit, FiTrash2 } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Section from '@/components/section/Section';
import { LuPlus, LuSearch, LuUpload } from 'react-icons/lu';

type PapelUsuario = 'PROFESSOR' | 'ALUNO' | 'RESPONSAVEL';

type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  status: boolean;
  perfil_professor?: { titulacao?: string };
  perfil_aluno?: { numero_matricula?: string };
  perfil_responsavel?: { telefone?: string };
};

type ResponsavelAlunoForm = {
  alunoId: string;
  parentesco: string;
  principal: boolean;
};

type AlunoOption = {
  id: string;
  numero_matricula: string;
  usuario: {
    id: string;
    nome: string;
  };
};

type FormState = {
  nome: string;
  email: string;
  senha: string;
  papel: PapelUsuario;
  numero_matricula: string;
  titulacao: string;
  telefone: string;
  responsavelAlunos: ResponsavelAlunoForm[];
};

const createInitialState = (): FormState => ({
  nome: '',
  email: '',
  senha: '',
  papel: 'PROFESSOR',
  numero_matricula: '',
  titulacao: '',
  telefone: '',
  responsavelAlunos: [
    {
      alunoId: '',
      parentesco: '',
      principal: true,
    },
  ],
});

export default function GestorUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [alunoOptions, setAlunoOptions] = useState<AlunoOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [filtroPapel, setFiltroPapel] = useState('TODOS');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [formState, setFormState] = useState<FormState>(() =>
    createInitialState(),
  );
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const fetchUsuarios = () => {
    setIsLoading(true);
    Promise.all([
      api.get<Usuario[]>('/usuarios'),
      api.get<AlunoOption[]>('/alunos'),
    ])
      .then(([usuariosResponse, alunosResponse]) => {
        setUsuarios(usuariosResponse.data);
        setAlunoOptions(alunosResponse.data);
      })
      .catch(() =>
        toast.error('Falha ao carregar os usuários ou alunos disponíveis.'),
      )
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === 'papel') {
      const novoPapel = value as PapelUsuario;
      setFormState((prev) => ({
        ...prev,
        papel: novoPapel,
        numero_matricula: '',
        titulacao: '',
        telefone: '',
        responsavelAlunos:
          novoPapel === 'RESPONSAVEL'
            ? prev.responsavelAlunos.length > 0
              ? prev.responsavelAlunos
              : [
                  {
                    alunoId: '',
                    parentesco: '',
                    principal: true,
                  },
                ]
            : [],
      }));
      return;
    }

    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleResponsavelAlunoChange = (
    index: number,
    field: keyof ResponsavelAlunoForm,
    value: string | boolean,
  ) => {
    setFormState((prev) => {
      const updated = [...prev.responsavelAlunos];
      updated[index] = {
        ...updated[index],
        [field]: value,
      } as ResponsavelAlunoForm;
      return { ...prev, responsavelAlunos: updated };
    });
  };

  const addResponsavelAluno = () => {
    setFormState((prev) => ({
      ...prev,
      responsavelAlunos: [
        ...prev.responsavelAlunos,
        { alunoId: '', parentesco: '', principal: false },
      ],
    }));
  };

  const removeResponsavelAluno = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      responsavelAlunos: prev.responsavelAlunos.filter((_, i) => i !== index),
    }));
  };

  const handleEditInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (!editingUser) return;
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const finalValue = isCheckbox
      ? (e.target as HTMLInputElement).checked
      : value;

    if (name === 'titulacao') {
      setEditingUser({
        ...editingUser,
        perfil_professor: { ...editingUser.perfil_professor, titulacao: value },
      });
    } else {
      setEditingUser({ ...editingUser, [name]: finalValue });
    }
  };

  const openCreateModal = () => {
    setFormState(createInitialState());
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user: Usuario) => {
    setEditingUser(JSON.parse(JSON.stringify(user)));
    setIsEditModalOpen(true);
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const payload: any = {
      nome: formState.nome,
      email: formState.email,
      senha: formState.senha,
      papel: formState.papel,
    };

    if (formState.papel === 'ALUNO') {
      if (!formState.numero_matricula) {
        toast.error('O número de matrícula é obrigatório para alunos.');
        return;
      }
      payload.perfil_aluno = { numero_matricula: formState.numero_matricula };
    } else if (formState.papel === 'PROFESSOR') {
      payload.perfil_professor = {
        titulacao: formState.titulacao || undefined,
      };
    } else if (formState.papel === 'RESPONSAVEL') {
      const alunosVinculados = formState.responsavelAlunos
        .filter((aluno) => aluno.alunoId)
        .map((aluno) => ({
          alunoId: aluno.alunoId,
          parentesco: aluno.parentesco || undefined,
          principal: aluno.principal,
        }));

      payload.perfil_responsavel = {
        telefone: formState.telefone || undefined,
        alunos: alunosVinculados,
      };
    }

    const toastId = toast.loading('Criando usuário...');
    try {
      await api.post('/usuarios', payload);
      toast.update(toastId, {
        render: `Usuário "${formState.nome}" criado com sucesso!`,
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      closeModal();
      fetchUsuarios();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao criar o usuário.';
      toast.update(toastId, {
        render: message,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    }
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (!editingUser) return;

    const payload = {
      nome: editingUser.nome,
      status: editingUser.status,
      perfil_professor: {
        titulacao: editingUser.perfil_professor?.titulacao,
      },
    };

    const toastId = toast.loading('Atualizando usuário...');
    try {
      await api.put(`/usuarios/${editingUser.id}`, payload);
      toast.update(toastId, {
        render: 'Usuário atualizado com sucesso!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      closeModal();
      fetchUsuarios();
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Erro ao atualizar o usuário.';
      toast.update(toastId, {
        render: message,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    }
  }

  async function handleDelete(user: Usuario) {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o usuário "${user.nome}"? Esta ação é irreversível.`,
      )
    ) {
      const toastId = toast.loading('Excluindo usuário...');
      try {
        await api.delete(`/usuarios/${user.id}`);
        toast.update(toastId, {
          render: `Usuário "${user.nome}" excluído!`,
          type: 'info',
          isLoading: false,
          autoClose: 3000,
        });
        fetchUsuarios();
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Erro ao excluir o usuário.';
        toast.update(toastId, {
          render: message,
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        });
      }
    }
  }

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedUserIds(
      e.target.checked ? usuariosFiltrados.map((u) => u.id) : [],
    );
  };

  const handleSelectOne = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleBulkAction = async (
    action: 'activate' | 'deactivate' | 'delete',
  ) => {
    const actionTextMap = {
      activate: 'ativar',
      deactivate: 'desativar',
      delete: 'excluir',
    };
    if (
      window.confirm(
        `Tem certeza que deseja ${actionTextMap[action]} ${selectedUserIds.length} usuário(s) selecionado(s)?`,
      )
    ) {
      const toastId = toast.loading('Processando ação em massa...');
      const promises = selectedUserIds.map((id) => {
        if (action === 'delete') return api.delete(`/usuarios/${id}`);
        return api.patch(`/usuarios/${id}`, { status: action === 'activate' });
      });

      try {
        await Promise.all(promises);
        toast.update(toastId, {
          render: 'Ação em massa concluída com sucesso!',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
        setSelectedUserIds([]);
        fetchUsuarios();
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Erro ao executar ação em massa.';
        toast.update(toastId, {
          render: message,
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        });
      }
    }
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(
      (user) =>
        (user.nome.toLowerCase().includes(filtro.toLowerCase()) ||
          user.email.toLowerCase().includes(filtro.toLowerCase())) &&
        (filtroPapel === 'TODOS' || user.papel === filtroPapel) &&
        (filtroStatus === 'TODOS' || String(user.status) === filtroStatus),
    );
  }, [usuarios, filtro, filtroPapel, filtroStatus]);

  if (isLoading) {
    return (
      <Section>
        <Loading />
      </Section>
    );
  }

  return (
    <Section>
      <ToastContainer position="top-right" autoClose={3000} />
      <header className={styles.header}>
        <h1>Gerenciamento de Usuários</h1>
        <div className={styles.actions}>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className={styles.button}
          >
            <LuUpload className={styles.iconInline} /> Importar Alunos
          </button>
          <button onClick={openCreateModal} className={styles.buttonPrimary}>
            <LuPlus className={styles.iconInline} /> Novo Usuário
          </button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <LuSearch className={styles.iconInline} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          <select
            value={filtroPapel}
            onChange={(e) => setFiltroPapel(e.target.value)}
          >
            <option value="TODOS">Todos os Papéis</option>
            <option value="PROFESSOR">Professores</option>
            <option value="ALUNO">Alunos</option>
            <option value="RESPONSAVEL">Responsáveis</option>
          </select>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="TODOS">Todos os Status</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>
      </div>

      {selectedUserIds.length > 0 && (
        <div className={styles.bulkActionsContainer}>
          <span>{selectedUserIds.length} selecionado(s)</span>
          <button onClick={() => handleBulkAction('activate')}>Ativar</button>
          <button onClick={() => handleBulkAction('deactivate')}>
            Desativar
          </button>
          <button
            className={styles.bulkDeleteButton}
            onClick={() => handleBulkAction('delete')}
          >
            Excluir
          </button>
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.userTable}>
          <thead>
            <tr>
              <th className={styles.thCheckbox}>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    selectedUserIds.length === usuariosFiltrados.length &&
                    usuariosFiltrados.length > 0
                  }
                />
              </th>
              <th>Nome</th>
              <th>Email</th>
              <th>Papel</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length > 0 ? (
              usuariosFiltrados.map((user) => (
                <tr
                  key={user.id}
                  className={
                    selectedUserIds.includes(user.id) ? styles.selectedRow : ''
                  }
                >
                  <td className={styles.tdCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => handleSelectOne(user.id)}
                    />
                  </td>
                  <td>{user.nome}</td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className={`${styles.roleTag} ${
                        styles[user.papel.toLowerCase()]
                      }`}
                    >
                      {user.papel}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        user.status
                          ? styles.statusActive
                          : styles.statusInactive
                      }
                    >
                      {user.status ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className={styles.actionButtons}>
                    <button
                      onClick={() => openEditModal(user)}
                      className={styles.buttonPrimary}
                      title="Editar"
                    >
                      <FiEdit className={styles.icon} />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className={styles.buttonPrimary}
                      title="Excluir"
                    >
                      <FiTrash2 className={styles.icon} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>
                  Nenhum usuário encontrado com os filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={closeModal}
        title="Criar Novo Usuário"
        width={600}
      >
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <label className={styles.label}>Nome Completo*</label>
          <input
            type='text'
            name="nome"
            value={formState.nome}
            onChange={handleInputChange}
            required
          />
          <label className={styles.label}>Email*</label>
          <input
            type="email"
            name="email"
            value={formState.email}
            onChange={handleInputChange}
            required
          />
          <label className={styles.label}>Senha Provisória*</label>
          <input
            type="password"
            name="senha"
            value={formState.senha}
            onChange={handleInputChange}
            required
          />
          <label className={styles.label}>Papel*</label>
          <select
            name="papel"
            value={formState.papel}
            onChange={handleInputChange}
          >
            <option value="PROFESSOR">Professor</option>
            <option value="ALUNO">Aluno</option>
            <option value="RESPONSAVEL">Responsável</option>
          </select>
          {formState.papel === 'ALUNO' && (
            <>
              <label className={styles.label}>Número de Matrícula*</label>
              <input
                name="numero_matricula"
                value={formState.numero_matricula}
                onChange={handleInputChange}
                required
              />
            </>
          )}
          {formState.papel === 'PROFESSOR' && (
            <>
              <label className={styles.label}>Titulação</label>
              <input
                name="titulacao"
                type="text"
                value={formState.titulacao}
                onChange={handleInputChange}
                placeholder="Ex: Mestre, Doutor"
              />
            </>
          )}
          {formState.papel === 'RESPONSAVEL' &&
            (() => {
              const remainingOptions = alunoOptions.filter(
                (option) =>
                  !formState.responsavelAlunos.some(
                    (aluno) => aluno.alunoId === option.id,
                  ),
              );

              return (
                <div className={styles.responsavelSection}>
                  <label className={styles.label}>Telefone</label>
                  <input
                    name="telefone"
                    value={formState.telefone}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                  />
                  <div className={styles.responsavelAlunosHeader}>
                    <h4>Alunos vinculados</h4>
                    <button
                      type="button"
                      className={styles.addAlunoButton}
                      onClick={addResponsavelAluno}
                      disabled={remainingOptions.length === 0}
                    >
                      <FiPlus /> Adicionar aluno
                    </button>
                  </div>
                  {formState.responsavelAlunos.length === 0 ? (
                    <p className={styles.responsavelEmpty}>
                      Nenhum aluno selecionado para este responsável.
                    </p>
                  ) : (
                    formState.responsavelAlunos.map(
                      (responsavelAluno, index) => {
                        const availableOptions = alunoOptions.filter(
                          (option) => {
                            if (responsavelAluno.alunoId === option.id)
                              return true;
                            return !formState.responsavelAlunos.some(
                              (aluno, alunoIndex) =>
                                alunoIndex !== index &&
                                aluno.alunoId === option.id,
                            );
                          },
                        );

                        return (
                          <div
                            key={`${responsavelAluno.alunoId}-${index}`}
                            className={styles.responsavelAlunoRow}
                          >
                            <label>
                              Aluno
                              <select
                                value={responsavelAluno.alunoId}
                                onChange={(event) =>
                                  handleResponsavelAlunoChange(
                                    index,
                                    'alunoId',
                                    event.target.value,
                                  )
                                }
                              >
                                <option value="">Selecione um aluno</option>
                                {availableOptions.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.usuario.nome} (
                                    {option.numero_matricula})
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Parentesco
                              <input
                                type="text"
                                value={responsavelAluno.parentesco}
                                onChange={(event) =>
                                  handleResponsavelAlunoChange(
                                    index,
                                    'parentesco',
                                    event.target.value,
                                  )
                                }
                                placeholder="Ex.: Pai, Mãe, Tio(a)"
                              />
                            </label>
                            <label className={styles.checkboxContainer}>
                              <input
                                type="checkbox"
                                checked={responsavelAluno.principal}
                                onChange={(event) =>
                                  handleResponsavelAlunoChange(
                                    index,
                                    'principal',
                                    event.target.checked,
                                  )
                                }
                              />
                              Principal
                            </label>
                            <button
                              type="button"
                              className={styles.removeAlunoButton}
                              onClick={() => removeResponsavelAluno(index)}
                              title="Remover aluno"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        );
                      },
                    )
                  )}
                  <span className={styles.helperText}>
                    Você poderá gerenciar os vínculos depois na área de
                    responsáveis.
                  </span>
                </div>
              );
            })()}
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={closeModal}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton}>
              Salvar
            </button>
          </div>
        </form>
      </Modal>

      {editingUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeModal}
          title={`Editar Usuário: ${editingUser.nome}`}
        >
          <form onSubmit={handleUpdate} className={styles.modalForm}>
            <label className={styles.label}>Nome Completo*</label>
            <input
              name="nome"
              type='text'
              value={editingUser.nome}
              onChange={handleEditInputChange}
              required
            />
            <label className={styles.label}>Email</label>
            <input type="email" value={editingUser.email} disabled />
            {editingUser.papel === 'PROFESSOR' && (
              <>
                <label className={styles.label}>Titulação</label>
                <input
                  name="titulacao"
                  value={editingUser.perfil_professor?.titulacao || ''}
                  onChange={handleEditInputChange}
                />
              </>
            )}
            <div className={styles.checkboxContainer}>
              <input
                type="checkbox"
                name="status"
                checked={!!editingUser.status}
                onChange={handleEditInputChange}
                id="status-edit"
              />
              <label htmlFor="status-edit">Usuário Ativo</label>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={closeModal}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.saveButton}>
                Salvar Alterações
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ImportarAlunosModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          setIsImportModalOpen(false);
          fetchUsuarios();
        }}
      />
    </Section>
  );
}
