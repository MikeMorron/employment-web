module.exports=[2925,67193,41152,73831,e=>{"use strict";e.i(43178);var t=e.i(97700),a=e.i(11259),i=e.i(66680);async function r(){await t.prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS admin_user_trash (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      original_email TEXT NOT NULL,
      archived_email TEXT NOT NULL UNIQUE,
      display_name TEXT,
      role TEXT NOT NULL,
      justification TEXT NOT NULL,
      archived_user_json JSONB NOT NULL,
      deleted_by_user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'trashed',
      restore_until TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      restored_at TIMESTAMPTZ,
      purged_at TIMESTAMPTZ
    )
  `,await t.prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS admin_user_trash_status_restore_idx
      ON admin_user_trash (status, restore_until)
  `,await t.prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS admin_user_trash_user_status_idx
      ON admin_user_trash (user_id, status)
  `}async function n(){return await r(),(await t.prisma.$queryRaw`
    SELECT user_id FROM admin_user_trash WHERE status = 'trashed'
  `).map(e=>e.user_id)}async function s(){return await r(),(await t.prisma.$queryRaw`
    SELECT id, user_id, original_email, display_name, role, justification, restore_until, created_at
    FROM admin_user_trash
    WHERE status = 'trashed'
    ORDER BY created_at DESC
  `).map(e=>({id:e.id,userId:e.user_id,originalEmail:e.original_email,displayName:e.display_name??e.user_id,role:e.role,justification:e.justification,restoreUntil:e.restore_until.toISOString(),createdAt:e.created_at.toISOString()}))}async function o({userId:e,adminUserId:a,justification:n}){if(await r(),(await t.prisma.$queryRaw`
    SELECT id FROM admin_user_trash WHERE user_id = ${e} AND status = 'trashed' LIMIT 1
  `).length>0)return{ok:!1,message:"El usuario ya está en la papelera"};let s=await t.prisma.user.findUnique({where:{id:e},include:{profile:!0,credential:!0,sessions:{select:{token:!0,expiresAt:!0,revokedAt:!0,createdAt:!0}},jobs:{select:{id:!0,title:!0,status:!0,createdAt:!0,updatedAt:!0}},applications:{select:{id:!0,jobId:!0,status:!0,appliedAt:!0,lastUpdatedAt:!0}},notifications:{select:{id:!0,type:!0,title:!0,createdAt:!0}}}});if(!s?.profile)return{ok:!1,message:"Usuario no encontrado"};let d=(0,i.randomUUID)(),l=`trashed+${d}@archived.local`,c=new Date(Date.now()+1296e6),u={user:{...s,credential:s.credential?{userId:s.credential.userId,email:s.credential.email,hasPassword:!0}:null},retentionDays:15};return await t.prisma.$transaction(async t=>{await t.$executeRaw`
      INSERT INTO admin_user_trash (
        id,
        user_id,
        original_email,
        archived_email,
        display_name,
        role,
        justification,
        archived_user_json,
        deleted_by_user_id,
        restore_until
      )
      VALUES (
        ${d},
        ${s.id},
        ${s.email},
        ${l},
        ${s.displayName},
        ${s.role},
        ${n},
        ${JSON.stringify(u)}::jsonb,
        ${a},
        ${c}
      )
    `,await t.user.update({where:{id:e},data:{email:l,displayName:`[Papelera] ${s.displayName}`}}),await t.credential.updateMany({where:{userId:e},data:{email:l}}),await t.session.updateMany({where:{userId:e,revokedAt:null},data:{revokedAt:new Date}})}),{ok:!0}}async function d(e){await r();let a=(await t.prisma.$queryRaw`
    SELECT user_id, original_email, display_name
    FROM admin_user_trash
    WHERE id = ${e} AND status = 'trashed'
    LIMIT 1
  `)[0];if(!a)return{ok:!1,message:"Registro de papelera no encontrado"};let i=await t.prisma.user.findUnique({where:{email:a.original_email},select:{id:!0}});return i&&i.id!==a.user_id?{ok:!1,message:"No se puede recuperar: el correo ya pertenece a otro usuario"}:(await t.prisma.$transaction(async t=>{await t.user.update({where:{id:a.user_id},data:{email:a.original_email,displayName:a.display_name??void 0}}),await t.credential.updateMany({where:{userId:a.user_id},data:{email:a.original_email}}),await t.$executeRaw`
      UPDATE admin_user_trash
      SET status = 'restored', restored_at = now(), updated_at = now()
      WHERE id = ${e}
    `}),{ok:!0})}async function l(e){await r();let a=(await t.prisma.$queryRaw`
    SELECT user_id FROM admin_user_trash WHERE id = ${e} AND status = 'trashed' LIMIT 1
  `)[0];return a?(await t.prisma.$transaction(async t=>{await t.user.delete({where:{id:a.user_id}}),await t.$executeRaw`
      UPDATE admin_user_trash
      SET status = 'purged', purged_at = now(), updated_at = now()
      WHERE id = ${e}
    `}),{ok:!0}):{ok:!1,message:"Registro de papelera no encontrado"}}async function c(){for(let e of(await r(),await t.prisma.$queryRaw`
    SELECT id FROM admin_user_trash
    WHERE status = 'trashed' AND restore_until <= now()
  `))await l(e.id)}e.s(["getAdminTrashedUserIds",0,n,"isTrashJustificationValid",0,function(e){return e.trim().length>=10},"listAdminTrashedUsers",0,s,"moveAdminUserToTrash",0,o,"purgeAdminTrashedUser",0,l,"purgeExpiredAdminUserTrash",0,c,"recoverAdminTrashedUser",0,d],67193),e.s([],41152),e.i(6387);var u=e.i(14195),p=e.i(31327);e.i(42620);var m=e.i(94028);function f(e,t){return e?(0,a.buildAvatarFileHref)(e):t??void 0}async function h(){await c();let e=await n(),a=await t.prisma.user.findMany({where:{role:"candidate",id:{notIn:e}},include:{profile:!0,jobs:{where:{status:"published"},select:{id:!0}}},orderBy:{createdAt:"desc"}}),i=[];for(let e of a)e.profile&&i.push({id:(0,m.encodeCompanyCandidateId)(e.id),role:"candidate",displayName:e.displayName,nombre:e.profile.nombre,headline:e.profile.rol,location:e.profile.ubicacion??void 0,avatar:f(e.profile.avatarAssetPublicId,e.profile.avatar),plan:e.plan,availabilityStatus:JSON.parse(e.profile.professionalProfileJson??"{}")?.availabilityStatus??void 0,profileVisibility:"public"===e.profile.profileVisibility||"recruiters_only"===e.profile.profileVisibility||"private"===e.profile.profileVisibility?e.profile.profileVisibility:void 0,skills:JSON.parse(e.profile.skillsJson??"[]").slice(0,6),previewProfileId:"private"===e.profile.profileVisibility?void 0:(0,m.encodeCompanyCandidateId)(e.id),createdAt:e.createdAt.toISOString()});return i}async function y(){await c();let e=await n(),[a,i]=await Promise.all([t.prisma.user.findMany({where:{id:{notIn:e}},include:{profile:!0,jobs:{where:{status:"published"},select:{id:!0}}},orderBy:{createdAt:"desc"}}),t.prisma.credential.findMany({select:{userId:!0}})]),r=new Set(i.map(e=>e.userId));return a.flatMap(e=>{var t;if(!e.profile)return[];let a="candidate"===e.role?JSON.parse(e.profile.professionalProfileJson??"{}")?.availabilityStatus??void 0:void 0,i="candidate"===e.role?JSON.parse(e.profile.skillsJson??"[]").slice(0,6):[],n="candidate"===e.role?(0,u.parseCandidatePlanState)(e.profile.candidatePlanStateJson,new Date).applicationQuotaLimit:"company"===e.role?(0,p.parseCompanyPlanState)(e.profile.companyPlanStateJson,new Date).collaboratorLimit:0,s="candidate"===e.role?(0,u.parseCandidatePlanState)(e.profile.candidatePlanStateJson,new Date).currentPlanId:"company"===e.role?(0,p.parseCompanyPlanState)(e.profile.companyPlanStateJson,new Date).currentPlanId:void 0;return[{id:e.id,email:e.email,emailMasked:function(e){let[t,a="mail.com"]=e.split("@");if(!t)return e;let i=t.slice(0,Math.min(6,t.length)),[r,...n]=a.split("."),s=n.length>0?`.${n.join(".")}`:".com",o=r?`*${r.slice(Math.max(0,r.length-4))}`:"*mail";return`${i}***@${o}${s}`}(e.email),phone:e.profile.telefono??void 0,phoneMasked:function(e){let t=String(e??"").replace(/\D+/g,"");if(!t)return;let a=t.slice(0,Math.min(6,t.length));return`${a}${"*".repeat(Math.max(4,t.length-a.length))}`}(e.profile.telefono),passwordMasked:r.has(e.id)?"******":"Sin contraseña",role:e.role,displayName:e.displayName,nombre:"company"===e.role?e.profile.companyName??e.profile.nombre:e.profile.nombre,headline:e.profile.rol,location:e.profile.companyLocation??e.profile.ubicacion??void 0,avatar:f(e.profile.avatarAssetPublicId,e.profile.avatar),plan:e.plan,companyName:e.profile.companyName??void 0,companyDescription:e.profile.companyDescription??void 0,verificationStatus:"verified"===(t=e.profile.verificationStatus)||"unverified"===t||"pending"===t?t:void 0,availabilityStatus:a,profileVisibility:"public"===e.profile.profileVisibility||"recruiters_only"===e.profile.profileVisibility||"private"===e.profile.profileVisibility?e.profile.profileVisibility:void 0,skills:i,credits:n,currentPlanId:s,publishedJobs:e.jobs.length,activeJobs:e.profile.activeJobs??e.jobs.length,createdAt:e.createdAt.toISOString()}]})}async function v(){let[e,a]=await Promise.all([t.prisma.job.findMany({orderBy:{createdAt:"desc"}}),t.prisma.application.findMany({select:{id:!0,jobId:!0}})]),i=a.reduce((e,t)=>(e.set(t.jobId,(e.get(t.jobId)??0)+1),e),new Map);return e.map(e=>({id:e.id,companyId:e.ownerCompanyId,companyName:e.companyName,title:e.title,location:e.location,modality:e.modality,status:e.status,featured:e.featured,applicantsCount:i.get(e.id)??0,createdAt:e.createdAt.toISOString(),updatedAt:e.updatedAt.toISOString()}))}async function g(){let[e,a,i,r,n,s]=await Promise.all([t.prisma.user.findMany({select:{role:!0}}),t.prisma.job.findMany({select:{status:!0}}),t.prisma.application.count(),t.prisma.comment.count(),y(),v()]);return{ok:!0,metrics:{usersTotal:e.length,candidatesTotal:e.filter(e=>"candidate"===e.role).length,companiesTotal:e.filter(e=>"company"===e.role).length,adminsTotal:e.filter(e=>"admin"===e.role).length,jobsTotal:a.length,publishedJobsTotal:a.filter(e=>"published"===e.status).length,applicationsTotal:i,commentsTotal:r},recentUsers:n.slice(0,6),recentJobs:s.slice(0,6)}}e.s(["getAdminOverview",0,g,"listJobsForAdmin",0,v,"listRegisteredUsersForCompany",0,h,"listUsersForAdmin",0,y],73831),e.s([],2925)},96664,19575,49051,e=>{"use strict";var t=e.i(89685);e.i(43178);var a=e.i(97700);async function i(){let e=new Date;e.setUTCDate(e.getUTCDate()-6),e.setUTCHours(0,0,0,0);let t=await a.prisma.event.findMany({where:{type:"api_request",happenedAt:{gte:e}},orderBy:{happenedAt:"asc"},select:{userId:!0,sessionId:!0,source:!0,pathname:!0,referrer:!0,deviceType:!0,happenedAt:!0}}),i=Array.from({length:7},(e,t)=>{let a=new Date;return a.setUTCHours(0,0,0,0),a.setUTCDate(a.getUTCDate()-(6-t)),{dateKey:a.toISOString().slice(0,10),label:a.toLocaleDateString("en-US",{weekday:"short",timeZone:"UTC"}),total:0,uniqueKeys:new Set}}),r=new Map(i.map(e=>[e.dateKey,e])),n=new Map,s=new Map;for(let e of t){let t=e.happenedAt.toISOString().slice(0,10),a=r.get(t);if(!a)continue;a.total+=1,a.uniqueKeys.add(e.sessionId??e.userId??`${e.deviceType??"unknown"}:${e.pathname??"unknown"}:${e.source??"unknown"}`);let i=e.deviceType??"unknown";n.set(i,(n.get(i)??0)+1);let o=function(e,t){if(e)try{return new URL(e).hostname.replace(/^www\./,"")||"Direct"}catch{return e}return t||"Direct"}(e.referrer,e.source);s.set(o,(s.get(o)??0)+1)}return{trafficSeries:i.map(e=>({label:e.label,total:e.total,unique:e.uniqueKeys.size})),deviceBreakdown:[...n.entries()].map(([e,t])=>({label:e,value:t})).sort((e,t)=>t.value-e.value),referrerBreakdown:[...s.entries()].map(([e,t])=>({label:e,value:t})).sort((e,t)=>t.value-e.value).slice(0,6)}}var r=e.i(52328);async function n(){let[e,i,n,s]=await Promise.all([a.prisma.retentionTask.findMany({where:{OR:[{status:"failed"},{status:"retry"}]},orderBy:{createdAt:"desc"},take:10}),a.prisma.$queryRaw(t.Prisma.sql`
      SELECT
        id,
        event_type AS "eventType",
        created_at AS "createdAt",
        details_json AS "detailsJson",
        conversation_id AS "conversationId"
      FROM chat_moderation_events
      WHERE event_type = 'report' OR event_type = 'manual_review'
      ORDER BY created_at DESC
      LIMIT 10
    `),(0,r.readRecentAdminErrorEntries)(20),a.prisma.event.findMany({where:{type:"api_request"},orderBy:{happenedAt:"desc"},take:20,select:{id:!0,metadataJson:!0,happenedAt:!0,pathname:!0}})]);return[...e.map(e=>({id:e.id,source:"retention",title:`Retention task ${e.kind}`,detail:e.lastError??"Tarea en retry o fallo sin detalle adicional.",statusCode:"failed"===e.status?503:409,severity:"failed"===e.status?"high":"medium",createdAt:e.createdAt.toISOString(),href:"/admin/errors"})),...i.map(e=>({id:e.id,source:"chat",title:"report"===e.eventType?"Chat reportado":"Chat en revisión manual",detail:e.detailsJson??"Evento de moderación sin detalle adicional.",statusCode:"report"===e.eventType?409:503,severity:"high",createdAt:e.createdAt.toISOString(),href:"/admin/chats"})),...s.flatMap(e=>{let t=function(e){if(!e)return null;try{let t=JSON.parse(e);return t&&"object"==typeof t?t:null}catch{return null}}(e.metadataJson),a="number"==typeof t?.statusCode?t.statusCode:null;return null==a||a<500?[]:[{id:e.id,source:"system",title:"API failure",detail:"string"==typeof t?.requestUrl?t.requestUrl:e.pathname??"Request without path",statusCode:a,severity:"high",createdAt:e.happenedAt.toISOString(),href:"/admin/tasks"}]}),...n].sort((e,t)=>new Date(t.createdAt).getTime()-new Date(e.createdAt).getTime()).slice(0,20)}e.i(2925);var s=e.i(73831);async function o(i){let[r,n]=await Promise.all([a.prisma.$queryRaw(t.Prisma.sql`
      SELECT
        c.id,
        c.status,
        c.application_id AS "applicationId",
        COALESCE(cp."companyName", cu."displayName") AS "companyName",
        COALESCE(pp.nombre, pu."displayName") AS "candidateName"
      FROM chat_conversations c
      INNER JOIN "User" cu ON cu.id = c.company_user_id
      INNER JOIN "Profile" cp ON cp."userId" = cu.id
      INNER JOIN "User" pu ON pu.id = c.candidate_user_id
      INNER JOIN "Profile" pp ON pp."userId" = pu.id
      WHERE c.id = ${i}
      LIMIT 1
    `),a.prisma.$queryRaw(t.Prisma.sql`
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
        created_at AS "createdAt"
      FROM chat_messages
      WHERE conversation_id = ${i}
      ORDER BY created_at ASC
    `)]),s=r[0];if(!s)return null;let{decryptMessage:o}=await e.A(49531);return{...s,messages:n.map(e=>{var t,a,i;return{id:e.id,senderUserId:e.senderUserId,senderRole:e.senderRole,messageKind:e.messageKind,body:o({ciphertext:e.ciphertext,iv:e.iv,authTag:e.authTag,keyVersion:e.keyVersion},(t=e.conversationId,a=e.id,i=e.senderUserId,`chat:${t}:${a}:${i}`)),createdAt:e.createdAt.toISOString()}})}}function d(e){return e?e instanceof Date?e.toISOString():new Date(e).toISOString():null}function l(e){return e>0?"backlog":"done"}function c(e,t=1){return e>=Math.max(3,t)?"high":e>0?"medium":"low"}async function u(){return(await a.prisma.$queryRaw(t.Prisma.sql`
    SELECT
      c.id,
      c.status,
      c.application_id AS "applicationId",
      COALESCE(cp."companyName", cu."displayName") AS "companyName",
      COALESCE(pp.nombre, pu."displayName") AS "candidateName",
      COALESCE(mc.messages_count, 0)::int AS "messagesCount",
      COALESCE(mod.reports_count, 0)::int AS "reportsCount",
      COALESCE(mod.warnings_count, 0)::int AS "warningsCount",
      c.last_message_at AS "lastMessageAt",
      c.updated_at AS "updatedAt"
    FROM chat_conversations c
    INNER JOIN "User" cu ON cu.id = c.company_user_id
    INNER JOIN "Profile" cp ON cp."userId" = cu.id
    INNER JOIN "User" pu ON pu.id = c.candidate_user_id
    INNER JOIN "Profile" pp ON pp."userId" = pu.id
    LEFT JOIN (
      SELECT conversation_id, COUNT(*) AS messages_count
      FROM chat_messages
      GROUP BY conversation_id
    ) mc ON mc.conversation_id = c.id
    LEFT JOIN (
      SELECT
        conversation_id,
        COUNT(*) FILTER (WHERE event_type = 'report') AS reports_count,
        COUNT(*) FILTER (WHERE event_type = 'profanity_warning') AS warnings_count
      FROM chat_moderation_events
      GROUP BY conversation_id
    ) mod ON mod.conversation_id = c.id
    ORDER BY c.updated_at DESC
    LIMIT 20
  `)).map(e=>({id:e.id,status:e.status,companyName:e.companyName??"Empresa",candidateName:e.candidateName??"Candidato",applicationId:e.applicationId,messagesCount:e.messagesCount??0,reportsCount:e.reportsCount??0,warningsCount:e.warningsCount??0,lastMessageAt:d(e.lastMessageAt),updatedAt:d(e.updatedAt)??new Date().toISOString()}))}async function p(){return(await a.prisma.$queryRaw(t.Prisma.sql`
    SELECT
      i.id,
      i.status,
      i.requested_stage AS "requestedStage",
      i.application_id AS "applicationId",
      COALESCE(cp."companyName", cu."displayName") AS "companyName",
      COALESCE(pp.nombre, pu."displayName") AS "candidateName",
      i.sent_at AS "sentAt",
      i.responded_at AS "respondedAt",
      i.reject_cooldown_until AS "rejectCooldownUntil"
    FROM chat_process_invites i
    INNER JOIN "User" cu ON cu.id = i.company_user_id
    INNER JOIN "Profile" cp ON cp."userId" = cu.id
    INNER JOIN "User" pu ON pu.id = i.candidate_user_id
    INNER JOIN "Profile" pp ON pp."userId" = pu.id
    ORDER BY i.sent_at DESC
    LIMIT 20
  `)).map(e=>({id:e.id,status:e.status,requestedStage:e.requestedStage,applicationId:e.applicationId,companyName:e.companyName??"Empresa",candidateName:e.candidateName??"Candidato",sentAt:d(e.sentAt)??new Date().toISOString(),respondedAt:d(e.respondedAt),rejectCooldownUntil:d(e.rejectCooldownUntil)}))}async function m(){return(await a.prisma.session.findMany({include:{user:{select:{id:!0,role:!0,displayName:!0}}},orderBy:{createdAt:"desc"},take:20})).map(e=>({userId:e.userId,displayName:e.user?.displayName??e.userId,role:e.user?.role??"candidate",createdAt:e.createdAt.toISOString(),expiresAt:e.expiresAt.toISOString(),revokedAt:d(e.revokedAt)}))}async function f(){return(await a.prisma.verificationRequest.findMany({orderBy:{submittedAt:"desc"},take:20})).map(e=>({id:e.id,role:e.role,status:e.status,userId:e.userId,notes:e.notes??void 0,submittedAt:e.submittedAt.toISOString(),reviewedAt:d(e.reviewedAt)}))}async function h(e){return(await a.prisma.event.findMany({where:{...e?.type?{type:e.type}:{},happenedAt:{...e?.from?{gte:e.from}:{},...e?.to?{lte:e.to}:{}}},orderBy:{happenedAt:"desc"},take:e?.limit??50,select:{id:!0,type:!0,actorRole:!0,entityId:!0,pathname:!0,source:!0,happenedAt:!0,metadataJson:!0}})).map(e=>{let t;return{...(t=function(e){if(!e)return null;try{let t=JSON.parse(e);return t&&"object"==typeof t?t:null}catch{return null}}(e.metadataJson),{targetPath:"string"==typeof t?.requestUrl?t.requestUrl:e.entityId,method:"string"==typeof t?.method?t.method:null,statusCode:"number"==typeof t?.statusCode?t.statusCode:null,durationMs:"number"==typeof t?.durationMs?t.durationMs:null}),id:e.id,type:e.type,actorRole:e.actorRole,entityId:e.entityId,pathname:e.pathname,source:e.source,happenedAt:e.happenedAt.toISOString()}})}async function y(e){var t;let[a,o,d,y,v,g,A,_,w,E]=await Promise.all([(0,s.getAdminOverview)(),(0,s.listUsersForAdmin)(),(0,s.listJobsForAdmin)(),m(),f(),n(),u(),p(),h({type:e?.activityType,from:e?.activityFrom,to:e?.activityTo,limit:e?.activityLimit}),i()]),S=o.filter(e=>"candidate"===e.role&&"private"===e.profileVisibility).length,N=o.filter(e=>"company"===e.role&&"verified"!==e.verificationStatus).length,R=d.filter(e=>"draft"===e.status).length,T=d.filter(e=>"paused"===e.status).length,I=v.filter(e=>"pending"===e.status).length,C=g.filter(e=>"retention"===e.source).length,O=A.filter(e=>e.reportsCount>0||"pending_review"===e.status).length,b=_.filter(e=>"pending"===e.status).length,M=y.filter(e=>!e.revokedAt&&new Date(e.expiresAt).getTime()>Date.now()).length,U=A.filter(e=>"active"===e.status).length,P=A.filter(e=>"pending_review"===e.status).length,L={ok:!0,metrics:{...a.metrics,activeSessionsTotal:M,pendingInvitesTotal:b,activeChatsTotal:U,pendingReviewChatsTotal:P,verificationPendingTotal:I,failedRetentionTotal:C,reportedChatsTotal:O},tasks:[{id:"ADM-1001",title:"Revisar candidatos privados",description:"Hay candidatos registrados que no están visibles para empresas.",category:"users",status:l((t={privateCandidates:S,unverifiedCompanies:N,draftJobs:R,pausedJobs:T,pendingVerifications:I,failedRetention:C,reportedChats:O,pendingInvites:b}).privateCandidates),priority:c(t.privateCandidates),href:"/admin/usuarios",tags:["candidate","visibility"],metric:`${t.privateCandidates}`},{id:"ADM-1002",title:"Gestionar empresas no verificadas",description:"Empresas creadas aún sin verificación aprobada.",category:"auth",status:l(t.unverifiedCompanies),priority:c(t.unverifiedCompanies),href:"/admin/auth",tags:["company","verification"],metric:`${t.unverifiedCompanies}`},{id:"ADM-1003",title:"Vacantes en borrador por revisar",description:"Publicaciones creadas pero no publicadas.",category:"jobs",status:l(t.draftJobs),priority:c(t.draftJobs),href:"/admin/vacantes",tags:["jobs","draft"],metric:`${t.draftJobs}`},{id:"ADM-1004",title:"Vacantes pausadas",description:"Publicaciones ocultas que pueden requerir acción.",category:"jobs",status:l(t.pausedJobs),priority:c(t.pausedJobs,2),href:"/admin/vacantes",tags:["jobs","paused"],metric:`${t.pausedJobs}`},{id:"ADM-1005",title:"Solicitudes de verificación pendientes",description:"Usuarios esperando revisión manual.",category:"auth",status:l(t.pendingVerifications),priority:c(t.pendingVerifications),href:"/admin/auth",tags:["verification","queue"],metric:`${t.pendingVerifications}`},{id:"ADM-1006",title:"Incidentes de retención fallidos",description:"Tareas operativas con error o retry pendientes.",category:"errors",status:l(t.failedRetention),priority:c(t.failedRetention),href:"/admin/errors",tags:["retention","error"],metric:`${t.failedRetention}`},{id:"ADM-1007",title:"Chats reportados",description:"Conversaciones marcadas para moderación.",category:"chat",status:l(t.reportedChats),priority:c(t.reportedChats),href:"/admin/chats",tags:["chat","moderation"],metric:`${t.reportedChats}`},{id:"ADM-1008",title:"Invitaciones pendientes",description:"Procesos iniciados por empresas esperando respuesta.",category:"chat",status:l(t.pendingInvites),priority:c(t.pendingInvites,5),href:"/admin/chats",tags:["invite","pipeline"],metric:`${t.pendingInvites}`}],chats:A,invites:_,sessions:y,verifications:v,errors:g,activities:w,trafficSeries:E.trafficSeries,deviceBreakdown:E.deviceBreakdown,referrerBreakdown:E.referrerBreakdown,recentUsers:a.recentUsers,recentJobs:a.recentJobs},k=w.filter(e=>"api_request"===e.type);return(0,r.archiveAdminTaskSnapshot)({generatedAt:new Date().toISOString(),tasks:L.tasks,activities:k}),(0,r.archiveAdminRequestActivities)(k),L}e.s(["getAdminChatConversation",0,o],19575),e.s(["getAdminConsole",0,y],49051),e.s([],96664)},58105,e=>{"use strict";var t=e.i(81541),a=e.i(29879),i=e.i(7972),r=e.i(36043),n=e.i(49762),s=e.i(1e3),o=e.i(41081),d=e.i(89819),l=e.i(43460),c=e.i(6359),u=e.i(26260),p=e.i(65708),m=e.i(24135),f=e.i(5316),h=e.i(89554),y=e.i(93695);e.i(16754);var v=e.i(75142);e.i(6456);var g=e.i(57278);e.i(96664);var A=e.i(19575);e.i(9391);var _=e.i(49039);let w="nodejs";async function E(e,t){let a=(0,_.enforceRateLimit)(e,{scope:"admin-chat-detail",maxRequests:120,windowMs:6e4});if(a)return a;let i=await (0,g.requireAdminUser)(e);if(i instanceof Response)return i;let{id:r}=await t.params;if(!(0,_.isSafeRouteParam)(r,120))return(0,_.jsonWithSecurity)({ok:!1,message:"Chat inválido"},{status:400});let n=await (0,A.getAdminChatConversation)(r);return n?(0,_.jsonWithSecurity)({ok:!0,conversation:n}):(0,_.jsonWithSecurity)({ok:!1,message:"Chat no encontrado"},{status:404})}e.s(["GET",0,E,"runtime",0,w],39598),e.s([],81046),e.i(81046),e.i(39598),e.s(["GET",0,E,"runtime",0,w],80412);var S=e.i(80412);let N=new t.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/admin/chats/[id]/route",pathname:"/api/admin/chats/[id]",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"frontend",resolvedPagePath:"[project]/frontend/app/api/admin/chats/[id]/route.ts",nextConfigOutput:"",userland:S,...{}}),{workAsyncStorage:R,workUnitAsyncStorage:T,serverHooks:I}=N;async function C(e,t,i){i.requestMeta&&(0,r.setRequestMeta)(e,i.requestMeta),N.isDev&&(0,r.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let g="/api/admin/chats/[id]/route";g=g.replace(/\/index$/,"")||"/";let A=await N.prepare(e,t,{srcPage:g,multiZoneDraftMode:!1});if(!A)return t.statusCode=400,t.end("Bad Request"),null==i.waitUntil||i.waitUntil.call(i,Promise.resolve()),null;let{buildId:_,deploymentId:w,params:E,nextConfig:S,parsedUrl:R,isDraftMode:T,prerenderManifest:I,routerServerContext:C,isOnDemandRevalidate:O,revalidateOnlyGenerated:b,resolvedPathname:M,clientReferenceManifest:U,serverActionsManifest:P}=A,L=(0,o.normalizeAppPath)(g),k=!!(I.dynamicRoutes[L]||I.routes[M]),D=async()=>((null==C?void 0:C.render404)?await C.render404(e,t,R,!1):t.end("This page could not be found"),null);if(k&&!T){let e=!!I.routes[M],t=I.dynamicRoutes[L];if(t&&!1===t.fallback&&!e){if(S.adapterPath)return await D();throw new y.NoFallbackError}}let $=null;!k||N.isDev||T||($="/index"===($=M)?"/":$);let q=!0===N.isDev||!k,J=k&&!q;P&&U&&(0,s.setManifestsSingleton)({page:g,clientReferenceManifest:U,serverActionsManifest:P});let x=e.method||"GET",j=(0,n.getTracer)(),F=j.getActiveScopeSpan(),H=!!(null==C?void 0:C.isWrappedByNextServer),B=!!(0,r.getRequestMeta)(e,"minimalMode"),V=(0,r.getRequestMeta)(e,"incrementalCache")||await N.getIncrementalCache(e,S,I,B);null==V||V.resetRequestCache(),globalThis.__incrementalCache=V;let W={params:E,previewProps:I.preview,renderOpts:{experimental:{authInterrupts:!!S.experimental.authInterrupts},cacheComponents:!!S.cacheComponents,supportsDynamicResponse:q,incrementalCache:V,cacheLifeProfiles:S.cacheLife,waitUntil:i.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,a,i,r)=>N.onRequestError(e,t,i,r,C)},sharedContext:{buildId:_,deploymentId:w}},K=new d.NodeNextRequest(e),X=new d.NodeNextResponse(t),Y=l.NextRequestAdapter.fromNodeNextRequest(K,(0,l.signalFromNodeResponse)(t));try{let r,s=async e=>N.handle(Y,W).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let a=j.getRootSpanAttributes();if(!a)return;if(a.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${a.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let i=a.get("next.route");if(i){let t=`${x} ${i}`;e.setAttributes({"next.route":i,"http.route":i,"next.span_name":t}),e.updateName(t),r&&r!==e&&(r.setAttribute("http.route",i),r.updateName(t))}else e.updateName(`${x} ${g}`)}),o=async r=>{var n,o;let d=async({previousCacheEntry:a})=>{try{if(!B&&O&&b&&!a)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await s(r);e.fetchMetrics=W.renderOpts.fetchMetrics;let o=W.renderOpts.pendingWaitUntil;o&&i.waitUntil&&(i.waitUntil(o),o=void 0);let d=W.renderOpts.collectedTags;if(!k)return await (0,p.sendResponse)(K,X,n,W.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(n.headers);d&&(t[h.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let a=void 0!==W.renderOpts.collectedRevalidate&&!(W.renderOpts.collectedRevalidate>=h.INFINITE_CACHE)&&W.renderOpts.collectedRevalidate,i=void 0===W.renderOpts.collectedExpire||W.renderOpts.collectedExpire>=h.INFINITE_CACHE?void 0:W.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:a,expire:i}}}}catch(t){throw(null==a?void 0:a.isStale)&&await N.onRequestError(e,t,{routerKind:"App Router",routePath:g,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:J,isOnDemandRevalidate:O})},!1,C),t}},l=await N.handleResponse({req:e,nextConfig:S,cacheKey:$,routeKind:a.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:I,isRoutePPREnabled:!1,isOnDemandRevalidate:O,revalidateOnlyGenerated:b,responseGenerator:d,waitUntil:i.waitUntil,isMinimalMode:B});if(!k)return null;if((null==l||null==(n=l.value)?void 0:n.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(o=l.value)?void 0:o.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});B||t.setHeader("x-nextjs-cache",O?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),T&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let c=(0,m.fromNodeOutgoingHttpHeaders)(l.value.headers);return B&&k||c.delete(h.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||t.getHeader("Cache-Control")||c.get("Cache-Control")||c.set("Cache-Control",(0,f.getCacheControlHeader)(l.cacheControl)),await (0,p.sendResponse)(K,X,new Response(l.value.body,{headers:c,status:l.value.status||200})),null};H&&F?await o(F):(r=j.getActiveScopeSpan(),await j.withPropagatedContext(e.headers,()=>j.trace(c.BaseServerSpan.handleRequest,{spanName:`${x} ${g}`,kind:n.SpanKind.SERVER,attributes:{"http.method":x,"http.target":e.url}},o),void 0,!H))}catch(t){if(t instanceof y.NoFallbackError||await N.onRequestError(e,t,{routerKind:"App Router",routePath:L,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:J,isOnDemandRevalidate:O})},!1,C),k)throw t;return await (0,p.sendResponse)(K,X,new Response(null,{status:500})),null}}e.s(["handler",0,C,"patchFetch",0,function(){return(0,i.patchFetch)({workAsyncStorage:R,workUnitAsyncStorage:T})},"routeModule",0,N,"serverHooks",0,I,"workAsyncStorage",0,R,"workUnitAsyncStorage",0,T],58105)},49531,e=>{e.v(t=>Promise.all(["server/chunks/backend_lib-server_chat-crypto_ts_04_4h1j._.js"].map(t=>e.l(t))).then(()=>t(32827)))}];

//# sourceMappingURL=_0x3uu5z._.js.map