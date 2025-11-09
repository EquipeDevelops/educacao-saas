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
} from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { href: "/gestor", text: "Início", icon: <FiHome /> },
  { href: "/gestor/usuarios", text: "Usuários", icon: <FiUsers /> },
  {
    href: "/gestor/responsaveis",
    text: "Responsáveis",
    icon: <FiUserPlus />,
  },
  { href: "/gestor/turmas", text: "Turmas", icon: <FiGrid /> },
  { href: "/gestor/materias", text: "Matérias", icon: <FiBookOpen /> },
  { href: "/gestor/vinculos", text: "Vínculos", icon: <FiLink /> },
  { href: "/gestor/matriculas", text: "Matrículas", icon: <FiUserCheck /> },
  { href: "/gestor/horarios", text: "Horários", icon: <FiClock /> },
  { href: "/gestor/calendario", text: "Calendario", icon: <FiCalendar /> },
  { href: "/gestor/bimestres", text: "Bimestres", icon: <FiLayers /> },
  { href: "/gestor/conquistas", text: "Conquistas", icon: <FiAward /> },
  { href: "/gestor/comunicados", text: "Comunicados", icon: <FiSend /> },
  { href: "/gestor/relatorios", text: "Relatórios", icon: <FiFileText /> },
  { href: "/gestor/financeiro", text: "Financeiro", icon: <FiDollarSign /> },
  { href: "/gestor/auditoria", text: "Auditoria", icon: <FiList /> },
];

export default function GestorSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div>
        <div className={styles.logo}>Educa+ Gestor</div>
        <nav className={styles.nav}>
          {navLinks.map((link) => {
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
                {link.text}
              </Link>
            );
          })}
        </nav>
      </div>
      <button onClick={signOut} className={styles.logoutButton}>
        Sair
      </button>
    </aside>
  );
}
