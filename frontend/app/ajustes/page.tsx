"use client";

import { useActiveAccountRole } from "@/hooks/use-active-account-role";
import AjustesEmpresaPage from "@/frontend/empresa/app/ajustes/page";
import AjustesUsuarioPage from "@/frontend/usuario/app/ajustes/page";

export default function AjustesPage() {
  const role = useActiveAccountRole();

  if (role === "company") {
    return <AjustesEmpresaPage />;
  }

  return <AjustesUsuarioPage />;
}
