import {
  Armchair,
  History,
  Images,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/invites",
    label: "Invités",
    icon: Users,
  },
  {
    href: "/admin/tables",
    label: "Tables",
    icon: Armchair,
  },
  {
    href: "/admin/billets",
    label: "Billets",
    icon: Ticket,
  },
  {
    href: "/admin/controleurs",
    label: "Contrôleurs",
    icon: ShieldCheck,
  },
  {
    href: "/admin/historique",
    label: "Historique",
    icon: History,
  },
  {
    href: "/admin/galerie",
    label: "Galerie",
    icon: Images,
  },
  {
    href: "/admin/parametres",
    label: "Paramètres",
    icon: Settings,
  },
];

export function isAdminNavItemActive(pathname: string, item: AdminNavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function getAdminBreadcrumb(pathname: string): string[] {
  if (pathname === "/admin") {
    return ["Tableau de bord"];
  }

  const matches = ADMIN_NAV_ITEMS.filter(
    (navItem) => pathname === navItem.href || pathname.startsWith(`${navItem.href}/`),
  ).sort((left, right) => right.href.length - left.href.length);

  const item = matches[0];

  return item ? ["Administration", item.label] : ["Administration"];
}
