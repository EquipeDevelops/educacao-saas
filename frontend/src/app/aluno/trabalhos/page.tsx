'use client';

import Section from '@/components/section/Section';
import { useMinhasTarefas } from '@/hooks/tarefas/useMinhasTarefas';
import { TarefaComStatus } from '@/types/tarefas';
import { useEffect, useState } from 'react';
import styles from './trabalhos.module.css';
import Loading from '@/components/loading/Loading';
import {
  LuCalendar,
  LuInbox,
  LuFileText,
  LuDownload,
  LuMessageCircle,
  LuCircle,
  LuClock,
  LuCircleCheck,
  LuCircleArrowDown,
  LuFileArchive,
  LuFilter,
} from 'react-icons/lu';
import Link from 'next/link';
import Pagination from '@/components/paginacao/Paginacao';

function formatFileSize(bytes?: number) {
  if (!bytes) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const size = bytes / Math.pow(1024, index);
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function getFileExtension(name: string) {
  const parts = name.split('.');
  if (parts.length <= 1) return '';
  return parts[parts.length - 1];
}

export default function AtividadesPostadasPage() {
  const {
    error,
    isLoading,
    totalPages,
    page,
    setFilters,
    filters,
    materiasUnicas,
    tarefas: trabalhos,
    setPage,
  } = useMinhasTarefas();

  const [trabalhoSelecionado, setTrabalhoSelecionado] =
    useState<TarefaComStatus | null>(null);

  useEffect(() => {
    setTrabalhoSelecionado(null);
  }, [page, trabalhos]);

  useEffect(() => {
    setFilters((prev: any) => ({ ...prev, tipo: ['TRABALHO'] }));
  }, [setFilters]);

  const handleFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value } = event.target;
    setPage(1);
    setFilters((prev: any) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ status: '', materia: '', data: '', tipo: ['TRABALHO'] });
  };

  function getInitials(name: string | undefined): string {
    if (!name) return '...';
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1)
      return nameParts[0].substring(0, 2).toUpperCase();
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }

  const handlePageChange = (p: number) => {
    if (p < 1 || p > (totalPages || 1)) return;
    setPage(p);
  };

  if (isLoading) return <Loading />;
  if (error) {
    return (
      <Section>
        <div className={styles.container}>
          <h1>Trabalhos</h1>
          <p style={{ color: 'var(--cor-perigo)' }}>
            Ocorreu um erro ao carregar os trabalhos.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className={styles.container}>
        <h1>Trabalhos</h1>
        <p>Aqui você verá todos os trabalhos postados pelos professores</p>

        <div className={styles.filtersContainer}>
          <h2>
            <LuFilter /> Filtros
          </h2>

          <div className={styles.filtersContent}>
            <div className={styles.filtersGroup}>
              <label>
                <p>Status</p>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">Todos</option>
                  <option value="Avaliada">Avaliada</option>
                </select>
              </label>

              <label>
                <p>Materia</p>
                <select
                  name="materia"
                  value={filters.materia}
                  onChange={handleFilterChange}
                >
                  <option value="">Todas</option>
                  {materiasUnicas.map((materia) => (
                    <option key={materia} value={materia}>
                      {materia}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <p>Data de entrega</p>
                <input
                  type="date"
                  name="data"
                  value={filters.data}
                  onChange={handleFilterChange}
                />
              </label>
            </div>
            <button onClick={clearFilters} className={styles.clearButton}>
              Limpar filtros
            </button>
          </div>
        </div>

        <div className={styles.telasContainer}>
          <div className={styles.trabalhosContainer}>
            <ul className={styles.cardsContainer}>
              {trabalhos.length === 0 ? (
                <li className={styles.cardTrabalho} style={{ opacity: 0.8 }}>
                  Nenhum trabalho encontrado.
                </li>
              ) : (
                trabalhos.map((trabalho) => {
                  const ativo = trabalhoSelecionado?.id === trabalho.id;
                  return (
                    <li
                      key={trabalho.id}
                      className={`${styles.cardTrabalho} ${
                        ativo ? styles.activeTrabalho : ''
                      }`}
                      onClick={() => setTrabalhoSelecionado(trabalho)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          setTrabalhoSelecionado(trabalho);
                      }}
                    >
                      <div className={styles.materiaPontos}>
                        <h4>{trabalho.componenteCurricular.materia.nome}</h4>
                        <span>0 - {trabalho.pontos}</span>
                      </div>
                      <div className={styles.descricao}>
                        <h3>{trabalho.titulo}</h3>
                        {trabalho.descricao && <p>{trabalho.descricao}</p>}
                      </div>
                      <div className={styles.infoAdicionais}>
                        <div className={styles.professor}>
                          <span>
                            {getInitials(
                              trabalho.componenteCurricular.professor.usuario
                                .nome,
                            )}
                          </span>
                          <p>
                            Prof.{' '}
                            {
                              trabalho.componenteCurricular.professor.usuario
                                .nome
                            }
                          </p>
                        </div>
                        <p className={styles.prazo}>
                          <LuCalendar />{' '}
                          <span>
                            {new Date(trabalho.data_entrega).toLocaleDateString(
                              'pt-BR',
                            )}
                          </span>
                        </p>
                      </div>
                      <div className={styles.statusContainer}>
                        {trabalho.submissao?.status === 'EM_ANDAMENTO' ? (
                          <span className={styles.activeSpan}>
                            <LuClock /> Em andamento
                          </span>
                        ) : trabalho.submissao?.status === 'AVALIADA' ? (
                          <span className={styles.corrigidoSpan}>
                            <LuCircleCheck /> Corrigido
                          </span>
                        ) : trabalho.submissao?.status === 'ENVIADA' ? (
                          <span className={styles.activeSpan}>
                            <LuCircleArrowDown /> Enviado
                          </span>
                        ) : (
                          <span>
                            <LuCircle /> Não entregue
                          </span>
                        )}
                        {trabalho.metadata?.anexos?.length ? (
                          <p>
                            <LuFileArchive /> {trabalho.metadata.anexos.length}{' '}
                            {trabalho.metadata.anexos.length === 1
                              ? 'anexo'
                              : 'anexos'}
                          </p>
                        ) : (
                          ''
                        )}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>

            {totalPages > 1 && (
              <Pagination
                page={page || 1}
                totalPages={totalPages}
                onChange={handlePageChange}
                disabled={isLoading}
                maxButtons={7}
              />
            )}
          </div>

          <div className={styles.detalhesContainer}>
            {!trabalhoSelecionado ? (
              <div className={styles.mensagemNaoSelecionado}>
                <LuInbox />
                <h3>Selecione um trabalho para ver os detalhes</h3>
              </div>
            ) : (
              <div className={styles.detalhes}>
                <div className={styles.info}>
                  <p>{trabalhoSelecionado.componenteCurricular.materia.nome}</p>
                  <p>0 - {trabalhoSelecionado.pontos}</p>
                </div>
                <h2>{trabalhoSelecionado.titulo}</h2>
                <div className={styles.professorEPrazo}>
                  <div className={styles.professorNome}>
                    <span>
                      {getInitials(
                        trabalhoSelecionado.componenteCurricular.professor
                          .usuario.nome,
                      )}
                    </span>
                    <p>
                      Prof.{' '}
                      {
                        trabalhoSelecionado.componenteCurricular.professor
                          .usuario.nome
                      }
                    </p>
                  </div>
                  <p className={styles.prazoDetalhes}>
                    <LuCalendar />{' '}
                    <span>
                      {new Date(
                        trabalhoSelecionado.data_entrega,
                      ).toLocaleDateString('pt-BR')}
                    </span>
                  </p>
                </div>

                {trabalhoSelecionado.descricao && (
                  <div className={styles.descricaoDetalhes}>
                    <h3>Descrição</h3>
                    <p>{trabalhoSelecionado.descricao}</p>
                  </div>
                )}

                <div className={styles.requisitos}>
                  <h3>Requisitos</h3>
                  <ul>
                    {(trabalhoSelecionado.metadata?.requisitos ?? []).map(
                      (requisito, i) => (
                        <li key={`${trabalhoSelecionado.id}-req-${i}`}>
                          {requisito}
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {(trabalhoSelecionado.metadata?.anexos?.length ?? 0) > 0 && (
                  <div className={styles.anexos}>
                    <h3>Anexos</h3>
                    <ul className={styles.anexoLista}>
                      {trabalhoSelecionado.metadata?.anexos?.map((anexo) => {
                        const extensao = getFileExtension(anexo.nome);
                        const extensaoLabel = extensao
                          ? extensao.toUpperCase()
                          : 'ARQUIVO';
                        return (
                          <li key={anexo.id}>
                            <div className={styles.anexoItens}>
                              <div className={styles.icone}>
                                <LuFileText />
                              </div>
                              <div className={styles.infoAnexo}>
                                <h4>{anexo.nome}</h4>
                                <p>
                                  {extensaoLabel}{' '}
                                  <span>{formatFileSize(anexo.tamanho)}</span>
                                </p>
                              </div>
                            </div>
                            <a
                              href={anexo.url || anexo.visualizacaoUrl || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.downloadLink}
                              aria-label={`Baixar ${anexo.nome}`}
                            >
                              <LuDownload className={styles.iconeDownload} />
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <Link href={'/aluno/mensagens'} className={styles.linkMessage}>
                  <LuMessageCircle /> Tenho uma dúvida
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
