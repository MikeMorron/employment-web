module.exports=[40915,e=>{"use strict";var t=e.i(66680),a=e.i(89685),i=e.i(7631),n=e.i(32827),r=e.i(83927);e.i(43178);var o=e.i(97700),s=e.i(30786);e.i(63640);var d=e.i(48318);e.i(2073);var c=e.i(65973);e.i(94561);var p=e.i(24139);e.i(9391);var l=e.i(49039),_=e.i(52194);e.i(87503);var u=e.i(3779);let I="chat.autoInviteAcceptedMessage",m=new Set(["application_submitted","application_received","in_review","preselected","in_evaluation","shortlisted","in_decision","offer_sent","offer_accepted","submitted","shortlist","interview","offer"]);function E(e){return e?e.toISOString():null}function A(e,t,a){return`chat:${e}:${t}:${a}`}function w(e){let t="candidate"===e.role?"candidate":"company";return{id:e.id,name:"company"===e.role?e.companyName:e.nombre,role:t,headline:"company"===e.role?e.companyName:e.rol,location:"company"===e.role?e.companyLocation??e.ubicacion:e.ubicacion}}function S(e){return{id:e.id,senderId:e.senderUserId,body:(0,n.decryptMessage)({ciphertext:e.ciphertext,iv:e.iv,authTag:e.authTag,keyVersion:e.keyVersion},A(e.conversationId,e.id,e.senderUserId)),sentAt:e.createdAt.toISOString(),kind:e.messageKind}}async function y(e){return 0===e.length?new Map:new Map((await o.prisma.user.findMany({where:{id:{in:e}},include:{profile:!0}})).filter(e=>e.profile).map(e=>[e.id,(0,c.rowToUser)(e,e.profile)]))}async function $(e){let t=(await (0,p.listCompanyDashboardConfig)(e))[I];return(0,l.sanitizePlainTextInput)("string"==typeof t?t:"",1500)}async function N(e){return o.prisma.$queryRaw(a.Prisma.sql`
    SELECT
      c.id,
      c.application_id AS "applicationId",
      c.company_user_id AS "companyUserId",
      c.candidate_user_id AS "candidateUserId",
      c.blocked_by_user_id AS "blockedByUserId",
      c.status,
      c.created_at AS "createdAt",
      c.opened_at AS "openedAt",
      c.last_message_at AS "lastMessageAt",
      a."jobId" AS "jobId",
      a.title AS "jobTitle",
      a."companyName" AS "companyName",
      a.status AS "applicationStatus"
    FROM chat_conversations c
    INNER JOIN "Application" a
      ON a.id = c.application_id
    WHERE c.company_user_id = ${e}
       OR c.candidate_user_id = ${e}
    ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
  `)}async function f(e){return 0===e.length?[]:o.prisma.$queryRaw(a.Prisma.sql`
    SELECT
      conversation_id AS "conversationId",
      user_id AS "userId",
      role,
      muted,
      blocked,
      blocked_at AS "blockedAt",
      last_read_at AS "lastReadAt",
      reported_at AS "reportedAt",
      report_reason AS "reportReason",
      cooldown_until AS "cooldownUntil"
    FROM chat_conversation_participants
    WHERE conversation_id IN (${a.Prisma.join(e)})
  `)}async function v(e){return 0===e.length?[]:o.prisma.$queryRaw(a.Prisma.sql`
    WITH ranked_messages AS (
      SELECT
        id,
        conversation_id,
        sender_user_id,
        sender_role,
        message_kind,
        ciphertext,
        iv,
        auth_tag,
        key_version,
        profanity_hits,
        created_at,
        ROW_NUMBER() OVER (
          PARTITION BY conversation_id
          ORDER BY created_at DESC
        ) AS rn
      FROM chat_messages
      WHERE conversation_id IN (${a.Prisma.join(e)})
    )
    SELECT
      id,
      conversation_id AS "conversationId",
      sender_user_id AS "senderUserId",
      sender_role AS "senderRole",
      message_kind AS "messageKind",
      ciphertext,
      iv,
      auth_tag AS "authTag",
      key_version AS "keyVersion",
      profanity_hits AS "profanityHits",
      created_at AS "createdAt"
    FROM ranked_messages
    WHERE rn <= ${20}
    ORDER BY created_at ASC
  `)}async function h(e,t){let i=Math.min(50,Math.max(1,t.limit??20));return e.$queryRaw(a.Prisma.sql`
    SELECT
      id,
      conversation_id AS "conversationId",
      sender_user_id AS "senderUserId",
      sender_role AS "senderRole",
      message_kind AS "messageKind",
      ciphertext,
      iv,
      auth_tag AS "authTag",
      key_version AS "keyVersion",
      profanity_hits AS "profanityHits",
      created_at AS "createdAt"
    FROM chat_messages
    WHERE conversation_id = ${t.conversationId}
      ${t.before?a.Prisma.sql`AND created_at < ${t.before}`:a.Prisma.sql``}
    ORDER BY created_at DESC
    LIMIT ${i+1}
  `)}async function R(e){return o.prisma.$queryRaw(a.Prisma.sql`
    SELECT
      i.id,
      i.application_id AS "applicationId",
      i.company_user_id AS "companyUserId",
      i.candidate_user_id AS "candidateUserId",
      i.requested_stage AS "requestedStage",
      i.status,
      i.message_template_snapshot AS "messageTemplateSnapshot",
      i.sent_at AS "sentAt",
      i.responded_at AS "respondedAt",
      i.reject_cooldown_until AS "rejectCooldownUntil",
      a."jobId" AS "jobId",
      a.title AS "jobTitle",
      a."companyName" AS "companyName",
      a."candidateName" AS "candidateName",
      a.status AS "applicationStatus"
    FROM chat_process_invites i
    INNER JOIN "Application" a
      ON a.id = i.application_id
    WHERE i.candidate_user_id = ${e}
      AND i.status = 'pending'
    ORDER BY i.sent_at DESC
  `)}async function T(e){return(await R(e)).map(e=>({id:e.id,applicationId:e.applicationId,candidateId:e.candidateUserId,companyUserId:e.companyUserId,companyName:e.companyName,candidateName:e.candidateName,jobId:e.jobId,jobTitle:e.jobTitle,applicationStatus:(0,_.normalizeCandidateApplicationStatus)(e.applicationStatus),applicantStage:(0,u.candidateToApplicantStage)((0,_.normalizeCandidateApplicationStatus)(e.applicationStatus)),sentAt:e.sentAt.toISOString(),messageTemplatePreview:e.messageTemplateSnapshot,canRespond:"pending"===e.status,canInviteAgainAt:E(e.rejectCooldownUntil)??null}))}async function g(e,t,a,i,n){await e.$executeRaw`
    INSERT INTO chat_conversation_participants (
      conversation_id, user_id, role, last_read_at, created_at, updated_at
    )
    VALUES
      (${t}, ${a}, 'company', ${n}, ${n}, ${n}),
      (${t}, ${i}, 'candidate', NULL, ${n}, ${n})
    ON CONFLICT (conversation_id, user_id)
    DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = EXCLUDED.updated_at
  `}async function U(e,t,i){return(await e.$queryRaw(a.Prisma.sql`
    SELECT
      c.id,
      c.application_id AS "applicationId",
      c.company_user_id AS "companyUserId",
      c.candidate_user_id AS "candidateUserId",
      c.blocked_by_user_id AS "blockedByUserId",
      c.status,
      c.created_at AS "createdAt",
      c.opened_at AS "openedAt",
      c.last_message_at AS "lastMessageAt",
      a."jobId" AS "jobId",
      a.title AS "jobTitle",
      a."companyName" AS "companyName",
      a.status AS "applicationStatus",
      p.muted AS "participantMuted",
      p.blocked AS "participantBlocked",
      p.blocked_at AS "participantBlockedAt",
      p.last_read_at AS "participantLastReadAt",
      p.reported_at AS "participantReportedAt",
      p.report_reason AS "participantReportReason",
      p.cooldown_until AS "participantCooldownUntil"
    FROM chat_conversations c
    INNER JOIN chat_conversation_participants p
      ON p.conversation_id = c.id
     AND p.user_id = ${i}
    INNER JOIN "Application" a
      ON a.id = c.application_id
    WHERE c.id = ${t}
    LIMIT 1
  `))[0]??null}async function O(e,t){return e.$queryRaw(a.Prisma.sql`
    SELECT
      sender_user_id AS "senderUserId",
      created_at AS "createdAt"
    FROM chat_messages
    WHERE conversation_id = ${t}
    ORDER BY created_at DESC
    LIMIT ${5}
  `)}async function C(e,a,i,n){let r=await O(e,a);if(r.length<5)return null;let o=r.every(e=>e.senderUserId===i),s=r.at(-1);if(!o||!s||n.getTime()-s.createdAt.getTime()>15e3)return null;let d=new Date(n.getTime()+15e3);return await e.$executeRaw`
    UPDATE chat_conversation_participants
    SET cooldown_until = ${d}, updated_at = ${n}
    WHERE conversation_id = ${a}
      AND user_id = ${i}
  `,await e.$executeRaw`
    INSERT INTO chat_moderation_events (
      id, user_id, conversation_id, event_type, severity, visibility_penalty_pct, warning_count_month, details_json, created_at
    )
    VALUES (
      ${(0,t.randomUUID)()},
      ${i},
      ${a},
      'cooldown',
      1,
      0,
      0,
      ${JSON.stringify({trigger:"rapid_fire",windowMs:15e3,cooldownMs:15e3})},
      ${n}
    )
  `,d}async function D(e,t,a,i,n,r){let o=await e.profile.findUnique({where:{userId:t},select:{profileQualityJson:!0,profileVisibility:!0}});if(!o)return;let s=o.profileQualityJson&&o.profileQualityJson.trim()?JSON.parse(o.profileQualityJson):{};s.moderationVisibilityPenaltyPct=a,s.chatWarningsMonth=i,s.chatSuspendedForReview=n,s.lastModerationWarningAt=r.toISOString(),await e.profile.update({where:{userId:t},data:{profileQualityJson:JSON.stringify(s),...n?{profileVisibility:"private"}:{}}})}async function b(e,i){if(i.profanityHits<=0)return null;let[n,r]=await Promise.all([e.$queryRaw(a.Prisma.sql`
      SELECT COALESCE(SUM(profanity_hits), 0)::int AS "totalHits"
      FROM chat_messages
      WHERE sender_user_id = ${i.userId}
        AND profanity_hits > 0
        AND created_at >= ${new Date(i.now.getTime()-6e5)}
    `),e.$queryRaw(a.Prisma.sql`
      SELECT COUNT(*)::int AS "warningCount"
      FROM chat_moderation_events
      WHERE user_id = ${i.userId}
        AND event_type = 'profanity_warning'
        AND created_at >= ${new Date(i.now.getTime()-2592e6)}
    `)]),o=(n[0]?.totalHits??0)+i.profanityHits;if(!(i.profanityHits>=2||o>=3))return null;let s=(r[0]?.warningCount??0)+1,d=s<=1?15:2===s?20:3===s?25:4===s?33:40,c=s>5;return await e.$executeRaw`
    INSERT INTO chat_moderation_events (
      id,
      user_id,
      conversation_id,
      message_id,
      event_type,
      severity,
      visibility_penalty_pct,
      warning_count_month,
      details_json,
      created_at
    )
    VALUES (
      ${(0,t.randomUUID)()},
      ${i.userId},
      ${i.conversationId},
      ${i.messageId},
      'profanity_warning',
      ${Math.min(5,s)},
      ${d},
      ${s},
      ${JSON.stringify({profanityHits:i.profanityHits,combinedHits:o})},
      ${i.now}
    )
  `,c&&await e.$executeRaw`
      INSERT INTO chat_moderation_events (
        id,
        user_id,
        conversation_id,
        message_id,
        event_type,
        severity,
        visibility_penalty_pct,
        warning_count_month,
        details_json,
        created_at
      )
      VALUES (
        ${(0,t.randomUUID)()},
        ${i.userId},
        ${i.conversationId},
        ${i.messageId},
        'manual_review',
        5,
        100,
        ${s},
        ${JSON.stringify({reason:"monthly_warning_threshold_exceeded"})},
        ${i.now}
      )
    `,await D(e,i.userId,c?100:d,s,c,i.now),{message:c?"Tu cuenta quedó suspendida para revisión manual por lenguaje abusivo recurrente.":"Advertencia: el sistema detectó lenguaje abusivo y redujo tu visibilidad en el match.",penaltyPct:c?100:d,warningCountMonth:s,suspendedForReview:c}}async function M(e){let t=await o.prisma.profile.findUnique({where:{userId:e},select:{profileQualityJson:!0}}),a=t?.profileQualityJson&&t.profileQualityJson.trim()?JSON.parse(t.profileQualityJson):{};return{visibilityPenaltyPct:"number"==typeof a.moderationVisibilityPenaltyPct?a.moderationVisibilityPenaltyPct:0,suspendedForReview:!0===a.chatSuspendedForReview,warningCountMonth:"number"==typeof a.chatWarningsMonth?a.chatWarningsMonth:0}}async function P(e){let t=await o.prisma.job.findMany({where:{ownerCompanyId:e},select:{id:!0,title:!0}}),i=t.map(e=>e.id);if(0===i.length)return[];let n=await o.prisma.application.findMany({where:{jobId:{in:i},status:{in:Array.from(m)}},orderBy:{lastUpdatedAt:"desc"}});if(0===n.length)return[];let r=Array.from(new Set(n.map(e=>e.candidateId))),s=new Map((await o.prisma.user.findMany({where:{id:{in:r}},include:{profile:!0}})).filter(e=>e.profile).map(e=>[e.id,(0,c.rowToUser)(e,e.profile)])),d=n.map(e=>e.id),[p,l]=await Promise.all([o.prisma.$queryRaw(a.Prisma.sql`
      SELECT DISTINCT ON (application_id)
        application_id AS "applicationId",
        id AS "inviteId",
        status,
        reject_cooldown_until AS "rejectCooldownUntil"
      FROM chat_process_invites
      WHERE application_id IN (${a.Prisma.join(d)})
      ORDER BY application_id, sent_at DESC
    `),o.prisma.$queryRaw(a.Prisma.sql`
      SELECT
        application_id AS "applicationId",
        id AS "conversationId"
      FROM chat_conversations
      WHERE application_id IN (${a.Prisma.join(d)})
        AND status = 'active'
    `)]),I=new Map(p.map(e=>[e.applicationId,e])),A=new Map(l.map(e=>[e.applicationId,e.conversationId])),w=new Map(t.map(e=>[e.id,e.title]));return n.flatMap(e=>{let t=s.get(e.candidateId);if(!t)return[];let a=I.get(e.id),i=A.get(e.id)??null,n=(0,_.normalizeCandidateApplicationStatus)(e.status),r=(0,u.candidateToApplicantStage)(n),o="ready";return i?o="accepted":a?.status==="pending"?o="pending":a?.status==="rejected"&&a.rejectCooldownUntil&&a.rejectCooldownUntil.getTime()>Date.now()&&(o="cooldown"),[{applicationId:e.id,candidateId:e.candidateId,nombre:t.nombre,rol:t.rol,ubicacion:t.ubicacion,jobId:e.jobId,jobTitle:w.get(e.jobId)??e.title,applicationStatus:n,applicantStage:r,inviteStatus:o,latestInviteId:a?.inviteId??null,canInviteAt:E(a?.rejectCooldownUntil)??null,activeConversationId:i}]})}async function L(e){let t=await N(e.id),a=t.map(e=>e.id),i=await f(a),n=await v(a),r=await y(Array.from(new Set(t.flatMap(e=>[e.companyUserId,e.candidateUserId])))),o=new Map;for(let e of i){let t=o.get(e.conversationId)??{};t[e.userId]={muted:e?.muted??!1,blocked:e?.blocked??!1,blockedAt:E(e?.blockedAt)??null,lastReadAt:E(e?.lastReadAt)??null,reportedAt:E(e?.reportedAt)??null,reportReason:e?.reportReason??null,cooldownUntil:E(e?.cooldownUntil)??null},o.set(e.conversationId,t)}let s=new Map;for(let e of n){let t=s.get(e.conversationId)??[];t.push(S(e)),s.set(e.conversationId,t)}return{conversations:t.flatMap(e=>{let t=r.get(e.companyUserId),a=r.get(e.candidateUserId);return t&&a?[{id:e.id,applicationId:e.applicationId,createdAt:e.createdAt.toISOString(),createdById:e.companyUserId,status:e.status,jobId:e.jobId,jobTitle:e.jobTitle,companyName:e.companyName,participants:[w(t),w(a)],participantState:o.get(e.id)??{},messages:s.get(e.id)??[]}]:[]}),pendingInvites:"candidate"===e.role?await T(e.id):[]}}async function j(e){let i=await $(e.companyUserId),n=e.applicationId?await o.prisma.application.findUnique({where:{id:e.applicationId}}):null;if(!n&&e.candidateUserId){let t=await o.prisma.job.findMany({where:{ownerCompanyId:e.companyUserId,status:"published"},orderBy:{updatedAt:"desc"},select:{id:!0,companyName:!0,title:!0,location:!0,modality:!0,salary:!0}});if(0===t.length)throw Error("NO_PUBLISHED_JOB_AVAILABLE");if(!(n=await o.prisma.application.findFirst({where:{candidateId:e.candidateUserId,jobId:{in:t.map(e=>e.id)},status:{in:Array.from(m)}},orderBy:{lastUpdatedAt:"desc"}}))){let a=await o.prisma.user.findUnique({where:{id:e.candidateUserId},include:{profile:!0}}),i=a?.profile?(0,c.rowToUser)(a,a.profile):null;if(!i||"candidate"!==i.role)throw Error("CANDIDATE_NOT_FOUND");if(!(0,s.hasCandidateActiveBoost)(i))throw Error("APPLICATION_REQUIRED");let r=t[0],p=new Date,l=(0,d.createApplicationId)(i.id,r.id);await o.prisma.application.create({data:{id:l,candidateId:i.id,candidateName:i.nombre,jobId:r.id,title:r.title,companyName:r.companyName,location:r.location,modality:r.modality,salary:r.salary??null,status:"application_received",appliedAt:p,lastUpdatedAt:p,fitLabel:"80%"}}),n=await o.prisma.application.findUnique({where:{id:l}})}}if(!n)throw Error("APPLICATION_NOT_FOUND");if(!m.has((0,_.normalizeCandidateApplicationStatus)(n.status)))throw Error("APPLICATION_NOT_ACTIVE");let p=await o.prisma.job.findUnique({where:{id:n.jobId},select:{ownerCompanyId:!0}});if(!p||p.ownerCompanyId!==e.companyUserId)throw Error("APPLICATION_NOT_FOUND");if(!i)throw Error("AUTO_MESSAGE_REQUIRED");let[l,I]=await Promise.all([o.prisma.$queryRaw(a.Prisma.sql`
      SELECT id
      FROM chat_conversations
      WHERE application_id = ${n.id}
        AND status = 'active'
      LIMIT 1
    `),o.prisma.$queryRaw(a.Prisma.sql`
      SELECT
        id,
        status,
        reject_cooldown_until AS "rejectCooldownUntil"
      FROM chat_process_invites
      WHERE application_id = ${n.id}
      ORDER BY sent_at DESC
      LIMIT 1
    `)]);if(l[0]?.id)throw Error("CONVERSATION_ALREADY_ACTIVE");if(I[0]?.status==="pending")throw Error("INVITE_ALREADY_PENDING");if(I[0]?.status==="rejected"&&I[0].rejectCooldownUntil&&I[0].rejectCooldownUntil.getTime()>Date.now())throw Error("INVITE_COOLDOWN_ACTIVE");let E=new Date,A=(0,u.candidateToApplicantStage)((0,_.normalizeCandidateApplicationStatus)(n.status)),w=(0,t.randomUUID)(),S="";try{await o.prisma.$transaction(async t=>{await t.$executeRaw`
        INSERT INTO chat_process_invites (
          id,
          application_id,
          company_user_id,
          candidate_user_id,
          requested_stage,
          status,
          message_template_snapshot,
          sent_at,
          created_at,
          updated_at
        )
        VALUES (
          ${w},
          ${n.id},
          ${e.companyUserId},
          ${n.candidateId},
          ${A},
          'pending',
          ${i},
          ${E},
          ${E},
          ${E}
        )
      `,S=await (0,r.enqueueChatInviteNotificationOutbox)(t,{inviteId:w,applicationId:n.id,candidateUserId:n.candidateId,companyName:n.companyName,jobTitle:n.title},E)})}catch(e){if(e instanceof Error&&(e.message.includes("chat_process_invites_pending_application_idx")||e.message.toLowerCase().includes("duplicate key")))throw Error("INVITE_ALREADY_PENDING");throw Error("INVITE_NOTIFICATION_FAILED")}let y=await (0,r.flushChatInviteNotificationOutbox)(S);if(!y)throw await o.prisma.$transaction(async e=>{await e.$executeRaw`
        UPDATE chat_process_invites
        SET status = 'cancelled',
            updated_at = ${new Date}
        WHERE id = ${w}
          AND status = 'pending'
      `}),Error("INVITE_NOTIFICATION_FAILED");return{inviteId:w,candidateId:n.candidateId,sentAt:E.toISOString(),notificationDelivered:y}}async function k(e){let i=(await o.prisma.$queryRaw(a.Prisma.sql`
    SELECT
      i.id,
      i.application_id AS "applicationId",
      i.company_user_id AS "companyUserId",
      i.candidate_user_id AS "candidateUserId",
      i.requested_stage AS "requestedStage",
      i.status,
      i.message_template_snapshot AS "messageTemplateSnapshot",
      i.sent_at AS "sentAt",
      i.responded_at AS "respondedAt",
      i.reject_cooldown_until AS "rejectCooldownUntil",
      a."jobId" AS "jobId",
      a.title AS "jobTitle",
      a."companyName" AS "companyName",
      a."candidateName" AS "candidateName",
      a.status AS "applicationStatus"
    FROM chat_process_invites i
    INNER JOIN "Application" a
      ON a.id = i.application_id
    WHERE i.id = ${e.inviteId}
      AND i.candidate_user_id = ${e.candidateUserId}
    LIMIT 1
  `))[0];if(!i)throw Error("INVITE_NOT_FOUND");if("accepted"===i.status){let t=await o.prisma.$queryRaw(a.Prisma.sql`
      SELECT id
      FROM chat_conversations
      WHERE application_id = ${i.applicationId}
        AND candidate_user_id = ${e.candidateUserId}
        AND status = 'active'
      LIMIT 1
    `);if(t[0]?.id)return{accepted:!0,conversationId:t[0].id}}if("pending"!==i.status)throw Error("INVITE_NOT_FOUND");let r=new Date;if("reject"===e.action){let t=new Date(r.getTime()+432e5);return await o.prisma.$executeRaw`
      UPDATE chat_process_invites
      SET status = 'rejected',
          responded_at = ${r},
          reject_cooldown_until = ${t},
          updated_at = ${r}
      WHERE id = ${e.inviteId}
    `,{accepted:!1,rejectCooldownUntil:t.toISOString()}}return o.prisma.$transaction(async o=>{let s=await o.$queryRaw(a.Prisma.sql`
      SELECT id
      FROM chat_conversations
      WHERE application_id = ${i.applicationId}
      LIMIT 1
    `),d=s[0]?.id??(0,t.randomUUID)();s[0]?.id?await o.$executeRaw`
        UPDATE chat_conversations
        SET status = 'active',
            opened_at = COALESCE(opened_at, ${r}),
            updated_at = ${r}
        WHERE id = ${d}
      `:await o.$executeRaw`
        INSERT INTO chat_conversations (
          id,
          application_id,
          company_user_id,
          candidate_user_id,
          status,
          opened_at,
          created_at,
          updated_at
        )
        VALUES (
          ${d},
          ${i.applicationId},
          ${i.companyUserId},
          ${i.candidateUserId},
          'active',
          ${r},
          ${r},
          ${r}
        )
      `,await g(o,d,i.companyUserId,i.candidateUserId,r);let c=(0,t.randomUUID)(),p=(0,n.encryptMessage)(i.messageTemplateSnapshot,A(d,c,i.companyUserId));return await o.$executeRaw`
      INSERT INTO chat_messages (
        id,
        conversation_id,
        sender_user_id,
        sender_role,
        message_kind,
        ciphertext,
        iv,
        auth_tag,
        key_version,
        profanity_hits,
        created_at
      )
      VALUES (
        ${c},
        ${d},
        ${i.companyUserId},
        'company',
        'auto_intro',
        ${p.ciphertext},
        ${p.iv},
        ${p.authTag},
        ${p.keyVersion},
        0,
        ${r}
      )
    `,await o.$executeRaw`
      UPDATE chat_conversations
      SET last_message_at = ${r},
          updated_at = ${r}
      WHERE id = ${d}
    `,await o.$executeRaw`
      UPDATE chat_process_invites
      SET status = 'accepted',
          responded_at = ${r},
          updated_at = ${r}
      WHERE id = ${e.inviteId}
    `,await o.$executeRaw`
      UPDATE "Application"
      SET status = 'in_decision',
          "lastUpdatedAt" = ${r}
      WHERE id = ${i.applicationId}
        AND status NOT IN (
          'offer_accepted',
          'offer_rejected',
          'rejected',
          'not_selected',
          'process_closed',
          'vacancy_cancelled',
          'withdrawn'
        )
    `,{accepted:!0,conversationId:d}})}async function q(e){let a=(0,l.sanitizePlainTextInput)(e.body,1500);if(!a)throw Error("EMPTY_MESSAGE");if((await M(e.user.id)).suspendedForReview)throw Error("USER_SUSPENDED_FOR_REVIEW");return o.prisma.$transaction(async r=>{let o=await U(r,e.conversationId,e.user.id);if(!o)throw Error("CONVERSATION_NOT_FOUND");let s=(0,_.normalizeCandidateApplicationStatus)(o.applicationStatus);if("active"!==o.status||!m.has(s))throw Error("CONVERSATION_CLOSED");if(o.blockedByUserId)throw Error(o.blockedByUserId===e.user.id?"CONVERSATION_BLOCKED_BY_YOU":"CONVERSATION_BLOCKED_BY_PEER");if(o.participantCooldownUntil&&o.participantCooldownUntil.getTime()>Date.now()||await C(r,e.conversationId,e.user.id,new Date))throw Error("COOLDOWN_ACTIVE");let d=new Date,c=await (0,i.censorProfanity)(a),p=(0,t.randomUUID)(),l=(0,n.encryptMessage)(c.censored,A(e.conversationId,p,e.user.id));await r.$executeRaw`
      INSERT INTO chat_messages (
        id,
        conversation_id,
        sender_user_id,
        sender_role,
        message_kind,
        ciphertext,
        iv,
        auth_tag,
        key_version,
        profanity_hits,
        created_at
      )
      VALUES (
        ${p},
        ${e.conversationId},
        ${e.user.id},
        ${e.user.role},
        'user',
        ${l.ciphertext},
        ${l.iv},
        ${l.authTag},
        ${l.keyVersion},
        ${c.profanityHits},
        ${d}
      )
    `,await r.$executeRaw`
      UPDATE chat_conversations
      SET last_message_at = ${d},
          updated_at = ${d}
      WHERE id = ${e.conversationId}
    `,await r.$executeRaw`
      UPDATE chat_conversation_participants
      SET last_read_at = CASE
            WHEN user_id = ${e.user.id} THEN ${d}
            ELSE last_read_at
          END,
          updated_at = ${d}
      WHERE conversation_id = ${e.conversationId}
    `;let u=await b(r,{userId:e.user.id,conversationId:e.conversationId,messageId:p,profanityHits:c.profanityHits,now:d});return{message:{id:p,senderId:e.user.id,body:c.censored,sentAt:d.toISOString(),kind:"user"},warning:u}})}async function H(e){let t=await U(o.prisma,e.conversationId,e.userId);if(!t)throw Error("CONVERSATION_NOT_FOUND");let a=new Date,i="boolean"==typeof e.muted?e.muted:t.participantMuted,n="boolean"==typeof e.blocked?e.blocked:t.participantBlocked,r="boolean"==typeof e.blocked?e.blocked?a:null:t.participantBlockedAt,s=e.markRead?t.lastMessageAt??a:t.participantLastReadAt;await o.prisma.$executeRaw`
    UPDATE chat_conversation_participants
    SET muted = ${i},
        blocked = ${n},
        blocked_at = ${r},
        last_read_at = ${s},
        updated_at = ${a}
    WHERE conversation_id = ${e.conversationId}
      AND user_id = ${e.userId}
  `,"boolean"==typeof e.blocked&&await o.prisma.$executeRaw`
      UPDATE chat_conversations
      SET blocked_by_user_id = ${e.blocked?e.userId:null},
          updated_at = ${a}
      WHERE id = ${e.conversationId}
    `}async function V(e){let a=await U(o.prisma,e.conversationId,e.userId);if(!a)throw Error("CONVERSATION_NOT_FOUND");let i=(0,l.sanitizePlainTextInput)(e.reason,1e3);if(!i)throw Error("REPORT_REASON_REQUIRED");let n=new Date,r=a.companyUserId===e.userId?a.candidateUserId:a.companyUserId;await o.prisma.$transaction(async a=>{await a.$executeRaw`
      UPDATE chat_conversation_participants
      SET reported_at = ${n},
          report_reason = ${i},
          updated_at = ${n}
      WHERE conversation_id = ${e.conversationId}
        AND user_id = ${e.userId}
    `,await a.$executeRaw`
      INSERT INTO chat_moderation_events (
        id,
        user_id,
        conversation_id,
        event_type,
        severity,
        visibility_penalty_pct,
        warning_count_month,
        details_json,
        created_at
      )
      VALUES (
        ${(0,t.randomUUID)()},
        ${r},
        ${e.conversationId},
        'report',
        2,
        0,
        0,
        ${JSON.stringify({reporterUserId:e.userId,reason:i})},
        ${n}
      )
    `})}async function x(e){let t="string"==typeof e.before&&e.before.trim()?new Date(e.before):null;if(t&&Number.isNaN(t.getTime()))throw Error("INVALID_CURSOR");if(!await U(o.prisma,e.conversationId,e.userId))throw Error("CONVERSATION_NOT_FOUND");let a=await h(o.prisma,{conversationId:e.conversationId,before:t??void 0,limit:e.limit}),i=Math.min(50,Math.max(1,e.limit??20)),n=a.length>i;return{messages:a.slice(0,i).reverse().map(S),hasMore:n}}e.s(["CHAT_AUTO_MESSAGE_CONFIG_KEY",0,I,"createCompanyChatInvite",0,j,"listChatSurfaceForUser",0,L,"listCompanyChatCandidateDirectory",0,P,"listConversationMessagesPage",0,x,"reportChatConversation",0,V,"respondToChatInvite",0,k,"sendChatMessage",0,q,"updateConversationParticipantState",0,H])}];

//# sourceMappingURL=backend_lib-server_chat-service_ts_0sb~_so._.js.map