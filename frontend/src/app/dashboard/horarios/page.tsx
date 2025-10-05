"use client";

import { useState, useEffect, FormEvent, useMemo } from "react";
import { api } from "@/services/api";

type Turma = { id: string; nome: string; serie: string };
type Componente = {
  id: string;
  materia: { nome: string };
  professor: { usuario: { nome: string } };
  turmaId: string;
};
type Horario = {
  id: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fim: string;
  local: string | null;
  turma: { nome: string; serie: string };
  componenteCurricular: {
    materia: { nome: string };
    professor: { usuario: { nome: string } };
  };
};

const DIAS_DA_SEMANA = [
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO",
];

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [turmaId, setTurmaId] = useState("");
  const [componenteId, setComponenteId] = useState("");
  const [diaSemana, setDiaSemana] = useState("SEGUNDA");
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFim, setHoraFim] = useState("09:00");
  const [local, setLocal] = useState("");

  async function fetchData() {
    try {
      setIsLoading(true);
      setError(null);
      const [resHorarios, resTurmas, resComponentes] = await Promise.all([
        api.get("/horarios"),
        api.get("/turmas"),
        api.get("/componentes-curriculares"),
      ]);

      setHorarios(resHorarios.data);
      setTurmas(resTurmas.data);
      setComponentes(resComponentes.data);

      if (resTurmas.data.length > 0) {
        setTurmaId(resTurmas.data[0].id);
      }
    } catch (err) {
      setError("Falha ao carregar os dados para a página de horários.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const componentesFiltrados = useMemo(() => {
    if (!turmaId) return [];
    return componentes.filter((c) => c.turmaId === turmaId);
  }, [turmaId, componentes]);

  useEffect(() => {
    if (componentesFiltrados.length > 0) {
      setComponenteId(componentesFiltrados[0].id);
    } else {
      setComponenteId("");
    }
  }, [componentesFiltrados]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!componenteId) {
      setError("Selecione uma matéria/professor válida para esta turma.");
      return;
    }

    try {
      await api.post("/horarios", {
        dia_semana: diaSemana,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        local,
        turmaId,
        componenteCurricularId: componenteId,
      });
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar o horário.");
    }
  }

  const styles = {};

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Gerenciamento de Quadro de Horários</h1>

      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <h2>Criar Novo Horário</h2>
        <form onSubmit={handleSubmit} style={{}}>
          <label>
            Turma:
            <select
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
            >
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.serie} - {t.nome}
                </option>
              ))}
            </select>
          </label>
          <label>
            Matéria / Professor:
            <select
              value={componenteId}
              onChange={(e) => setComponenteId(e.target.value)}
            >
              {componentesFiltrados.length > 0 ? (
                componentesFiltrados.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.materia.nome} ({c.professor.usuario.nome})
                  </option>
                ))
              ) : (
                <option disabled>Nenhuma matéria vinculada a esta turma</option>
              )}
            </select>
          </label>
          <label>
            Dia da Semana:
            <select
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value)}
            >
              {DIAS_DA_SEMANA.map((dia) => (
                <option key={dia} value={dia}>
                  {dia}
                </option>
              ))}
            </select>
          </label>
          <label>
            Hora de Início:
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
            />
          </label>
          <label>
            Hora de Fim:
            <input
              type="time"
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
            />
          </label>
          <label>
            Local (opcional):
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex: Sala 10, Laboratório"
            />
          </label>
          <button type="submit">Adicionar Horário</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
      </section>

      <hr />

      <section style={{ marginTop: "2rem" }}>
        <h2>Quadro de Horários</h2>
        {isLoading && <p>Carregando...</p>}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Turma
              </th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Dia da Semana
              </th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Horário
              </th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Matéria
              </th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Professor
              </th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>
                Local
              </th>
            </tr>
          </thead>
          <tbody>
            {horarios.map((h) => (
              <tr key={h.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {h.turma.serie} - {h.turma.nome}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {h.dia_semana}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {h.hora_inicio} - {h.hora_fim}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {h.componenteCurricular.materia.nome}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {h.componenteCurricular.professor.usuario.nome}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {h.local || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
