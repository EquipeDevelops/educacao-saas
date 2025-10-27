// src/app/gestor/instituicao/page.tsx
"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./page.module.css";

// Dados MOCKADOS - instituição com múltiplas escolas
const mockInstitution = {
  id: 1,
  name: "Rede Excelência Educacional",
  year: "2024",
  schools: [
    {
      id: 1,
      name: "Unidade Centro",
      students: 450,
      teachers: 25,
      classes: 15,
      average: 8.1,
    },
    {
      id: 2,
      name: "Unidade Jardim",
      students: 280,
      teachers: 15,
      classes: 8,
      average: 7.8,
    },
    {
      id: 3,
      name: "Unidade Norte",
      students: 126,
      teachers: 8,
      classes: 5,
      average: 7.5,
    },
  ],
  metrics: {
    totalStudents: 856,
    totalTeachers: 48,
    totalClasses: 28,
    averageGrade: 7.9,
  },

  // NOVO: Desempenho por Matéria em Cada Escola
  performanceBySchoolAndSubject: [
    { subject: "Matemática", centro: 8.5, jardim: 7.8, norte: 7.2 },
    { subject: "Português", centro: 7.8, jardim: 7.5, norte: 6.9 },
    { subject: "Ciências", centro: 8.9, jardim: 8.2, norte: 7.8 },
    { subject: "História", centro: 7.5, jardim: 7.1, norte: 6.5 },
    { subject: "Geografia", centro: 8.2, jardim: 7.8, norte: 7.3 },
    { subject: "Inglês", centro: 8.7, jardim: 8.1, norte: 7.6 },
  ],

  // NOVO: Taxa de Aprovação por Turma
  approvalByClass: [
    {
      turma: "1° Ano A",
      materia: "Matemática",
      aprovados: 28,
      total: 30,
      percentual: 93.3,
    },
    {
      turma: "1° Ano A",
      materia: "Português",
      aprovados: 26,
      total: 30,
      percentual: 86.7,
    },
    {
      turma: "1° Ano A",
      materia: "Ciências",
      aprovados: 29,
      total: 30,
      percentual: 96.7,
    },
    {
      turma: "8° Ano B",
      materia: "Matemática",
      aprovados: 22,
      total: 28,
      percentual: 78.6,
    },
    {
      turma: "8° Ano B",
      materia: "Português",
      aprovados: 20,
      total: 28,
      percentual: 71.4,
    },
    {
      turma: "8° Ano B",
      materia: "História",
      aprovados: 25,
      total: 28,
      percentual: 89.3,
    },
    {
      turma: "2° Ano C",
      materia: "Matemática",
      aprovados: 18,
      total: 25,
      percentual: 72.0,
    },
    {
      turma: "2° Ano C",
      materia: "Geografia",
      aprovados: 22,
      total: 25,
      percentual: 88.0,
    },
    {
      turma: "2° Ano C",
      materia: "Inglês",
      aprovados: 24,
      total: 25,
      percentual: 96.0,
    },
  ],

  // NOVO: Taxa de Aprovação por Matéria
  approvalBySubject: [
    { materia: "Matemática", aprovados: 85, total: 100, percentual: 85.0 },
    { materia: "Português", aprovados: 78, total: 100, percentual: 78.0 },
    { materia: "Ciências", aprovados: 92, total: 100, percentual: 92.0 },
    { materia: "História", aprovados: 81, total: 100, percentual: 81.0 },
    { materia: "Geografia", aprovados: 87, total: 100, percentual: 87.0 },
    { materia: "Inglês", aprovados: 90, total: 100, percentual: 90.0 },
  ],

  // Dados existentes mantidos
  studentsByGrade: [
    { grade: "1° Ano", students: 150, percentage: 17.5 },
    { grade: "2° Ano", students: 140, percentage: 16.4 },
    { grade: "3° Ano", students: 130, percentage: 15.2 },
    { grade: "4° Ano", students: 125, percentage: 14.6 },
    { grade: "5° Ano", students: 120, percentage: 14.0 },
    { grade: "6° Ano", students: 95, percentage: 11.1 },
    { grade: "7° Ano", students: 50, percentage: 5.8 },
    { grade: "8° Ano", students: 46, percentage: 5.4 },
  ],
  gradeEvolution: [
    { period: "1° Bim", average: 7.2 },
    { period: "2° Bim", average: 7.5 },
    { period: "3° Bim", average: 7.8 },
    { period: "4° Bim", average: 8.1 },
  ],
  approvalRate: [
    { name: "Aprovados", value: 82, color: "#27ae60" },
    { name: "Recuperação", value: 12, color: "#f39c12" },
    { name: "Reprovados", value: 6, color: "#e74c3c" },
  ],
};

// Cores para os gráficos
const COLORS = [
  "#3498db",
  "#9b59b6",
  "#2ecc71",
  "#e74c3c",
  "#f39c12",
  "#1abc9c",
];
const SCHOOL_COLORS = {
  centro: "#3498db",
  jardim: "#9b59b6",
  norte: "#2ecc71",
};

type TabType =
  | "overview"
  | "schools"
  | "professionals"
  | "students"
  | "statistics";

export default function InstitutionPage() {
  const [activeTab, setActiveTab] = useState<TabType>("statistics");
  const [selectedSchool, setSelectedSchool] = useState<number>(0);

  const institution = mockInstitution;

  // Tooltip personalizado para gráficos
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className={styles.tooltipValue}
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
              {entry.dataKey === "average" && " pontos"}
              {entry.dataKey === "percentage" && "%"}
              {entry.dataKey === "students" && " alunos"}
              {entry.dataKey === "percentual" && "%"}
              {entry.dataKey?.includes("centro") && " (Centro)"}
              {entry.dataKey?.includes("jardim") && " (Jardim)"}
              {entry.dataKey?.includes("norte") && " (Norte)"}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Tooltip específico para taxa de aprovação
  const ApprovalTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className={styles.tooltipValue}
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value}%
              {entry.payload && entry.payload.total && (
                <span>
                  {" "}
                  ({entry.payload.aprovados}/{entry.payload.total} alunos)
                </span>
              )}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      {/* CABEÇALHO COM SELETOR */}
      <header className={styles.header}>
        <div>
          <h1>{institution.name}</h1>
          <p className={styles.subtitle}>
            Dados referentes ao ano de {institution.year}
          </p>
        </div>
        <div className={styles.schoolSelector}>
          <label htmlFor="school-select">Visualizar:</label>
          <select
            id="school-select"
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(Number(e.target.value))}
          >
            <option value={0}>Todas as Escolas</option>
            {institution.schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* CARDS DE MÉTRICAS */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <h3>Total de Alunos</h3>
          <span className={styles.metricValue}>
            {institution.metrics.totalStudents}
          </span>
        </div>
        <div className={styles.metricCard}>
          <h3>Professores</h3>
          <span className={styles.metricValue}>
            {institution.metrics.totalTeachers}
          </span>
        </div>
        <div className={styles.metricCard}>
          <h3>Turmas</h3>
          <span className={styles.metricValue}>
            {institution.metrics.totalClasses}
          </span>
        </div>
        <div className={styles.metricCard}>
          <h3>Média Geral</h3>
          <span className={styles.metricValue}>
            {institution.metrics.averageGrade}
          </span>
        </div>
      </div>

      {/* ABA DE NAVEGAÇÃO */}
      <nav className={styles.tabNavigation}>
        <button
          className={`${styles.tab} ${
            activeTab === "overview" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Visão Geral
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "schools" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("schools")}
        >
          Escolas
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "professionals" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("professionals")}
        >
          Profissionais
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "students" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("students")}
        >
          Alunos
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "statistics" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("statistics")}
        >
          Estatísticas
        </button>
      </nav>

      {/* CONTEÚDO DAS ABAS */}
      <div className={styles.tabContent}>
        {activeTab === "overview" && (
          <div>
            <h2>Escolas da Rede</h2>
            <div className={styles.schoolsGrid}>
              {institution.schools.map((school) => (
                <div key={school.id} className={styles.schoolCard}>
                  <div className={styles.schoolHeader}>
                    <h3>{school.name}</h3>
                    <span className={styles.schoolAverage}>
                      {school.average}
                    </span>
                  </div>
                  <div className={styles.schoolMetrics}>
                    <div className={styles.schoolMetric}>
                      <span className={styles.metricLabel}>Alunos</span>
                      <span className={styles.metricValue}>
                        {school.students}
                      </span>
                    </div>
                    <div className={styles.schoolMetric}>
                      <span className={styles.metricLabel}>Professores</span>
                      <span className={styles.metricValue}>
                        {school.teachers}
                      </span>
                    </div>
                    <div className={styles.schoolMetric}>
                      <span className={styles.metricLabel}>Turmas</span>
                      <span className={styles.metricValue}>
                        {school.classes}
                      </span>
                    </div>
                  </div>
                  <button
                    className={styles.schoolButton}
                    onClick={() => {
                      setSelectedSchool(school.id);
                      setActiveTab("schools");
                    }}
                  >
                    Gerenciar Escola →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "schools" && (
          <div>
            <h2>Gestão de Escolas</h2>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome da Escola</th>
                    <th>Alunos</th>
                    <th>Professores</th>
                    <th>Turmas</th>
                    <th>Média</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {institution.schools.map((school) => (
                    <tr key={school.id}>
                      <td>
                        <strong>{school.name}</strong>
                      </td>
                      <td>{school.students}</td>
                      <td>{school.teachers}</td>
                      <td>{school.classes}</td>
                      <td>
                        <span
                          className={`${styles.grade} ${
                            school.average >= 7.5 ? styles.high : styles.medium
                          }`}
                        >
                          {school.average}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button className={styles.primaryButton}>
                            Editar
                          </button>
                          <button className={styles.secondaryButton}>
                            Relatório
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "professionals" && (
          <div>
            <h2>Profissionais da Instituição</h2>
            <div className={styles.placeholder}>
              <p>Módulo de Gestão de Profissionais em Desenvolvimento</p>
              <p>
                Aqui será exibida a lista completa de profissionais da
                instituição
              </p>
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <div>
            <h2>Alunos da Instituição</h2>
            <div className={styles.placeholder}>
              <p>Módulo de Gestão de Alunos em Desenvolvimento</p>
              <p>Aqui será exibida a lista completa de alunos da instituição</p>
            </div>
          </div>
        )}

        {activeTab === "statistics" && (
          <div>
            <h2>Estatísticas da Instituição</h2>

            {/* GRID DE GRÁFICOS */}
            <div className={styles.chartsGrid}>
              {/* NOVO: Desempenho por Matéria em Cada Escola */}
              <div className={styles.chartCard}>
                <h3>Desempenho por Matéria - Comparação entre Escolas</h3>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={institution.performanceBySchoolAndSubject}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis domain={[6, 10]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="centro"
                        name="Unidade Centro"
                        fill={SCHOOL_COLORS.centro}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="jardim"
                        name="Unidade Jardim"
                        fill={SCHOOL_COLORS.jardim}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="norte"
                        name="Unidade Norte"
                        fill={SCHOOL_COLORS.norte}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* NOVO: Taxa de Aprovação por Matéria */}
              <div className={styles.chartCard}>
                <h3>Taxa de Aprovação por Matéria</h3>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={institution.approvalBySubject}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="materia" />
                      <YAxis domain={[70, 100]} />
                      <Tooltip content={<ApprovalTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="percentual"
                        name="Taxa de Aprovação (%)"
                        fill="#27ae60"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* NOVO: Taxa de Aprovação por Turma e Matéria */}
              <div className={styles.chartCard}>
                <h3>Taxa de Aprovação por Turma e Matéria</h3>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={institution.approvalByClass}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="turma" />
                      <YAxis domain={[60, 100]} />
                      <Tooltip content={<ApprovalTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="percentual"
                        name="Aprovação (%)"
                        fill="#3498db"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico: Distribuição de Alunos por Série */}
              <div className={styles.chartCard}>
                <h3>Distribuição por Série</h3>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={institution.studentsByGrade}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="students"
                        name="Quantidade de Alunos"
                        fill="#9b59b6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico: Evolução das Notas */}
              <div className={styles.chartCard}>
                <h3>Evolução da Média Geral</h3>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={institution.gradeEvolution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis domain={[6, 9]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="average"
                        name="Média Geral"
                        stroke="#e74c3c"
                        strokeWidth={3}
                        dot={{ r: 6 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico: Taxa de Aprovação Geral */}
              <div className={styles.chartCard}>
                <h3>Taxa de Aprovação Geral</h3>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={institution.approvalRate}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {institution.approvalRate.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Percentual"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
