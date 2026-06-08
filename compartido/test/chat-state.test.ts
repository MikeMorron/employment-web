import assert from "node:assert/strict";
import {
  buildInitialChatStore,
  getConversationPeer,
  getConversationUnreadCount,
  markConversationRead,
  reportConversation,
  sendMessageInChatStore,
  setConversationBlocked,
  setConversationMuted,
} from "@/lib/chat-state";
import type { ChatParticipant } from "@/types/chat";

const company: ChatParticipant = {
  id: "company-001",
  name: "Acme Hiring",
  role: "company",
  headline: "Acme Hiring",
  location: "Bogota",
};

const candidate: ChatParticipant = {
  id: "candidate-001",
  name: "Laura Bernal",
  role: "candidate",
  headline: "Senior Frontend Engineer",
  location: "Bogota",
};

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("company can start a new conversation with the first message", () => {
  const result = sendMessageInChatStore(
    { version: 1, conversations: [], reports: [] },
    {
      sender: company,
      recipient: candidate,
      body: "Hola Laura, queremos iniciar tu proceso.",
      sentAt: "2026-05-18T10:00:00.000Z",
    },
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.store.conversations.length, 1);
  assert.equal(result.store.conversations[0]?.createdById, company.id);
  assert.equal(result.store.conversations[0]?.messages[0]?.senderId, company.id);
});

runTest("candidate cannot start a brand new conversation", () => {
  const result = sendMessageInChatStore(
    { version: 1, conversations: [], reports: [] },
    {
      sender: candidate,
      recipient: company,
      body: "Quiero iniciar esta conversación.",
    },
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    return;
  }

  assert.equal(result.error, "company_initiation_required");
});

runTest("candidate can reply after the company opens the thread", () => {
  const started = sendMessageInChatStore(
    { version: 1, conversations: [], reports: [] },
    {
      sender: company,
      recipient: candidate,
      body: "Hola Laura, queremos iniciar tu proceso.",
      sentAt: "2026-05-18T10:00:00.000Z",
    },
  );

  assert.equal(started.ok, true);
  if (!started.ok) {
    return;
  }

  const replied = sendMessageInChatStore(started.store, {
    conversationId: started.conversationId,
    sender: candidate,
    body: "Perfecto, quedo atento.",
    sentAt: "2026-05-18T10:02:00.000Z",
  });

  assert.equal(replied.ok, true);
  if (!replied.ok) {
    return;
  }

  assert.equal(replied.store.conversations[0]?.messages.length, 2);
  assert.equal(replied.store.conversations[0]?.messages[1]?.senderId, candidate.id);
});

runTest("blocking a conversation prevents either side from sending more messages", () => {
  const started = sendMessageInChatStore(
    { version: 1, conversations: [], reports: [] },
    {
      sender: company,
      recipient: candidate,
      body: "Hola Laura, queremos iniciar tu proceso.",
      sentAt: "2026-05-18T10:00:00.000Z",
    },
  );

  assert.equal(started.ok, true);
  if (!started.ok) {
    return;
  }

  const blockedStore = setConversationBlocked(
    started.store,
    started.conversationId,
    candidate.id,
    true,
  );

  const companyAttempt = sendMessageInChatStore(blockedStore, {
    conversationId: started.conversationId,
    sender: company,
    body: "Seguimos atentos.",
  });
  const candidateAttempt = sendMessageInChatStore(blockedStore, {
    conversationId: started.conversationId,
    sender: candidate,
    body: "Quiero responder.",
  });

  assert.equal(companyAttempt.ok, false);
  assert.equal(candidateAttempt.ok, false);
  if (!companyAttempt.ok) {
    assert.equal(companyAttempt.error, "conversation_blocked_by_peer");
  }
  if (!candidateAttempt.ok) {
    assert.equal(candidateAttempt.error, "conversation_blocked_by_you");
  }
});

runTest("mute, report, and read state are stored per participant", () => {
  const initialStore = buildInitialChatStore();
  const conversation = initialStore.conversations[0];
  assert.ok(conversation);

  const candidatePeer = getConversationPeer(conversation!, "candidate-demo-20260401");
  assert.equal(candidatePeer.role, "company");

  const mutedStore = setConversationMuted(
    initialStore,
    conversation!.id,
    "candidate-demo-20260401",
    true,
  );
  assert.equal(
    mutedStore.conversations[0]?.participantState["candidate-demo-20260401"]?.muted,
    true,
  );

  const reportedStore = reportConversation(
    mutedStore,
    conversation!.id,
    "candidate-demo-20260401",
    "Lenguaje inapropiado",
  );
  assert.equal(reportedStore.reports.length, 1);
  assert.equal(
    reportedStore.conversations[0]?.participantState["candidate-demo-20260401"]?.reportReason,
    "Lenguaje inapropiado",
  );

  const unreadBefore = getConversationUnreadCount(
    reportedStore.conversations[0]!,
    "candidate-demo-20260401",
  );
  assert.equal(unreadBefore > 0, true);

  const readStore = markConversationRead(
    reportedStore,
    conversation!.id,
    "candidate-demo-20260401",
  );
  const unreadAfter = getConversationUnreadCount(
    readStore.conversations[0]!,
    "candidate-demo-20260401",
  );
  assert.equal(unreadAfter, 0);
});
