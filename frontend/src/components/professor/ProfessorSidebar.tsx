"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./styles/ProfessorSidebar.module.css";
import {
  FiHome,
  FiUsers,
  FiClipboard,
  FiCalendar,
  FiBarChart2,
  FiMessageSquare,
  FiSettings,
  FiEdit,
  FiUserX,
  FiFileText,
  FiLogOut,
  FiBookOpen,
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  {
    category: "Geral",
    links: [
      { href: "/professor", text: "Início", icon: <FiHome /> },
      { href: "/professor/turmas", text: "Minhas Turmas", icon: <FiUsers /> },
      { href: "/professor/agenda", text: "Agenda", icon: <FiCalendar /> },
    ],
  },
  {
    category: "Acadêmico",
    links: [
      { href: "/professor/provas", text: "Provas", icon: <FiFileText /> },
      {
        href: "/professor/trabalhos",
        text: "Trabalhos",
        icon: <FiClipboard />,
      },
      {
        href: "/professor/atividades",
        text: "Atividades",
        icon: <FiBookOpen />,
      },
      { href: "/professor/correcoes", text: "Correções", icon: <FiEdit /> },
      { href: "/professor/faltas", text: "Lançar Faltas", icon: <FiUserX /> },
      {
        href: "/professor/desempenho",
        text: "Desempenho",
        icon: <FiBarChart2 />,
      },
    ],
  },
  {
    category: "Comunicação",
    links: [
      {
        href: "/professor/mensagens",
        text: "Mensagens",
        icon: <FiMessageSquare />,
      },
    ],
  },
];

export default function ProfessorSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.logo}>Educa+</div>
        <nav className={styles.nav}>
          {navLinks.map((section) => (
            <div key={section.category} className={styles.navSection}>
              <h3 className={styles.navCategory}>{section.category}</h3>
              {section.links.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/professor" &&
                    pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${styles.navLink} ${
                      isActive ? styles.activeLink : ""
                    }`}
                  >
                    <span className={styles.icon}>{link.icon}</span>
                    {link.text}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      <div className={styles.sidebarFooter}>
        <Link
          href="/professor/configuracoes"
          className={`${styles.navLink} ${
            pathname === "/professor/configuracoes" ? styles.activeLink : ""
          }`}
        >
          <FiSettings className={styles.icon} />
          <span>Configurações</span>
        </Link>
        <button
          onClick={signOut}
          className={`${styles.navLink} ${styles.logoutButton}`}
        >
          <FiLogOut className={styles.icon} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
