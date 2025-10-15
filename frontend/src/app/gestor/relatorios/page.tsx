"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import styles from "./relatorios.module.css";
import Loading from "@/components/loading/Loading";
import { FiDownload } from "react-icons/fi";
import { format } from "date-fns";

interface Turma {
  id: string;
  nome: string;
  serie: string;
}

interface BoletimAluno {
  aluno: { id: string; nome: string };
  disciplinas: { nome: string; mediaFinal: number }[];
  totalFaltas: number;
}

interface FrequenciaDetalhada {
  aluno: { id: string; nome: string };
  totalAulas: number;
  totalPresencas: number;
  totalFaltas: number;
  faltasJustificadas: number;
  faltasNaoJustificadas: number;
  percentualFrequencia: number;
}

type RelatorioAtivo = "boletins" | "frequencia";

export default function RelatoriosPage() {
  const [abaAtiva, setAbaAtiva] = useState<RelatorioAtivo>("boletins");

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [boletins, setBoletins] = useState<BoletimAluno[]>([]);
  const [isLoadingBoletins, setIsLoadingBoletins] = useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] =
    useState("PRIMEIRO_BIMESTRE");

  const [frequencia, setFrequencia] = useState<FrequenciaDetalhada[]>([]);
  const [isLoadingFrequencia, setIsLoadingFrequencia] = useState(false);
  const [dataInicio, setDataInicio] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [dataFim, setDataFim] = useState(format(new Date(), "yyyy-MM-dd"));

  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [anoSelecionado, setAnoSelecionado] = useState(
    new Date().getFullYear()
  );

  useEffect(() => {
    api
      .get("/turmas")
      .then((response) => {
        setTurmas(response.data);
        if (response.data.length > 0) {
          setTurmaSelecionada(response.data[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleGerarBoletim = () => {
    if (!turmaSelecionada) return;
    setIsLoadingBoletins(true);
    setBoletins([]);
    const params = new URLSearchParams({
      turmaId: turmaSelecionada,
      periodo: periodoSelecionado,
      ano: String(anoSelecionado),
    });
    api
      .get(`/gestor/relatorios/boletim?${params.toString()}`)
      .then((res) => setBoletins(res.data))
      .catch((err) => console.error("Erro ao gerar boletim:", err))
      .finally(() => setIsLoadingBoletins(false));
  };

  const handleGerarFrequencia = () => {
    if (!turmaSelecionada) return;
    setIsLoadingFrequencia(true);
    setFrequencia([]);
    const params = new URLSearchParams({
      turmaId: turmaSelecionada,
      dataInicio,
      dataFim,
    });
    api
      .get(`/gestor/relatorios/frequencia-detalhada?${params.toString()}`)
      .then((res) => setFrequencia(res.data))
      .catch((err) =>
        console.error("Erro ao gerar relatório de frequência:", err)
      )
      .finally(() => setIsLoadingFrequencia(false));
  };

  const exportarFrequenciaCSV = () => {
    const headers = [
      "Aluno",
      "Aulas no Período",
      "Presenças",
      "Total de Faltas",
      "Faltas Justificadas",
      "Faltas Não Justificadas",
      "Frequência (%)",
    ];
    const rows = frequencia.map((item) =>
      [
        `"${item.aluno.nome}"`,
        item.totalAulas,
        item.totalPresencas,
        item.totalFaltas,
        item.faltasJustificadas,
        item.faltasNaoJustificadas,
        `${item.percentualFrequencia.toFixed(1)}%`,
      ].join(",")
    );

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `relatorio_frequencia_${turmaSelecionada}_${dataInicio}_a_${dataFim}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <Loading />;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Relatórios Acadêmicos</h1>
        <p>
          Gere e visualize boletins e outros relatórios importantes da unidade
          escolar.
        </p>
      </header>

      <div className={styles.tabs}>
        <button
          onClick={() => setAbaAtiva("boletins")}
          className={abaAtiva === "boletins" ? styles.tabAtiva : styles.tab}
        >
          Boletins por Turma
        </button>
        <button
          onClick={() => setAbaAtiva("frequencia")}
          className={abaAtiva === "frequencia" ? styles.tabAtiva : styles.tab}
        >
          Frequência Detalhada
        </button>
      </div>

      {abaAtiva === "boletins" && (
        <div>
          <div className={styles.filterCard}>
            <div className={styles.filterGroup}>
              <label>Turma</label>
              <select
                value={turmaSelecionada}
                onChange={(e) => setTurmaSelecionada(e.target.value)}
              >
                {turmas.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                  >{`${t.serie} ${t.nome}`}</option>
                ))}
              </select>
            </div>
            <button onClick={handleGerarBoletim} disabled={isLoadingBoletins}>
              {isLoadingBoletins ? "Gerando..." : "Gerar Boletim"}
            </button>
          </div>
          <div className={styles.resultsContainer}></div>
        </div>
      )}

      {abaAtiva === "frequencia" && (
        <div>
          <div className={styles.filterCard}>
            <div className={styles.filterGroup}>
              <label>Turma</label>
              <select
                value={turmaSelecionada}
                onChange={(e) => setTurmaSelecionada(e.target.value)}
              >
                {turmas.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                  >{`${t.serie} ${t.nome}`}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label>Data de Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label>Data de Fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <button
              onClick={handleGerarFrequencia}
              disabled={isLoadingFrequencia}
            >
              {isLoadingFrequencia ? "Gerando..." : "Gerar Relatório"}
            </button>
          </div>
          <div className={styles.tableContainer}>
            {isLoadingFrequencia ? (
              <Loading />
            ) : frequencia.length > 0 ? (
              <>
                <div className={styles.tableHeader}>
                  <h3>Relatório de Frequência</h3>
                  <button
                    onClick={exportarFrequenciaCSV}
                    className={styles.exportButton}
                  >
                    <FiDownload /> Exportar CSV
                  </button>
                </div>
                <table className={styles.frequenciaTable}>
                  <thead>
                    <tr>
                      <th>Aluno</th>
                      <th>Aulas no Período</th>
                      <th>Presenças</th>
                      <th>Faltas</th>
                      <th>Frequência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frequencia.map((item) => (
                      <tr key={item.aluno.id}>
                        <td>{item.aluno.nome}</td>
                        <td>{item.totalAulas}</td>
                        <td>{item.totalPresencas}</td>
                        <td>
                          {item.totalFaltas} ({item.faltasNaoJustificadas} não
                          just.)
                        </td>
                        <td>
                          <span
                            className={
                              item.percentualFrequencia < 75
                                ? styles.notaBaixa
                                : styles.notaAlta
                            }
                          >
                            {item.percentualFrequencia}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className={styles.emptyState}>
                <p>
                  Selecione os filtros e clique em "Gerar Relatório" para
                  visualizar os dados.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
