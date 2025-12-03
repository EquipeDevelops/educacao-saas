'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import {
  format,
  parse,
  startOfWeek,
  getDay,
  eachDayOfInterval,
  startOfYear,
  endOfYear,
  setHours,
  setMinutes,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { api } from '@/services/api';
import styles from './calendario.module.css';
import Loading from '@/components/loading/Loading';
import Modal from '@/components/modal/Modal';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Type,
  AlignLeft,
  Trash2,
  MapPin,
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Configuração do Localizer
const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Tipos
interface Evento {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  type:
    | 'REUNIAO'
    | 'FERIADO'
    | 'EVENTO_ESCOLAR'
    | 'PROVA'
    | 'RECUPERACAO'
    | 'OUTRO'
    | 'AULA';
  allDay?: boolean;
}

interface HorarioAula {
  id: string;
  dia_semana: string; // 'SEGUNDA', 'TERCA', etc.
  hora_inicio: string; // '08:00'
  hora_fim: string; // '09:00'
  componenteCurricular: {
    materia: { nome: string };
    turma: { nome: string };
  };
}

// Cores
const eventColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  REUNIAO: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
  FERIADO: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  EVENTO_ESCOLAR: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
  PROVA: { bg: '#fff7ed', border: '#f97316', text: '#9a3412' },
  RECUPERACAO: { bg: '#faf5ff', border: '#a855f7', text: '#6b21a8' },
  OUTRO: { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
  AULA: { bg: '#f0f9ff', border: '#0ea5e9', text: '#0369a1' }, // Azul Claro para Aulas
};

const tiposEvento = [
  { label: 'Reunião', value: 'REUNIAO' },
  { label: 'Evento Escolar', value: 'EVENTO_ESCOLAR' },
  { label: 'Prova', value: 'PROVA' },
  { label: 'Recuperação', value: 'RECUPERACAO' },
  { label: 'Feriado', value: 'FERIADO' },
  { label: 'Outro', value: 'OUTRO' },
];

export default function CalendarioPage() {
  const [events, setEvents] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [formState, setFormState] = useState({
    title: '',
    start: '',
    end: '',
    startTime: '08:00',
    endTime: '09:00',
    description: '',
    location: '',
    type: 'EVENTO_ESCOLAR',
    allDay: false,
  });

  // Função auxiliar para mapear dia da semana (String) para número (0-6)
  const mapDiaSemana = (dia: string): number => {
    const mapa: Record<string, number> = {
      DOMINGO: 0,
      SEGUNDA: 1,
      TERCA: 2,
      QUARTA: 3,
      QUINTA: 4,
      SEXTA: 5,
      SABADO: 6,
    };
    return mapa[dia] ?? -1;
  };

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. Buscar Eventos Únicos
      const eventosResponse = await api.get('/eventos');
      const formattedEvents: Evento[] = eventosResponse.data.map(
        (evt: any) => ({
          id: evt.id,
          title: evt.titulo,
          start: new Date(evt.data_inicio),
          end: new Date(evt.data_fim),
          description: evt.descricao,
          type: evt.tipo,
          allDay: evt.dia_inteiro,
          location: evt.local,
        }),
      );

      // 2. Buscar Horários de Aula (Aulas Recorrentes)
      try {
        const horariosResponse = await api.get('/horarios'); // Assume rota /horarios
        const horarios: HorarioAula[] = horariosResponse.data;

        // Gerar eventos de aula para o ano atual
        // Nota: Idealmente isso seria feito no backend ou paginado,
        // mas faremos no front para o ano corrente para garantir visualização imediata.
        const start = startOfYear(new Date());
        const end = endOfYear(new Date());
        const daysOfYear = eachDayOfInterval({ start, end });

        const classEvents: Evento[] = [];

        horarios.forEach((horario) => {
          const targetDay = mapDiaSemana(horario.dia_semana);
          if (targetDay === -1) return;

          // Filtra dias do ano que correspondem ao dia da semana da aula
          const matchingDays = daysOfYear.filter(
            (d) => getDay(d) === targetDay,
          );

          matchingDays.forEach((day) => {
            const [hInicio, mInicio] = horario.hora_inicio
              .split(':')
              .map(Number);
            const [hFim, mFim] = horario.hora_fim.split(':').map(Number);

            classEvents.push({
              id: `aula-${horario.id}-${day.getTime()}`, // ID único virtual
              title: `${horario.componenteCurricular.materia.nome} - ${horario.componenteCurricular.turma.nome}`,
              start: setMinutes(setHours(day, hInicio), mInicio),
              end: setMinutes(setHours(day, hFim), mFim),
              type: 'AULA',
              allDay: false,
              description: `Aula de ${horario.componenteCurricular.materia.nome}`,
            });
          });
        });

        setEvents([...formattedEvents, ...classEvents]);
      } catch (err) {
        console.warn(
          'Rota de horários não disponível ou erro ao buscar aulas:',
          err,
        );
        setEvents(formattedEvents);
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error('Erro ao carregar dados do calendário.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // --- Navegação ---
  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);
  const onView = useCallback((newView: View) => setView(newView), []);

  // --- Handlers do Modal ---
  const resetForm = () => {
    setFormState({
      title: '',
      start: format(new Date(), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd'),
      startTime: '08:00',
      endTime: '09:00',
      description: '',
      location: '',
      type: 'EVENTO_ESCOLAR',
      allDay: false,
    });
    setSelectedEvent(null);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    resetForm();
    setFormState((prev) => ({
      ...prev,
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
      startTime: format(start, 'HH:mm'),
      endTime: format(end, 'HH:mm'),
    }));
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event: Evento) => {
    // Aulas geradas não são editáveis diretamente aqui (são baseadas em horários)
    if (event.type === 'AULA') {
      toast.info(
        'Este é um horário de aula recorrente. Edite-o no menu de Horários.',
      );
      return;
    }

    setSelectedEvent(event);
    setFormState({
      title: event.title,
      start: format(event.start, 'yyyy-MM-dd'),
      end: format(event.end, 'yyyy-MM-dd'),
      startTime: format(event.start, 'HH:mm'),
      endTime: format(event.end, 'HH:mm'),
      description: event.description || '',
      location: event.location || '',

      type: event.type,
      allDay: event.allDay || false,
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    // @ts-expect-error - Checked property exists on target but TS doesn't know it's an input
    const checked = e.target.checked;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startDateTime = new Date(
      `${formState.start}T${
        formState.allDay ? '00:00:00' : formState.startTime
      }`,
    );
    const endDateTime = new Date(
      `${formState.end}T${formState.allDay ? '23:59:59' : formState.endTime}`,
    );

    const payload = {
      titulo: formState.title,
      descricao: formState.description,
      tipo: formState.type,
      data_inicio: startDateTime.toISOString(),
      data_fim: endDateTime.toISOString(),
      dia_inteiro: formState.allDay,
      local: formState.location,
    };

    try {
      if (selectedEvent) {
        await api.put(`/eventos/${selectedEvent.id}`, payload);
        toast.success('Evento atualizado!');
      } else {
        await api.post('/eventos', payload);
        toast.success('Evento criado!');
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (error: unknown) {
      toast.error(
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Erro ao salvar evento.',
      );
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        await api.delete(`/eventos/${selectedEvent.id}`);
        toast.success('Evento excluído.');
        setIsModalOpen(false);
        fetchEvents();
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir evento.');
      }
    }
  };

  const eventPropGetter = (event: Evento) => {
    const style = eventColors[event.type] || eventColors.OUTRO;
    return {
      style: {
        backgroundColor: style.bg,
        color: style.text,
        borderLeft: `4px solid ${style.border}`,
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        borderRadius: '4px',
        fontSize: '0.85rem',
        fontWeight: '600',
        padding: '2px 5px',
      },
    };
  };

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => toolbar.onNavigate('PREV');
    const goToNext = () => toolbar.onNavigate('NEXT');
    const goToToday = () => toolbar.onNavigate('TODAY');

    const label = () => (
      <span className={styles.toolbarLabel}>
        {format(toolbar.date, 'MMMM yyyy', { locale: ptBR })}
      </span>
    );

    return (
      <div className={styles.toolbarContainer}>
        <div className={styles.navigationGroup}>
          <button onClick={goToBack} className={styles.navBtn}>
            <ChevronLeft size={20} />
          </button>
          <button onClick={goToToday} className={styles.todayBtn}>
            Hoje
          </button>
          <button onClick={goToNext} className={styles.navBtn}>
            <ChevronRight size={20} />
          </button>
          {label()}
        </div>

        <div className={styles.viewGroup}>
          <button
            className={`${styles.viewBtn} ${
              toolbar.view === 'month' ? styles.active : ''
            }`}
            onClick={() => toolbar.onView('month')}
          >
            Mês
          </button>
          <button
            className={`${styles.viewBtn} ${
              toolbar.view === 'week' ? styles.active : ''
            }`}
            onClick={() => toolbar.onView('week')}
          >
            Semana
          </button>
          <button
            className={`${styles.viewBtn} ${
              toolbar.view === 'day' ? styles.active : ''
            }`}
            onClick={() => toolbar.onView('day')}
          >
            Dia
          </button>
          <button
            className={`${styles.viewBtn} ${
              toolbar.view === 'agenda' ? styles.active : ''
            }`}
            onClick={() => toolbar.onView('agenda')}
          >
            Agenda
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) return <Loading />;

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Calendário Acadêmico</h1>
          <p>Organize eventos e visualize horários de aulas.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className={styles.btnPrimary}
        >
          <Plus size={20} /> Novo Evento
        </button>
      </header>

      <div className={styles.calendarWrapper}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: '600px' }}
          culture="pt-BR"
          messages={{
            next: 'Próximo',
            previous: 'Anterior',
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            agenda: 'Agenda',
            date: 'Data',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'Não há eventos neste período.',
          }}
          components={{ toolbar: CustomToolbar }}
          view={view}
          onView={onView}
          date={date}
          onNavigate={onNavigate}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventPropGetter}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedEvent ? 'Editar Evento' : 'Novo Evento'}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Título do Evento</label>
            <div className={styles.inputIconWrapper}>
              <Type size={18} />
              <input
                name="title"
                value={formState.title}
                onChange={handleInputChange}
                placeholder="Ex: Reunião de Pais"
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Tipo de Evento</label>
              <select
                name="type"
                value={formState.type}
                onChange={handleInputChange}
                className={styles.select}
              >
                {tiposEvento.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                name="allDay"
                id="allDay"
                checked={formState.allDay}
                onChange={handleInputChange}
              />
              <label htmlFor="allDay">Dia Inteiro</label>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Início</label>
              <div className={styles.dateTimeWrapper}>
                <input
                  type="date"
                  name="start"
                  value={formState.start}
                  onChange={handleInputChange}
                  required
                />
                {!formState.allDay && (
                  <input
                    type="time"
                    name="startTime"
                    value={formState.startTime}
                    onChange={handleInputChange}
                    required
                  />
                )}
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label>Fim</label>
              <div className={styles.dateTimeWrapper}>
                <input
                  type="date"
                  name="end"
                  value={formState.end}
                  onChange={handleInputChange}
                  required
                />
                {!formState.allDay && (
                  <input
                    type="time"
                    name="endTime"
                    value={formState.endTime}
                    onChange={handleInputChange}
                    required
                  />
                )}
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Local (Opcional)</label>
            <div className={styles.inputIconWrapper}>
              <MapPin size={18} />
              <input
                name="location"
                value={formState.location}
                onChange={handleInputChange}
                placeholder="Ex: Auditório Principal"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Descrição</label>
            <div className={styles.inputIconWrapper}>
              <AlignLeft size={18} />
              <textarea
                name="description"
                value={formState.description}
                onChange={handleInputChange}
                placeholder="Detalhes adicionais..."
                rows={3}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            {selectedEvent && (
              <button
                type="button"
                onClick={handleDelete}
                className={styles.btnDanger}
              >
                <Trash2 size={18} /> Excluir
              </button>
            )}
            <div className={styles.rightActions}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={styles.btnGhost}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.btnPrimary}>
                Salvar
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
