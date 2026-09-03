"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { TablesListView } from "@/components/admin/tables/tables-list-view";
import { useToast } from "@/components/ui/toast";
import type { TableWithStats } from "@/types/tables";

export interface TablesPageClientProps {
  tables: TableWithStats[];
  loadError?: string;
}

export function TablesPageClient({ tables, loadError }: TablesPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("deleted") === "1") {
      toast({
        title: "Table supprimée",
        description: "La table a été retirée de la configuration.",
        variant: "success",
      });
      router.replace("/admin/tables");
    }
  }, [router, searchParams, toast]);

  return <TablesListView initialTables={tables} loadError={loadError} initialCreate={searchParams.get("create") === "1"} />;
}
