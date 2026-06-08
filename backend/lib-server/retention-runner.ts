import { getEmailProvider } from "@/lib/server/providers/email-provider";
import { renderRetentionEmail } from "@/lib/server/retention-templates";
import { prisma } from "./db";

export async function runRetentionDispatch(limit = 50): Promise<{ dispatched: number }> {
  const tasks = await prisma.retentionTask.findMany({
    where: {
      status: {
        in: ["pending", "scheduled"],
      },
      scheduledAt: { lte: new Date() },
    },
    take: limit,
    orderBy: { scheduledAt: "asc" },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  let dispatched = 0;

  for (const task of tasks) {
    try {
      await prisma.retentionTask.update({
        where: { id: task.id },
        data: { status: "processing" },
      });

      if (task.channel === "email") {
        if (!task.user?.email) {
          throw new Error("Retention task email delivery requires a user email");
        }

        const payload = task.payloadJson ? JSON.parse(task.payloadJson) as Record<string, unknown> : null;
        const email = renderRetentionEmail(task.kind, payload);
        const provider = getEmailProvider();
        const result = await provider.send({
          to: task.user.email,
          subject: email.subject,
          html: email.html,
          text: email.text,
        });

        await prisma.retentionTask.update({
          where: { id: task.id },
          data: {
            status: "sent",
            sentAt: new Date(),
            providerMessageId: result.providerMessageId ?? null,
            lastError: null,
          },
        });

        dispatched++;
        continue;
      }

      await prisma.retentionTask.update({
        where: { id: task.id },
        data: {
          status: "sent",
          sentAt: new Date(),
          lastError: null,
        },
      });

      dispatched++;
    } catch (error) {
      await prisma.retentionTask.update({
        where: { id: task.id },
        data: {
          status: "failed",
          retries: { increment: 1 },
          lastError: error instanceof Error ? error.message : "Unknown retention dispatch error",
        },
      }).catch(() => {});
    }
  }

  return { dispatched };
}
