'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './visualizar.module.css';
import { Questao } from '@/types/tarefas';
import { Componente } from '../../atividades/nova/page';
import { FiArrowLeft, FiPrinter } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

type ProvaPreviewData = {
  titulo: string;
  descricao: string;
  pontos: number;
  questoes: Questao[];
  componente?: Componente;
};

export default function VisualizarProvaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [prova, setProva] = useState<ProvaPreviewData | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('provaPreviewData');
    if (data) {
      setProva(JSON.parse(data));
    }
  }, []);

  useEffect(() => {
    const shouldPrint = searchParams.get('print') === 'true';
    if (prova && shouldPrint) {
      // Pequeno delay para garantir que o render aconteceu
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [prova, searchParams]);

  if (!prova) {
    return (
      <div className={styles.pageContainer}>
        <h1>Visualização de Prova</h1>
        <p>Nenhum dado de prova encontrado para visualização.</p>
        <button onClick={() => window.close()}>Fechar</button>
      </div>
    );
  }

  const totalPontos = prova.questoes.reduce((acc, q) => acc + q.pontos, 0);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerActions}>
          <button onClick={() => window.close()} className={styles.backButton}>
            <FiArrowLeft /> Voltar / Fechar
          </button>
          <button onClick={() => window.print()} className={styles.printButton}>
            <FiPrinter /> Imprimir
          </button>
        </div>

        {/* Cabeçalho de Impressão (Visível apenas na impressão ou estilizado diferente) */}
        <div className={styles.printHeader}>
          <div className={styles.schoolInfo}>
            <div className={styles.schoolLogoPlaceholder}>LOGO ESCOLA</div>
            <div className={styles.schoolText}>
              <h2>ESCOLA MODELO DE EDUCAÇÃO</h2>
              <p>Educação de Excelência</p>
            </div>
          </div>

          <div className={styles.examInfoGrid}>
            <div className={styles.infoField}>
              <strong>Professor(a):</strong>{' '}
              <span>{user?.nome || '____________________'}</span>
            </div>
            <div className={styles.infoField}>
              <strong>Aluno(a):</strong>{' '}
              <span className={styles.lineField}>
                __________________________________________________
              </span>
            </div>
            <div className={styles.infoField}>
              <strong>Turma:</strong>{' '}
              <span>
                {prova.componente?.turma.nome} ({prova.componente?.turma.serie})
              </span>
            </div>
            <div className={styles.infoField}>
              <strong>Matéria:</strong>{' '}
              <span>{prova.componente?.materia.nome}</span>
            </div>
            <div className={styles.infoField}>
              <strong>Data:</strong> <span>___/___/_____</span>
            </div>
            <div className={styles.infoField}>
              <strong>Nota:</strong> <span>_______ / {totalPontos}</span>
            </div>
          </div>
        </div>

        <h1 className={styles.examTitle}>{prova.titulo}</h1>

        {prova.descricao && (
          <p className={styles.description}>{prova.descricao}</p>
        )}
      </header>

      <main className={styles.questoesContainer}>
        {prova.questoes
          .sort((a, b) => a.sequencia - b.sequencia)
          .map((questao) => (
            <div key={questao.sequencia} className={styles.questaoCard}>
              <div className={styles.questaoHeader}>
                <h3>Questão {questao.sequencia}</h3>
                <span>
                  {questao.pontos} {questao.pontos > 1 ? 'pontos' : 'ponto'}
                </span>
              </div>
              <p className={styles.questaoTitulo}>{questao.titulo}</p>
              {questao.enunciado && (
                <p className={styles.questaoEnunciado}>{questao.enunciado}</p>
              )}

              {questao.tipo === 'DISCURSIVA' && (
                <div className={styles.respostaDiscursiva}>
                  <p>Resposta:</p>
                  <div className={styles.linhaResposta}></div>
                  <div className={styles.linhaResposta}></div>
                  <div className={styles.linhaResposta}></div>
                </div>
              )}

              {questao.tipo === 'MULTIPLA_ESCOLHA' && (
                <ul className={styles.optionsList}>
                  {questao.opcoes_multipla_escolha?.map((opcao, index) => (
                    <li key={index} className={styles.optionItem}>
                      <span className={styles.optionMarker}></span>
                      <label>
                        {String.fromCharCode(65 + index)}) {opcao.texto}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
      </main>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .${styles.pageContainer}, .${styles.pageContainer} * {
            visibility: visible;
          }
          .${styles.pageContainer} {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
