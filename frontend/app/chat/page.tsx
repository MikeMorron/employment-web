"use client";

import { useActiveAccountRole } from "@/hooks/use-active-account-role";
import ChatEmpresaPage from "@/frontend/empresa/app/chat/page";
import ChatUsuarioPage from "@/frontend/usuario/app/chat/page";

export default function ChatPage() {
  const role = useActiveAccountRole();

  if (role === "company") {
    return <ChatEmpresaPage />;
  }

  return <ChatUsuarioPage />;
}
