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
} from "react-icons/fi";

const navLinks = [
  { href: "/professor", text: "Início", icon: <FiHome /> },
  { href: "/professor/turmas", text: "Turmas", icon: <FiUsers /> },
  { href: "/professor/atividades", text: "Atividades", icon: <FiClipboard /> },
  { href: "/professor/correcoes", text: "Correções", icon: <FiEdit /> },
  { href: "/professor/faltas", text: "Faltas", icon: <FiUserX /> },
  { href: "/professor/agenda", text: "Agenda", icon: <FiCalendar /> },
  { href: "/professor/desempenho", text: "Desempenho", icon: <FiBarChart2 /> },
  {
    href: "/professor/mensagens",
    text: "Mensagens",
    icon: <FiMessageSquare />,
  },
  {
    href: "/professor/configuracoes",
    text: "Configurações",
    icon: <FiSettings />,
  },
];

export default function ProfessorSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>Educa+</div>
      <nav className={styles.nav}>
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/professor" && pathname.startsWith(link.href));
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
      </nav>
    </aside>
  );
}
