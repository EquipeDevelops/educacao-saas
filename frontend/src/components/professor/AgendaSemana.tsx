import styles from "./styles/AgendaSemana.module.css";

type Horario = {
  id: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fim: string;
  componenteCurricular: {
    materia: { nome: string };
    turma: { nome: string; serie: string };
  };
};

type AgendaSemanaProps = {
  horarios: Horario[];
};

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "00000".substring(0, 6 - c.length) + c;
};

export default function AgendaSemana({ horarios }: AgendaSemanaProps) {
  const dias = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
  const diasCompletos = [
    "SEGUNDA",
    "TERCA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SABADO",
    "DOMINGO",
  ];

  const getHorariosDoDia = (dia: string) => {
    return horarios
      .filter((h) => h.dia_semana === dia)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  };

  return (
    <div className={styles.widget}>
      <h2 className={styles.title}>Agenda da Semana</h2>
      <div className={styles.grid}>
        {dias.map((dia, index) => (
          <div key={dia} className={styles.dayColumn}>
            <div className={styles.dayHeader}>
              <span>{dia}</span>
              <span className={styles.dayNumber}>
                {new Date().getDate() + index - new Date().getDay() + 1}
              </span>
            </div>
            <div className={styles.events}>
              {getHorariosDoDia(diasCompletos[index]).map((horario) => {
                const color = stringToColor(
                  horario.componenteCurricular.materia.nome
                );
                return (
                  <div
                    key={horario.id}
                    className={styles.event}
                    style={
                      { "--event-color": `#${color}` } as React.CSSProperties
                    }
                  >
                    <p className={styles.eventMateria}>
                      {horario.componenteCurricular.materia.nome}
                    </p>
                    <p className={styles.eventTurma}>
                      {horario.componenteCurricular.turma.serie}{" "}
                      {horario.componenteCurricular.turma.nome}
                    </p>
                    <p className={styles.eventTime}>{horario.hora_inicio}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
