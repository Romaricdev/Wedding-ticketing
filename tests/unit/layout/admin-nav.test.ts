import { describe, expect, it } from "vitest";

import {
  ADMIN_NAV_ITEMS,
  getAdminBreadcrumb,
  isAdminNavItemActive,
} from "@/components/layout/admin-nav";

describe("admin-nav", () => {
  it("contient les huit entrées dans le bon ordre", () => {
    expect(ADMIN_NAV_ITEMS.map((item) => item.label)).toEqual([
      "Tableau de bord",
      "Invités",
      "Tables",
      "Billets",
      "Contrôleurs",
      "Historique",
      "Galerie",
      "Paramètres",
    ]);
  });

  it("marque le tableau de bord actif uniquement sur /admin", () => {
    const dashboard = ADMIN_NAV_ITEMS[0];

    expect(isAdminNavItemActive("/admin", dashboard)).toBe(true);
    expect(isAdminNavItemActive("/admin/invites", dashboard)).toBe(false);
  });

  it("marque une sous-route admin comme active", () => {
    const invites = ADMIN_NAV_ITEMS[1];

    expect(isAdminNavItemActive("/admin/invites/nouveau", invites)).toBe(true);
  });

  it("construit un fil d'Ariane pour une route enfant", () => {
    expect(getAdminBreadcrumb("/admin/tables")).toEqual(["Administration", "Tables"]);
  });
});
