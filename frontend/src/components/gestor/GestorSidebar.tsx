"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./GestorSidebar.module.css";
import {
  FiHome,
  FiUsers,
  FiGrid,
  FiBookOpen,
  FiLink,
  FiUserCheck,
  FiClock,
  FiAward,
  FiSend,
  FiFileText,
  FiCalendar,
  FiList,
  FiDollarSign,
  FiLayers,
  FiUserPlus,
  FiLogOut,
  FiSettings,
} from "react-icons/fi";
import { RiAdminLine } from "react-icons/ri";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  {
    category: "Visão Geral",
    links: [
      { href: "/gestor", text: "Dashboard", icon: <FiHome /> },
      { href: "/gestor/comunicados", text: "Comunicados", icon: <FiSend /> },
    ],
  },
  {
    category: "Gestão de Pessoas",
    links: [
      { href: "/gestor/usuarios", text: "Usuários", icon: <FiUsers /> },
      {
        href: "/gestor/responsaveis",
        text: "Responsáveis",
        icon: <FiUserPlus />,
      },
      { href: "/gestor/matriculas", text: "Matrículas", icon: <FiUserCheck /> },
    ],
  },
  {
    category: "Acadêmico",
    links: [
      { href: "/gestor/turmas", text: "Turmas", icon: <FiGrid /> },
      { href: "/gestor/materias", text: "Matérias", icon: <FiBookOpen /> },
      { href: "/gestor/vinculos", text: "Vínculos", icon: <FiLink /> },
      { href: "/gestor/horarios", text: "Horários", icon: <FiClock /> },
      {
        href: "/gestor/calendario",
        text: "Calendário Escolar",
        icon: <FiCalendar />,
      },
      { href: "/gestor/bimestres", text: "Bimestres", icon: <FiLayers /> },
      { href: "/gestor/conquistas", text: "Gamificação", icon: <FiAward /> },
    ],
  },
  {
    category: "Administrativo",
    links: [
      {
        href: "/gestor/financeiro",
        text: "Financeiro",
        icon: <FiDollarSign />,
      },
      { href: "/gestor/relatorios", text: "Relatórios", icon: <FiFileText /> },
      { href: "/gestor/auditoria", text: "Auditoria", icon: <FiList /> },
    ],
  },
];

export default function GestorSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <RiAdminLine />
          </div>
          <div className={styles.brandInfo}>
            <h1>Educa+</h1>
            <span className={styles.badge}>Gestor</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {navLinks.map((section, index) => (
            <div key={index} className={styles.section}>
              <h3 className={styles.sectionTitle}>{section.category}</h3>
              <div className={styles.linksContainer}>
                {section.links.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/gestor" && pathname.startsWith(link.href));

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`${styles.navLink} ${
                        isActive ? styles.activeLink : ""
                      }`}
                    >
                      <span className={styles.icon}>{link.icon}</span>
                      <span className={styles.linkText}>{link.text}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className={styles.footer}>
        <button onClick={signOut} className={styles.logoutButton}>
          <FiLogOut className={styles.icon} />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
}
