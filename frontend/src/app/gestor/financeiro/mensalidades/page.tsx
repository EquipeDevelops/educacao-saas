'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { api } from '@/services/api';
import styles from './mensalidades.module.css';
import { FiPlus } from 'react-icons/fi';
import Modal from '@/components/modal/Modal';
import Loading from '@/components/loading/Loading';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Plano = { id: string; nome: string; valor: number };
type Turma = { id: string; nome: string; serie: string };
type Mensalidade = {
  id: string;
  mes: number;
  ano: number;
  valor: number;
  dataVencimento: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
  matricula: {
    aluno: {
      usuario: {
        nome: string;
      };
    };
  };
  plano: {
    nome: string;
  };
};

const meses = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const anos = [new Date().getFullYear(), new Date().getFullYear() + 1];

export default function MensalidadesPage() {
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isGerarModalOpen, setIsGerarModalOpen] = useState(false);
  const [gerarState, setGerarState] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    planoId: '',
    turmaId: '',
  });

  const [isPagarModalOpen, setIsPagarModalOpen] = useState(false);
  const [pagarState, setPagarState] = useState({
    mensalidadeId: '',
    valorPago: 0,
    metodo: 'PIX',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mensalidadesRes, planosRes, turmasRes] = await Promise.all([
        api.get('/financeiro/mensalidades'),
        api.get('/financeiro/planos'),
        api.get('/turmas'),
      ]);
      setMensalidades(mensalidadesRes.data);
      setPlanos(planosRes.data);
      setTurmas(turmasRes.data);

      if (planosRes.data.length > 0 && !gerarState.planoId) {
        setGerarState((prev) => ({ ...prev, planoId: planosRes.data[0].id }));
      }
      if (turmasRes.data.length > 0 && !gerarState.turmaId) {
        setGerarState((prev) => ({ ...prev, turmaId: turmasRes.data[0].id }));
      }
    } catch {
      toast.error('Falha ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  }, [gerarState.planoId, gerarState.turmaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGerarChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    setGerarState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGerarMensalidades = async (e: FormEvent) => {
    e.preventDefault();
    if (!gerarState.planoId || !gerarState.turmaId) {
      toast.error('Selecione a turma e o plano.');
      return;
    }
    const toastId = toast.loading('Gerando mensalidades...');
    try {
      const resultado = await api.post('/financeiro/mensalidades/gerar', {
        ...gerarState,
        mes: Number(gerarState.mes),
        ano: Number(gerarState.ano),
      });
      toast.update(toastId, {
        render: resultado.data.message,
        type: 'success',
        isLoading: false,
        autoClose: 4000,
      });
      setIsGerarModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Erro ao gerar mensalidades.';
      toast.update(toastId, {
        render: message,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  const openPagarModal = (mensalidade: Mensalidade) => {
    setPagarState({
      mensalidadeId: mensalidade.id,
      valorPago: mensalidade.valor,
      metodo: 'PIX',
    });
    setIsPagarModalOpen(true);
  };

  const handleProcessarPagamento = async (e: FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Processando pagamento...');
    try {
      await api.post(
        `/financeiro/mensalidades/${pagarState.mensalidadeId}/pagar`,
        {
          valorPago: Number(pagarState.valorPago),
          metodo: pagarState.metodo,
        },
      );
      toast.update(toastId, {
        render: 'Pagamento registrado!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      setIsPagarModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Erro ao processar pagamento.';
      toast.update(toastId, {
        render: message,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" />
      <header className={styles.header}>
        <div>
          <h1>Gestão de Mensalidades</h1>
          <p>Acompanhe, gere e registre os pagamentos das mensalidades.</p>
        </div>
        <button
          className={styles.primaryButton}
          onClick={() => setIsGerarModalOpen(true)}
        >
          <FiPlus /> Gerar Mensalidades
        </button>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Plano</th>
              <th>Período</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {mensalidades.map((m) => (
              <tr key={m.id}>
                <td>{m.matricula.aluno.usuario.nome}</td>
                <td>{m.plano.nome}</td>
                <td>
                  {m.mes}/{m.ano}
                </td>
                <td>
                  {new Date(m.dataVencimento).toLocaleDateString('pt-BR')}
                </td>
                <td>
                  {m.valor.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      styles['status' + m.status]
                    }`}
                  >
                    {m.status}
                  </span>
                </td>
                <td>
                  {m.status === 'PENDENTE' && (
                    <button
                      className={`${styles.actionButton} ${styles.pagarButton}`}
                      onClick={() => openPagarModal(m)}
                    >
                      Registrar Pagamento
                    </button>
                  )}
                  {m.status === 'PAGO' && (
                    <button
                      className={`${styles.actionButton} ${styles.comprovanteButton}`}
                    >
                      Ver Comprovante
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isGerarModalOpen}
        onClose={() => setIsGerarModalOpen(false)}
        title="Gerar Mensalidades em Lote"
      >
        <form onSubmit={handleGerarMensalidades} className={styles.modalForm}>
          <label className={styles.label}>
            Mês de Referência:
            <select
              name="mes"
              value={gerarState.mes}
              onChange={handleGerarChange}
            >
              {meses.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Ano de Referência:
            <select
              name="ano"
              value={gerarState.ano}
              onChange={handleGerarChange}
            >
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Turma:
            <select
              name="turmaId"
              value={gerarState.turmaId}
              onChange={handleGerarChange}
            >
              {turmas.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                >{`${t.serie} - ${t.nome}`}</option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Plano de Mensalidade:
            <select
              name="planoId"
              value={gerarState.planoId}
              onChange={handleGerarChange}
            >
              {planos.map((p) => (
                <option key={p.id} value={p.id}>{`${
                  p.nome
                } (${p.valor.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })})`}</option>
              ))}
            </select>
          </label>
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setIsGerarModalOpen(false)}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton}>
              Gerar
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isPagarModalOpen}
        onClose={() => setIsPagarModalOpen(false)}
        title="Registrar Pagamento"
      >
        <form onSubmit={handleProcessarPagamento} className={styles.modalForm}>
          <label className={styles.label}>
            Valor Pago (R$):
            <input
              type="number"
              value={pagarState.valorPago}
              onChange={(e) =>
                setPagarState({
                  ...pagarState,
                  valorPago: parseFloat(e.target.value),
                })
              }
            />
          </label>
          <label className={styles.label}>
            Método de Pagamento:
            <select
              value={pagarState.metodo}
              onChange={(e) =>
                setPagarState({ ...pagarState, metodo: e.target.value })
              }
            >
              <option value="PIX">PIX</option>
              <option value="Boleto">Boleto</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Dinheiro">Dinheiro</option>
            </select>
          </label>
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setIsPagarModalOpen(false)}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton}>
              Confirmar Pagamento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
