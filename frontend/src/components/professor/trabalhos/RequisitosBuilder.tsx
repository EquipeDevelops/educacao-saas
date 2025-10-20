import { useState } from "react";
import styles from "./RequisitosBuilder.module.css";
import { FiPlus, FiTrash2, FiUsers, FiClipboard } from "react-icons/fi";

type Props = {
  requisitos: string[];
  setRequisitos: (requisitos: string[]) => void;
};

const SUGESTOES = [
  "Trabalho em grupo (até 4 pessoas)",
  "Normas ABNT",
  "Apresentação em slides",
  "Entregar em formato PDF",
  "Incluir bibliografia",
  "Mínimo de 5 páginas",
];

export default function RequisitosBuilder({
  requisitos,
  setRequisitos,
}: Props) {
  const [novoRequisito, setNovoRequisito] = useState("");

  const handleAddRequisito = (requisito: string) => {
    if (requisito && !requisitos.includes(requisito)) {
      setRequisitos([...requisitos, requisito]);
    }
  };

  const handleRemoveRequisito = (index: number) => {
    const novosRequisitos = [...requisitos];
    novosRequisitos.splice(index, 1);
    setRequisitos(novosRequisitos);
  };

  const handleCustomRequisito = () => {
    if (novoRequisito) {
      handleAddRequisito(novoRequisito);
      setNovoRequisito("");
    }
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>
        <FiUsers /> Requisitos do Trabalho
      </h2>
      <div className={styles.sugestoesContainer}>
        <p>Sugestões:</p>
        <div className={styles.sugestoesBadges}>
          {SUGESTOES.map((sugestao) => (
            <button
              key={sugestao}
              type="button"
              onClick={() => handleAddRequisito(sugestao)}
              className={styles.badge}
            >
              <FiPlus /> {sugestao}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.addRequisito}>
        <input
          type="text"
          value={novoRequisito}
          onChange={(e) => setNovoRequisito(e.target.value)}
          placeholder="Ou adicione um requisito personalizado"
        />
        <button
          type="button"
          onClick={handleCustomRequisito}
          className={styles.addButton}
        >
          Adicionar
        </button>
      </div>

      <div className={styles.requisitosList}>
        {requisitos.length > 0 && <h4>Requisitos Selecionados:</h4>}
        <ul>
          {requisitos.map((req, index) => (
            <li key={index}>
              <span>{req}</span>
              <button
                type="button"
                onClick={() => handleRemoveRequisito(index)}
              >
                <FiTrash2 />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
