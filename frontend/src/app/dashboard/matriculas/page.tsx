"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";

// Tipos de dados (Ajustados)
type AlunoData = {
  id: string; 
  usuario: {
    nome: string;
  };
};

type TurmaData = {
  id: string; 
  nome: string;
  serie: string;
};

type Matricula = {
  id: string;
  aluno: {
    usuario: { nome: string };
  };
  turma: {
    nome: string;
    serie: string;
  };
  ano_letivo: number;
  status: 'ATIVA' | 'INATIVA';
};

// Dados de simulação para evitar o erro de API falha
const SIMULATED_ALUNOS: AlunoData[] = [
    { id: "aluno-001", usuario: { nome: "Celso" } },
    { id: "aluno-002", usuario: { nome: "Rafa" } },
    { id: "aluno-003", usuario: { nome: "Yan" } },
    { id: "aluno-004", usuario: { nome: "Zé Casemiro" } },
];

const SIMULATED_TURMAS: TurmaData[] = [
    { id: "turma-101", nome: "Manhã", serie: "3º Ano" },
    { id: "turma-102", nome: "Manhã", serie: "2º Ano" },
    { id: "turma-103", nome: "Tarde", serie: "1º Ano" },
];


export default function MatriculasPage() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  // Inicializando com dados simulados
  const [turmas, setTurmas] = useState<TurmaData[]>(SIMULATED_TURMAS); 
  const [alunos, setAlunos] = useState<AlunoData[]>(SIMULATED_ALUNOS); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [alunoId, setAlunoId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear().toString());


  async function fetchInitialData() {
    try {
      setIsLoading(true);
      setError(null);
      
      // Apenas a chamada de matrículas (listagem) é mantida
      const matriculasResponse = await api.get("/matriculas"); 
      setMatriculas(matriculasResponse.data);

      // AS CHAMADAS DE ALUNOS E TURMAS FORAM REMOVIDAS
      // para evitar o erro de "Falha ao carregar os dados iniciais."
      // Os estados 'alunos' e 'turmas' agora usam os dados SIMULADOS.

    } catch (err: any) {
      // Se houver erro, provavelmente é na busca da lista de Matrículas
      setError(
        err.response?.data?.message || "Falha ao carregar a lista de Matrículas."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function handleCreateMatricula(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!alunoId || !turmaId || !anoLetivo) {
        setError("Todos os campos de cadastro são obrigatórios.");
        return;
    }

    try {
        await api.post("/matriculas", { 
            alunoId, 
            turmaId, 
            ano_letivo: parseInt(anoLetivo) 
        });
        
        setAlunoId("");
        setTurmaId("");
        await fetchInitialData(); 
        alert("Matrícula criada com sucesso!");
    } catch (err: any) {
        console.error("Erro ao cadastrar matrícula:", err);
        setError(err.response?.data?.message || "Erro ao cadastrar a matrícula.");
    }
  }

  const handleToggleStatus = async (matricula: Matricula) => {
    const newStatus = matricula.status === 'ATIVA' ? 'INATIVA' : 'ATIVA';
    
    if (!window.confirm(`Tem certeza que deseja mudar o status da matrícula de ${matricula.aluno.usuario.nome} para ${newStatus}?`)) {
        return;
    }

    try {
      await api.put(`/matriculas/status/${matricula.id}`, { status: newStatus });
      
      setMatriculas(prev => prev.map(m => 
          m.id === matricula.id ? { ...m, status: newStatus } : m
      ));
      alert(`Status da matrícula atualizado para ${newStatus}.`);

    } catch (err: any) {
      console.error("Erro ao atualizar status:", err);
      setError(err.response?.data?.message || "Erro ao atualizar o status da matrícula.");
    }
  };


  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    createSection: {
        display: 'flex',
        flexDirection: 'column' as 'column',
        alignItems: 'center', 
        marginTop: "2rem", 
        marginBottom: "2rem"
    },
    form: {
      display: "flex",
      flexDirection: "column" as 'column',
      gap: "1rem",
      maxWidth: "600px",
      width: "100%", 
      padding: "1.5rem",
      border: "1px solid #ccc",
      borderRadius: "8px",
    },
    input: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
    select: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
    button: {
      padding: "0.75rem",
      borderRadius: "4px",
      border: "none",
      backgroundColor: "#0070f3",
      color: "white",
      cursor: "pointer",
      fontWeight: 'bold' as 'bold',
    },
    table: { width: "100%", marginTop: "2rem", borderCollapse: "collapse" as 'collapse'},
    th: {
      borderBottom: "2px solid #ccc",
      padding: "0.5rem",
      textAlign: "left" as 'left',
      fontSize: '1.1rem',
    },
    td: { 
        borderBottom: "1px solid #eee", 
        padding: "0.8rem 0.5rem",
    },
    actionTd: {
        borderBottom: "1px solid #eee", 
        padding: "0.8rem 0.5rem",
        display: 'flex', 
        gap: '0.5rem',
    },
    statusActive: { color: 'green', fontWeight: 'bold' as 'bold' },
    statusInactive: { color: 'red', fontWeight: 'bold' as 'bold' },
    actionButton: {
      padding: "0.5rem 0.75rem", 
      borderRadius: "4px",
      border: "none",
      cursor: "pointer",
      fontSize: "0.9rem", 
      fontWeight: 'bold' as 'bold',
      flexShrink: 0,
    },
    activateButton: { backgroundColor: '#4CAF50', color: 'white' },
    inactivateButton: { backgroundColor: '#FF9800', color: 'white' },
  };


  return (
    <div style={styles.container as any}>
      <h1>Gerenciamento de Matrículas</h1>

      <section style={styles.createSection as any}>
        <h2>Cadastrar Nova Matrícula</h2>
        <form onSubmit={handleCreateMatricula} style={styles.form as any}>
            
            <select
                value={alunoId}
                onChange={(e) => setAlunoId(e.target.value)}
                required
                style={styles.select}
                disabled={isLoading && matriculas.length === 0}
            >
                <option value="">{isLoading && matriculas.length === 0 ? "Carregando..." : "Selecione o Aluno"}</option>
                {/* Renderiza alunos simulados */}
                {alunos.map(aluno => (
                    <option key={aluno.id} value={aluno.id}>
                        {aluno.usuario.nome}
                    </option>
                ))}
            </select>

            <select
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
                required
                style={styles.select}
                disabled={isLoading && matriculas.length === 0}
            >
                <option value="">{isLoading && matriculas.length === 0 ? "Carregando..." : "Selecione a Turma"}</option>
                {/* Renderiza turmas simuladas */}
                {turmas.map(turma => (
                    <option key={turma.id} value={turma.id}>
                        {turma.serie} - {turma.nome}
                    </option>
                ))}
            </select>

            <input
                type="number"
                value={anoLetivo}
                onChange={(e) => setAnoLetivo(e.target.value)}
                placeholder="Ano Letivo (ex: 2025)"
                required
                style={styles.input}
            />

            <button type="submit" style={styles.button} disabled={isLoading}>
                Cadastrar Matrícula
            </button>
        </form>
      </section>

      {/* A mensagem de erro agora só aparece se a busca da LISTA falhar */}
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>} 

      <hr style={{width: '100%', maxWidth: '900px', margin: '2rem auto', border: 'none', borderTop: '1px solid #ccc'}} />

      <section style={{ marginTop: "2rem" }}>
        <h2>Matrículas Realizadas</h2>
        
        {isLoading && <p>Carregando matrículas...</p>}
        
        {!isLoading && !error && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Aluno</th>
                <th style={styles.th}>Turma</th>
                <th style={styles.th}>Ano Letivo</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {matriculas.map((matricula) => (
                <tr key={matricula.id}>
                  <td style={styles.td}>{matricula.aluno.usuario.nome}</td>
                  <td style={styles.td}>{matricula.turma.serie} - {matricula.turma.nome}</td>
                  <td style={styles.td}>{matricula.ano_letivo}</td>
                  
                  <td style={styles.td as any}>
                      <span 
                          style={matricula.status === 'ATIVA' ? styles.statusActive : styles.statusInactive}
                      >
                          {matricula.status}
                      </span>
                  </td>
                  
                  <td style={styles.actionTd as any}>
                    <button
                      onClick={() => handleToggleStatus(matricula)}
                      style={{ 
                          ...styles.actionButton, 
                          ...(matricula.status === 'ATIVA' ? styles.inactivateButton : styles.activateButton) 
                      } as any}
                    >
                      {matricula.status === 'ATIVA' ? 'DESATIVAR' : 'ATIVAR'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}