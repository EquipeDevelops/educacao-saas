import styles from './style.module.css';

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

export default function AgendaSemana({ horarios }: AgendaSemanaProps) {
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const diasCompletos = [
    'SEGUNDA',
    'TERCA',
    'QUARTA',
    'QUINTA',
    'SEXTA',
    'SABADO',
    'DOMINGO',
  ];

  const getHorariosDoDia = (dia: string) => {
    return horarios
      .filter((h) => h.dia_semana === dia)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  };

  const diaAtual = new Date().getDate();

  return (
    <div className={styles.widget}>
      <h2 className={styles.title}>
        <span></span>Agenda da Semana
      </h2>
      <div className={styles.grid}>
        {dias.map((dia, index) => (
          <div
            key={dia}
            className={`${styles.dayColumn} ${
              new Date().getDate() + index - new Date().getDay() + 1 ===
              diaAtual
                ? styles.diaSelecionado
                : ''
            }`}
          >
            <div className={styles.dayHeader}>
              <span>{dia}</span>
              <span className={styles.dayNumber}>
                {new Date().getDate() + index - new Date().getDay() + 1}
              </span>
            </div>
            <div className={styles.events}>
              {getHorariosDoDia(diasCompletos[index]).map((horario) => {
                return (
                  <div key={horario.id} className={styles.event}>
                    <p className={styles.eventMateria}>
                      {horario.componenteCurricular.materia.nome}
                    </p>
                    <p className={styles.eventTurma}>
                      {horario.componenteCurricular.turma.serie}{' '}
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
