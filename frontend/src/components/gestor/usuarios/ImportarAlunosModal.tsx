"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { api } from "@/services/api";
import Modal from "@/components/modal/Modal";
import styles from "./ImportarAlunosModal.module.css";
import {
  FiFileText,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";

interface ImportarAlunosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ResultadoImportacao {
  criados: number;
  erros: number;
  detalhesErros: string[];
}

export default function ImportarAlunosModal({
  isOpen,
  onClose,
  onImportComplete,
}: ImportarAlunosModalProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setArquivo(acceptedFiles[0]);
      setResultado(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!arquivo) return;

    setIsUploading(true);
    setResultado(null);

    const formData = new FormData();
    formData.append("arquivo", arquivo);

    try {
      const response = await api.post("/usuarios/importar/alunos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResultado(response.data);
      onImportComplete();
    } catch (error: any) {
      const detalhes = error.response?.data?.detalhesErros || [
        "Ocorreu um erro inesperado no servidor.",
      ];
      setResultado({
        criados: 0,
        erros: -1,
        detalhesErros: detalhes,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setArquivo(null);
    setResultado(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar Alunos em Massa"
    >
      <div className={styles.container}>
        {!resultado ? (
          <>
            <div className={styles.instrucoes}>
              <p>
                Siga os passos abaixo para importar múltiplos alunos de uma vez:
              </p>
              <ol>
                <li>Baixe a nossa planilha modelo.</li>
                <li>
                  Preencha a planilha com os dados dos alunos. Não altere os
                  nomes das colunas.
                </li>
                <li>Salve o arquivo no formato CSV.</li>
                <li>
                  Arraste o arquivo para a área abaixo ou clique para
                  selecioná-lo.
                </li>
              </ol>
              <a
                href="/templates/template-alunos.csv"
                download
                className={styles.templateButton}
              >
                <FiFileText /> Baixar Planilha Modelo
              </a>
            </div>

            <div
              {...getRootProps()}
              className={`${styles.dropzone} ${
                isDragActive ? styles.active : ""
              }`}
            >
              <input {...getInputProps()} />
              <FiUploadCloud size={48} />
              {arquivo ? (
                <p>
                  Arquivo selecionado: <strong>{arquivo.name}</strong>
                </p>
              ) : isDragActive ? (
                <p>Solte o arquivo aqui...</p>
              ) : (
                <p>
                  Arraste e solte o arquivo CSV aqui, ou clique para selecionar
                </p>
              )}
            </div>

            <div className={styles.actions}>
              <button
                onClick={handleImport}
                disabled={!arquivo || isUploading}
                className={styles.importButton}
              >
                {isUploading ? "Importando..." : "Iniciar Importação"}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.resultadoContainer}>
            <div className={styles.resultadoHeader}>
              {resultado.erros === 0 ? (
                <FiCheckCircle size={48} className={styles.successIcon} />
              ) : (
                <FiAlertTriangle size={48} className={styles.errorIcon} />
              )}
              <h3>Importação Concluída</h3>
            </div>
            <div className={styles.resultadoSumario}>
              <p>
                <strong>Alunos criados com sucesso:</strong> {resultado.criados}
              </p>
              <p>
                <strong>Linhas com erro:</strong>{" "}
                {resultado.erros === -1 ? "Erro geral" : resultado.erros}
              </p>
            </div>
            {resultado.detalhesErros.length > 0 && (
              <div className={styles.detalhesErros}>
                <h4>Detalhes dos Erros:</h4>
                <ul>
                  {resultado.detalhesErros.map((erro, index) => (
                    <li key={index}>{erro}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className={styles.actions}>
              <button onClick={handleClose} className={styles.importButton}>
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
