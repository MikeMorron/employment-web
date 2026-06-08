"use client";

import { useActiveAccountRole } from "@/hooks/use-active-account-role";
import GuardadoEmpresaPage from "@/frontend/empresa/app/guardado/page";
import GuardadoUsuarioPage from "@/frontend/usuario/app/guardado/page";

export default function GuardadoPage() {
  const role = useActiveAccountRole();

  if (role === "company") {
    return <GuardadoEmpresaPage />;
  }

  return <GuardadoUsuarioPage />;
}
