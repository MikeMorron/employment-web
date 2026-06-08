"use client";

import { useActiveAccountRole } from "@/hooks/use-active-account-role";
import PerfilEmpresaPage from "@/frontend/empresa/app/perfil/page";
import PerfilUsuarioPage from "@/frontend/usuario/app/perfil/page";

export default function PerfilPage() {
  const role = useActiveAccountRole();

  if (role === "company") {
    return <PerfilEmpresaPage />;
  }

  return <PerfilUsuarioPage />;
}
