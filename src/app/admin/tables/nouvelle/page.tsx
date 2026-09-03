import { redirect } from "next/navigation";

import { requireAdmin } from "@/server/auth";

export default async function NewTablePage() {
  await requireAdmin();
  redirect("/admin/tables?create=1");
}
