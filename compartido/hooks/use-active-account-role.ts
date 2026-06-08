"use client";

import { useAuthUser } from "@/hooks/use-auth-user";

export function useActiveAccountRole() {
  const { authUser } = useAuthUser();
  return authUser?.role ?? "candidate";
}
