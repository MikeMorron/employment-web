import { randomUUID } from "node:crypto";
import type { ProductNotification } from "@/types/notifications";
import type { RetentionTaskRecord } from "@/types/product";
import type { AppState } from "@/lib/server/app-state";

export type ProductState = Pick<AppState, "companyJobs" | "applications" | "preferences">;

export function buildNotification(input: Omit<ProductNotification, "id" | "createdAt" | "read"> & {
  id?: string;
  createdAt?: string;
  read?: boolean;
}): ProductNotification {
  return {
    id: input.id ?? randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    read: input.read ?? false,
    ...input,
  };
}

export function uniqueNotifications(items: ProductNotification[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const dedupe = `${item.type}:${item.userId}:${item.entityId ?? item.jobId ?? item.applicationId ?? item.id}`;
    if (seen.has(dedupe)) {
      return false;
    }

    seen.add(dedupe);
    return true;
  });
}

export function buildSharedRetentionMessage(task: RetentionTaskRecord) {
  if (task.kind === "profile_incomplete") {
    const currentCompleteness = Number(task.payload?.profileCompleteness ?? 0);
    const remaining = Math.max(0, 100 - Math.max(0, Math.min(100, currentCompleteness)));

    return `Tu perfil aún no está en su prime, completa el ${remaining}% restante para mejorar tu posicionamiento y oportunidades de match.`;
  }

  if (task.kind === "profile_interest_digest") {
    const companies = Array.isArray(task.payload?.companies) ? task.payload.companies : [];
    const count = Number(task.payload?.count ?? companies.length ?? 0);

    if (companies.length > 0) {
      return `Más de ${count} empresas vieron tu perfil recientemente: ${companies.slice(0, 5).join(", ")}.`;
    }

    return `Más de ${count} empresas vieron tu perfil recientemente.`;
  }

  return null;
}
