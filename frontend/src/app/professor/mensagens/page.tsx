"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./mensagens.module.css";
import {
  MessageSquare,
  Send,
  Search,
  Phone,
  Video,
  MoreVertical,
  SquarePen,
  Paperclip,
  Trash2,
} from "lucide-react";
import NovaConversaModal from "@/components/professor/NovaConversaModal";

type User = {
  id: string;
  nome: string;
  papel: "ALUNO" | "PROFESSOR" | "GESTOR";
};

type Mensagem = {
  id: string;
  conteudo: string;
  criado_em: string;
  autorId: string;
};

type Conversa = {
  id: string;
  participantes: { usuario: User }[];
  mensagens: Mensagem[];
};

export default function MensagensPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [selectedConversa, setSelectedConversa] = useState<Conversa | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "Todos" | "Alunos" | "Professores" | "Coord."
  >("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);

  async function fetchConversas(selectId?: string) {
    try {
      const response = await api.get("/conversas");
      setConversas(response.data);
      if (selectId) {
        fetchConversaDetalhes(selectId);
      } else if (response.data.length > 0 && !selectedConversa) {
        fetchConversaDetalhes(response.data[0].id);
      }
    } catch (err) {
      setError("Não foi possível carregar suas conversas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    fetchConversas();
  }, [authLoading]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [selectedConversa?.mensagens]);

  const fetchConversaDetalhes = async (conversaId: string) => {
    try {
      setSelectedConversa(null);
      const response = await api.get(`/conversas/${conversaId}`);
      setSelectedConversa(response.data);
    } catch (err) {
      setError("Erro ao carregar os detalhes da conversa.");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversa) return;

    const tempMessageId = Date.now().toString();
    const sentMessage = {
      id: tempMessageId,
      conteudo: newMessage,
      criado_em: new Date().toISOString(),
      autorId: user!.id,
    };

    setSelectedConversa((prev) =>
      prev ? { ...prev, mensagens: [...prev.mensagens, sentMessage] } : null
    );
    setNewMessage("");

    try {
      await api.post(`/conversas/${selectedConversa.id}/mensagens`, {
        conteudo: sentMessage.conteudo,
      });
      await Promise.all([
        api.get("/conversas").then((res) => setConversas(res.data)),
        fetchConversaDetalhes(selectedConversa.id),
      ]);
    } catch (err) {
      setError("Erro ao enviar mensagem.");
      setSelectedConversa((prev) =>
        prev
          ? {
              ...prev,
              mensagens: prev.mensagens.filter((m) => m.id !== tempMessageId),
            }
          : null
      );
    }
  };

  const handleStartConversation = async (destinatarioId: string) => {
    try {
      const response = await api.post("/conversas", { destinatarioId });
      const novaConversa = response.data;
      setIsModalOpen(false);
      fetchConversas(novaConversa.id);
    } catch (error) {
      console.error("Erro ao iniciar conversa", error);
      setError("Não foi possível iniciar a conversa.");
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversa) return;

    if (
      window.confirm(
        "Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita."
      )
    ) {
      try {
        const deletedId = selectedConversa.id;
        await api.delete(`/conversas/${deletedId}`);

        setConversas((prev) => prev.filter((c) => c.id !== deletedId));
        setSelectedConversa(null);
      } catch (err) {
        setError("Erro ao excluir a conversa.");
      }
    }
  };

  const getOtherParticipant = (conversa: Conversa) => {
    return conversa.participantes.find((p) => p.usuario.id !== user?.id)
      ?.usuario;
  };

  const filteredConversas = useMemo(() => {
    let filtered = [...conversas];

    if (activeTab !== "Todos") {
      const papelMap = {
        Alunos: "ALUNO",
        Professores: "PROFESSOR",
        "Coord.": "GESTOR",
      } as const;
      filtered = filtered.filter(
        (c) => getOtherParticipant(c)?.papel === papelMap[activeTab]
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((c) =>
        getOtherParticipant(c)
          ?.nome.toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [conversas, activeTab, searchTerm, user]);

  if (loading || authLoading) {
    return (
      <div className={styles.pageContainer}>
        <p>Carregando mensagens...</p>
      </div>
    );
  }

  return (
    <>
      {isModalOpen && (
        <NovaConversaModal
          onClose={() => setIsModalOpen(false)}
          onSelectUser={handleStartConversation}
        />
      )}

      <div className={styles.pageContainer}>
        <div className={styles.chatLayout}>
          <aside className={styles.sidebar}>
            <header className={styles.sidebarHeader}>
              <div className={styles.sidebarTitleWrapper}>
                <h2>Mensagens</h2>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className={styles.newMessageButton}
                >
                  <SquarePen size={18} />
                </button>
              </div>
              <p>Converse com alunos, professores e coordenadores</p>
            </header>
            <div className={styles.searchContainer}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.tabs}>
              <button
                className={activeTab === "Todos" ? styles.activeTab : ""}
                onClick={() => setActiveTab("Todos")}
              >
                Todos
              </button>
              <button
                className={activeTab === "Alunos" ? styles.activeTab : ""}
                onClick={() => setActiveTab("Alunos")}
              >
                Alunos
              </button>
              <button
                className={activeTab === "Professores" ? styles.activeTab : ""}
                onClick={() => setActiveTab("Professores")}
              >
                Professores
              </button>
              <button
                className={activeTab === "Coord." ? styles.activeTab : ""}
                onClick={() => setActiveTab("Coord.")}
              >
                Coord.
              </button>
            </div>
            <div className={styles.conversaList}>
              {filteredConversas.map((conversa) => {
                const otherUser = getOtherParticipant(conversa);
                const lastMsg =
                  conversa.mensagens[conversa.mensagens.length - 1];
                return (
                  <div
                    key={conversa.id}
                    className={`${styles.conversaItem} ${
                      selectedConversa?.id === conversa.id ? styles.active : ""
                    }`}
                    onClick={() => fetchConversaDetalhes(conversa.id)}
                  >
                    <div className={styles.avatar}>
                      {otherUser?.nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div className={styles.conversaInfo}>
                      <p className={styles.conversaName}>{otherUser?.nome}</p>
                      <p className={styles.lastMessage}>
                        {lastMsg?.conteudo || "Nenhuma mensagem"}
                      </p>
                    </div>
                    <div className={styles.conversaMeta}>
                      <span className={styles.timestampMeta}>
                        {lastMsg
                          ? new Date(lastMsg.criado_em).toLocaleTimeString(
                              "pt-BR",
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <main className={styles.chatWindow}>
            {selectedConversa ? (
              <>
                <header className={styles.chatHeader}>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                      {getOtherParticipant(selectedConversa)
                        ?.nome.substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3>{getOtherParticipant(selectedConversa)?.nome}</h3>
                      <span className={styles.userStatus}>Online</span>
                    </div>
                  </div>
                  <div className={styles.chatActions}>
                    <button>
                      <Phone size={20} />
                    </button>
                    <button>
                      <Video size={20} />
                    </button>
                    <button onClick={handleDeleteConversation}>
                      <Trash2 size={20} />
                    </button>
                    <button>
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </header>
                <div className={styles.messageList} ref={messageListRef}>
                  {selectedConversa.mensagens.map((msg) => (
                    <div
                      key={msg.id}
                      className={`${styles.messageWrapper} ${
                        msg.autorId === user?.id
                          ? styles.sentWrapper
                          : styles.receivedWrapper
                      }`}
                    >
                      <div className={`${styles.message}`}>
                        <p>{msg.conteudo}</p>
                        <span className={styles.timestamp}>
                          {new Date(msg.criado_em).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <footer className={styles.chatFooter}>
                  <button className={styles.attachButton}>
                    <Paperclip size={20} />
                  </button>
                  <div className={styles.inputWrapper}>
                    <input
                      type="text"
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    className={styles.sendButton}
                  >
                    <Send size={20} />
                  </button>
                </footer>
              </>
            ) : (
              <div className={styles.noChatSelected}>
                <MessageSquare />
                <p>Selecione uma conversa para começar</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
