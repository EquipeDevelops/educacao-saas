"use client";

import { useState, useEffect, FormEvent } from "react";
import { api } from "@/services/api";

type Materia = {
  id: string;
  nome: string;
  codigo?: string;
};

export default function MateriasPage() {
    // ... (Estados e Funções inalterados)

  // ESTADOS DE LISTAGEM E CRIAÇÃO
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");

    // ESTADOS PARA EDIÇÃO (MODAL)
    const [isEditing, setIsEditing] = useState(false);
    const [currentMateria, setCurrentMateria] = useState<Materia | null>(null);
    const [editNome, setEditNome] = useState("");
    const [editCodigo, setEditCodigo] = useState("");

  async function fetchMaterias() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/materias");
      setMaterias(response.data);
    } catch (err) {
      setError(
        "Falha ao carregar as matérias. Verifique a API ou tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchMaterias();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError("O nome da matéria é obrigatório.");
      return;
    }

    try {
      await api.post("/materias", { nome, codigo });
      setNome("");
      setCodigo("");
      await fetchMaterias();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar a matéria.");
    }
  }
  
    // FUNÇÕES DE EDIÇÃO (UPDATE)
  const handleEdit = (materia: Materia) => {
    setCurrentMateria(materia);
    setEditNome(materia.nome);
    setEditCodigo(materia.codigo || "");
    setIsEditing(true); 
  };

    const handleCloseEdit = () => {
        setIsEditing(false);
        setCurrentMateria(null);
        setError(null); 
    }

    const handleSaveEdit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);

        if (!currentMateria || !editNome.trim()) {
            setError("Nome da matéria é obrigatório.");
            return;
        }

        try {
            await api.put(`/materias/${currentMateria.id}`, { 
                nome: editNome, 
                codigo: editCodigo 
            });

            await fetchMaterias();
            handleCloseEdit();
            alert(`Matéria "${editNome}" atualizada com sucesso!`);
        } catch (err: any) {
            console.error("Erro ao atualizar:", err);
            setError(err.response?.data?.message || `Erro ao atualizar a matéria.`);
        }
    }
    
    // FUNÇÃO DE DELEÇÃO (DELETE)
  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR a matéria "${nome}"? Esta ação é irreversível!`)) {
        return;
    }

    try {
        await api.delete(`/materias/${id}`);
        await fetchMaterias(); 
        alert(`Matéria "${nome}" excluída com sucesso.`);
    } catch (err: any) {
        console.error("Erro ao excluir:", err);
        setError(err.response?.data?.message || `Erro ao excluir a matéria "${nome}".`);
    }
  };


    // ESTILOS PARA PADRONIZAÇÃO, CENTRALIZAÇÃO E BOTOES
  const styles = {
    container: { padding: "2rem", fontFamily: "sans-serif" },
    // Estilo para centralizar o formulário de criação
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
      maxWidth: "400px",
      width: "100%", 
      padding: "1.5rem",
      border: "1px solid #ccc",
      borderRadius: "8px",
    },
    input: { padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
    button: {
      padding: "0.75rem",
      borderRadius: "4px",
      border: "none",
      backgroundColor: "#0070f3",
      color: "white",
      cursor: "pointer",
      fontWeight: 'bold' as 'bold', 
    },
    table: { width: "100%", marginTop: "2rem", borderCollapse: "collapse" },
    th: {
      borderBottom: "2px solid #ccc",
      padding: "0.5rem",
      textAlign: "left" as 'left',
      fontSize: '1.1rem', 
    },
    // CORREÇÃO APLICADA AQUI: Display flex e gap
    td: { 
        borderBottom: "1px solid #eee", 
        padding: "0.8rem 0.5rem",
        display: 'flex', // Permite que os botões fiquem lado a lado
        gap: '0.5rem',  // Espaço entre os botões
    },
    error: { color: "red", marginTop: "1rem" },
    
    actionButton: {
      padding: "0.5rem 0.75rem", 
      borderRadius: "4px",
      border: "none",
      cursor: "pointer",
      fontSize: "0.9rem", 
      fontWeight: 'bold' as 'bold',
      // Removido o marginLeft que causava o deslocamento no modelo anterior
    },
    editButton: {
      backgroundColor: "#2196F3",
      color: "white",
    },
    deleteButton: {
      backgroundColor: "#F44336",
      color: "white",
    },
    modalOverlay: {
        position: 'fixed' as 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.6)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000
    },
    modalContent: { 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '8px', 
        width: '90%', 
        maxWidth: '450px' 
    }
  };

  return (
    <div style={styles.container as any}>
      <h1>Gerenciamento de Matérias</h1>

        {/* SEÇÃO DE CRIAÇÃO CENTRALIZADA */}
      <section style={styles.createSection as any}>
        <h2>Criar Nova Matéria</h2>
        <form onSubmit={handleSubmit} style={styles.form as any}>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da Matéria (ex: Matemática)"
            required
            style={styles.input}
          />
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código (opcional, ex: MAT101)"
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Criar Matéria
          </button>
        </form>
        {error && !isEditing && <p style={styles.error as any}>{error}</p>}
      </section>

      <hr style={{width: '100%', maxWidth: '900px', margin: '2rem auto', border: 'none', borderTop: '1px solid #ccc'}} />

      <section style={{ marginTop: "2rem" }}>
        <h2>Matérias Existentes</h2>
        {isLoading && <p>Carregando...</p>}
        {!isLoading && !error && (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nome da Matéria</th>
                <th style={styles.th}>Código</th>
                <th style={styles.th}>Ações</th> 
              </tr>
            </thead>
            <tbody>
              {materias.map((materia) => (
                <tr key={materia.id}>
                  <td style={styles.td}>{materia.nome}</td>
                  <td style={styles.td}>{materia.codigo || "N/A"}</td>
                  <td style={styles.td as any}> {/* A célula de Ações agora é flexível */}
                    <button 
                        onClick={() => handleEdit(materia)}
                        style={{ ...styles.actionButton, ...styles.editButton } as any}
                    >
                        Editar
                    </button>
                    <button 
                        onClick={() => handleDelete(materia.id, materia.nome)}
                        style={{ ...styles.actionButton, ...styles.deleteButton } as any}
                    >
                        Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

    {/* MODAL DE EDIÇÃO */}
    {isEditing && currentMateria && (
        <div style={styles.modalOverlay as any}>
            <div style={styles.modalContent as any}>
                <h2>Editar Matéria: {currentMateria.nome}</h2>
                <form onSubmit={handleSaveEdit} style={{...styles.form, maxWidth: '100%'} as any}>
                    <label>Nome:</label>
                    <input
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        placeholder="Nome da Matéria"
                        required
                        style={styles.input}
                    />
                    <label>Código:</label>
                    <input
                        value={editCodigo}
                        onChange={(e) => setEditCodigo(e.target.value)}
                        placeholder="Código"
                        style={styles.input}
                    />
                    {error && isEditing && <p style={styles.error as any}>{error}</p>}
                    
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button 
                            type="submit" 
                            style={{ ...styles.button, flex: 1 } as any}
                        >
                            Salvar Edição
                        </button>
                        <button 
                            type="button" 
                            onClick={handleCloseEdit} 
                            style={{ ...styles.button, flex: 1, backgroundColor: '#6c757d' } as any}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )}
  </div>
  );
}