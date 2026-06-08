"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { GlobalLoadingScreen } from "@/components/ui/global-loading-screen";
import { useAuthUser } from "@/hooks/use-auth-user";
import { getForbiddenRouteRedirect } from "@/lib/role-access";
import { safeRouterReplace } from "@/lib/safe-redirect";
import type { UserRole } from "@/types/account";

export function RoleRouteGuard({
  allowedRole,
  children,
}: {
  allowedRole: UserRole | UserRole[];
  children: ReactNode;
}) {
  const router = useRouter();
  const { authUser, authLoading } = useAuthUser();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authUser) {
      safeRouterReplace(router, "/", "/");
      return;
    }

    const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

    if (!allowedRoles.includes(authUser.role)) {
      safeRouterReplace(router, getForbiddenRouteRedirect(authUser.role), "/");
    }
  }, [allowedRole, authLoading, authUser, router]);

  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

  if (authLoading || !authUser || !allowedRoles.includes(authUser.role)) {
    return <GlobalLoadingScreen />;
  }

  return <>{children}</>;
}
