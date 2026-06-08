CREATE TABLE chat_conversations (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL UNIQUE REFERENCES "Application"("id") ON DELETE CASCADE,
    company_user_id TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    candidate_user_id TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    blocked_by_user_id TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending_review')),
    opened_at TIMESTAMPTZ,
    last_message_at TIMESTAMPTZ,
    review_required_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chat_conversations_company_candidate_distinct CHECK (company_user_id <> candidate_user_id)
);

CREATE INDEX chat_conversations_company_idx ON chat_conversations (company_user_id, updated_at DESC);
CREATE INDEX chat_conversations_candidate_idx ON chat_conversations (candidate_user_id, updated_at DESC);
CREATE INDEX chat_conversations_status_idx ON chat_conversations (status, updated_at DESC);

CREATE TABLE chat_conversation_participants (
    conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('candidate', 'company')),
    muted BOOLEAN NOT NULL DEFAULT FALSE,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    blocked_at TIMESTAMPTZ,
    last_read_at TIMESTAMPTZ,
    reported_at TIMESTAMPTZ,
    report_reason TEXT,
    cooldown_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX chat_conversation_participants_user_idx ON chat_conversation_participants (user_id, updated_at DESC);
CREATE INDEX chat_conversation_participants_blocked_idx ON chat_conversation_participants (blocked, cooldown_until);

CREATE TABLE chat_process_invites (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL REFERENCES "Application"("id") ON DELETE CASCADE,
    company_user_id TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    candidate_user_id TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    requested_stage TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'expired')),
    message_template_snapshot TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    reject_cooldown_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX chat_process_invites_pending_application_idx
    ON chat_process_invites (application_id)
    WHERE status = 'pending';

CREATE INDEX chat_process_invites_company_candidate_idx
    ON chat_process_invites (company_user_id, candidate_user_id, sent_at DESC);
CREATE INDEX chat_process_invites_candidate_status_idx
    ON chat_process_invites (candidate_user_id, status, sent_at DESC);
CREATE INDEX chat_process_invites_application_idx
    ON chat_process_invites (application_id, sent_at DESC);

CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_user_id TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('candidate', 'company')),
    message_kind TEXT NOT NULL DEFAULT 'user' CHECK (message_kind IN ('user', 'system', 'auto_intro')),
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    key_version INTEGER NOT NULL,
    profanity_hits INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chat_messages_ciphertext_nonempty CHECK (length(ciphertext) > 0),
    CONSTRAINT chat_messages_iv_nonempty CHECK (length(iv) > 0),
    CONSTRAINT chat_messages_auth_tag_nonempty CHECK (length(auth_tag) > 0),
    CONSTRAINT chat_messages_key_version_positive CHECK (key_version > 0)
);

CREATE INDEX chat_messages_conversation_created_idx
    ON chat_messages (conversation_id, created_at DESC);
CREATE INDEX chat_messages_sender_created_idx
    ON chat_messages (sender_user_id, created_at DESC);
CREATE INDEX chat_messages_profanity_idx
    ON chat_messages (sender_user_id, profanity_hits, created_at DESC);

CREATE TABLE chat_moderation_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    conversation_id TEXT REFERENCES chat_conversations(id) ON DELETE SET NULL,
    message_id TEXT REFERENCES chat_messages(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('cooldown', 'profanity_warning', 'manual_review', 'report')),
    severity INTEGER NOT NULL DEFAULT 1 CHECK (severity >= 1),
    visibility_penalty_pct INTEGER NOT NULL DEFAULT 0 CHECK (visibility_penalty_pct >= 0 AND visibility_penalty_pct <= 100),
    warning_count_month INTEGER NOT NULL DEFAULT 0 CHECK (warning_count_month >= 0),
    details_json TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX chat_moderation_events_user_created_idx
    ON chat_moderation_events (user_id, created_at DESC);
CREATE INDEX chat_moderation_events_type_idx
    ON chat_moderation_events (event_type, created_at DESC);
