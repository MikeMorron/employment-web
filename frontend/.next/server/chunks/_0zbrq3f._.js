module.exports=[1029,e=>{"use strict";e.s(["normalizeCompanyPlan",0,function(e){return"premium"===e||"business"===e||"pro"===e||"basic"===e?e:"basic"}])},56354,e=>{"use strict";var a=e.i(30786),i=e.i(1029),t=e.i(16155);e.s(["getAllowedPlansForRole",0,function(e){return"candidate"===e?["basic","boosted","pro"]:["basic","pro","business","premium"]},"getPlanLimits",0,function(e,r){if("company"===e){let e=(0,i.normalizeCompanyPlan)(r),a=t.companySubscriptionPlans.find(a=>a.planKey===e)??t.companySubscriptionPlans[0];return{activeJobs:a.activeJobs,maxPublishedJobs:a.maxPublishedJobs,featuredJobs:"business"===e||"premium"===e,advancedFilters:"basic"!==e,analyticsDepth:"basic"===e?"basic":"full",premiumCandidateQueue:a.topCandidates,urgentJobs:a.urgentJobs,collaboratorLimit:a.collaboratorLimit}}return{activeApplications:"pro"===r?30:"boosted"===r?15:7,profileInsights:"advanced"===(0,a.getCandidatePlanFeatures)(r).insightDepth?"full":"limited",visibility:(0,a.getCandidatePlanFeatures)(r).profileHighlight?"high":"boosted"===r?"medium":"standard"}}])},2925,67193,41152,73831,e=>{"use strict";e.i(43178);var a=e.i(97700),i=e.i(11259),t=e.i(66680);async function r(){await a.prisma.$executeRaw`
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
  `,await a.prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS admin_user_trash_status_restore_idx
      ON admin_user_trash (status, restore_until)
  `,await a.prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS admin_user_trash_user_status_idx
      ON admin_user_trash (user_id, status)
  `}async function s(){return await r(),(await a.prisma.$queryRaw`
    SELECT user_id FROM admin_user_trash WHERE status = 'trashed'
  `).map(e=>e.user_id)}async function n(){return await r(),(await a.prisma.$queryRaw`
    SELECT id, user_id, original_email, display_name, role, justification, restore_until, created_at
    FROM admin_user_trash
    WHERE status = 'trashed'
    ORDER BY created_at DESC
  `).map(e=>({id:e.id,userId:e.user_id,originalEmail:e.original_email,displayName:e.display_name??e.user_id,role:e.role,justification:e.justification,restoreUntil:e.restore_until.toISOString(),createdAt:e.created_at.toISOString()}))}async function o({userId:e,adminUserId:i,justification:s}){if(await r(),(await a.prisma.$queryRaw`
    SELECT id FROM admin_user_trash WHERE user_id = ${e} AND status = 'trashed' LIMIT 1
  `).length>0)return{ok:!1,message:"El usuario ya está en la papelera"};let n=await a.prisma.user.findUnique({where:{id:e},include:{profile:!0,credential:!0,sessions:{select:{token:!0,expiresAt:!0,revokedAt:!0,createdAt:!0}},jobs:{select:{id:!0,title:!0,status:!0,createdAt:!0,updatedAt:!0}},applications:{select:{id:!0,jobId:!0,status:!0,appliedAt:!0,lastUpdatedAt:!0}},notifications:{select:{id:!0,type:!0,title:!0,createdAt:!0}}}});if(!n?.profile)return{ok:!1,message:"Usuario no encontrado"};let l=(0,t.randomUUID)(),d=`trashed+${l}@archived.local`,u=new Date(Date.now()+1296e6),p={user:{...n,credential:n.credential?{userId:n.credential.userId,email:n.credential.email,hasPassword:!0}:null},retentionDays:15};return await a.prisma.$transaction(async a=>{await a.$executeRaw`
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
        ${l},
        ${n.id},
        ${n.email},
        ${d},
        ${n.displayName},
        ${n.role},
        ${s},
        ${JSON.stringify(p)}::jsonb,
        ${i},
        ${u}
      )
    `,await a.user.update({where:{id:e},data:{email:d,displayName:`[Papelera] ${n.displayName}`}}),await a.credential.updateMany({where:{userId:e},data:{email:d}}),await a.session.updateMany({where:{userId:e,revokedAt:null},data:{revokedAt:new Date}})}),{ok:!0}}async function l(e){await r();let i=(await a.prisma.$queryRaw`
    SELECT user_id, original_email, display_name
    FROM admin_user_trash
    WHERE id = ${e} AND status = 'trashed'
    LIMIT 1
  `)[0];if(!i)return{ok:!1,message:"Registro de papelera no encontrado"};let t=await a.prisma.user.findUnique({where:{email:i.original_email},select:{id:!0}});return t&&t.id!==i.user_id?{ok:!1,message:"No se puede recuperar: el correo ya pertenece a otro usuario"}:(await a.prisma.$transaction(async a=>{await a.user.update({where:{id:i.user_id},data:{email:i.original_email,displayName:i.display_name??void 0}}),await a.credential.updateMany({where:{userId:i.user_id},data:{email:i.original_email}}),await a.$executeRaw`
      UPDATE admin_user_trash
      SET status = 'restored', restored_at = now(), updated_at = now()
      WHERE id = ${e}
    `}),{ok:!0})}async function d(e){await r();let i=(await a.prisma.$queryRaw`
    SELECT user_id FROM admin_user_trash WHERE id = ${e} AND status = 'trashed' LIMIT 1
  `)[0];return i?(await a.prisma.$transaction(async a=>{await a.user.delete({where:{id:i.user_id}}),await a.$executeRaw`
      UPDATE admin_user_trash
      SET status = 'purged', purged_at = now(), updated_at = now()
      WHERE id = ${e}
    `}),{ok:!0}):{ok:!1,message:"Registro de papelera no encontrado"}}async function u(){for(let e of(await r(),await a.prisma.$queryRaw`
    SELECT id FROM admin_user_trash
    WHERE status = 'trashed' AND restore_until <= now()
  `))await d(e.id)}e.s(["getAdminTrashedUserIds",0,s,"isTrashJustificationValid",0,function(e){return e.trim().length>=10},"listAdminTrashedUsers",0,n,"moveAdminUserToTrash",0,o,"purgeAdminTrashedUser",0,d,"purgeExpiredAdminUserTrash",0,u,"recoverAdminTrashedUser",0,l],67193),e.s([],41152),e.i(6387);var p=e.i(14195),c=e.i(31327);e.i(42620);var m=e.i(94028);function f(e,a){return e?(0,i.buildAvatarFileHref)(e):a??void 0}async function h(){await u();let e=await s(),i=await a.prisma.user.findMany({where:{role:"candidate",id:{notIn:e}},include:{profile:!0,jobs:{where:{status:"published"},select:{id:!0}}},orderBy:{createdAt:"desc"}}),t=[];for(let e of i)e.profile&&t.push({id:(0,m.encodeCompanyCandidateId)(e.id),role:"candidate",displayName:e.displayName,nombre:e.profile.nombre,headline:e.profile.rol,location:e.profile.ubicacion??void 0,avatar:f(e.profile.avatarAssetPublicId,e.profile.avatar),plan:e.plan,availabilityStatus:JSON.parse(e.profile.professionalProfileJson??"{}")?.availabilityStatus??void 0,profileVisibility:"public"===e.profile.profileVisibility||"recruiters_only"===e.profile.profileVisibility||"private"===e.profile.profileVisibility?e.profile.profileVisibility:void 0,skills:JSON.parse(e.profile.skillsJson??"[]").slice(0,6),previewProfileId:"private"===e.profile.profileVisibility?void 0:(0,m.encodeCompanyCandidateId)(e.id),createdAt:e.createdAt.toISOString()});return t}async function y(){await u();let e=await s(),[i,t]=await Promise.all([a.prisma.user.findMany({where:{id:{notIn:e}},include:{profile:!0,jobs:{where:{status:"published"},select:{id:!0}}},orderBy:{createdAt:"desc"}}),a.prisma.credential.findMany({select:{userId:!0}})]),r=new Set(t.map(e=>e.userId));return i.flatMap(e=>{var a;if(!e.profile)return[];let i="candidate"===e.role?JSON.parse(e.profile.professionalProfileJson??"{}")?.availabilityStatus??void 0:void 0,t="candidate"===e.role?JSON.parse(e.profile.skillsJson??"[]").slice(0,6):[],s="candidate"===e.role?(0,p.parseCandidatePlanState)(e.profile.candidatePlanStateJson,new Date).applicationQuotaLimit:"company"===e.role?(0,c.parseCompanyPlanState)(e.profile.companyPlanStateJson,new Date).collaboratorLimit:0,n="candidate"===e.role?(0,p.parseCandidatePlanState)(e.profile.candidatePlanStateJson,new Date).currentPlanId:"company"===e.role?(0,c.parseCompanyPlanState)(e.profile.companyPlanStateJson,new Date).currentPlanId:void 0;return[{id:e.id,email:e.email,emailMasked:function(e){let[a,i="mail.com"]=e.split("@");if(!a)return e;let t=a.slice(0,Math.min(6,a.length)),[r,...s]=i.split("."),n=s.length>0?`.${s.join(".")}`:".com",o=r?`*${r.slice(Math.max(0,r.length-4))}`:"*mail";return`${t}***@${o}${n}`}(e.email),phone:e.profile.telefono??void 0,phoneMasked:function(e){let a=String(e??"").replace(/\D+/g,"");if(!a)return;let i=a.slice(0,Math.min(6,a.length));return`${i}${"*".repeat(Math.max(4,a.length-i.length))}`}(e.profile.telefono),passwordMasked:r.has(e.id)?"******":"Sin contraseña",role:e.role,displayName:e.displayName,nombre:"company"===e.role?e.profile.companyName??e.profile.nombre:e.profile.nombre,headline:e.profile.rol,location:e.profile.companyLocation??e.profile.ubicacion??void 0,avatar:f(e.profile.avatarAssetPublicId,e.profile.avatar),plan:e.plan,companyName:e.profile.companyName??void 0,companyDescription:e.profile.companyDescription??void 0,verificationStatus:"verified"===(a=e.profile.verificationStatus)||"unverified"===a||"pending"===a?a:void 0,availabilityStatus:i,profileVisibility:"public"===e.profile.profileVisibility||"recruiters_only"===e.profile.profileVisibility||"private"===e.profile.profileVisibility?e.profile.profileVisibility:void 0,skills:t,credits:s,currentPlanId:n,publishedJobs:e.jobs.length,activeJobs:e.profile.activeJobs??e.jobs.length,createdAt:e.createdAt.toISOString()}]})}async function _(){let[e,i]=await Promise.all([a.prisma.job.findMany({orderBy:{createdAt:"desc"}}),a.prisma.application.findMany({select:{id:!0,jobId:!0}})]),t=i.reduce((e,a)=>(e.set(a.jobId,(e.get(a.jobId)??0)+1),e),new Map);return e.map(e=>({id:e.id,companyId:e.ownerCompanyId,companyName:e.companyName,title:e.title,location:e.location,modality:e.modality,status:e.status,featured:e.featured,applicantsCount:t.get(e.id)??0,createdAt:e.createdAt.toISOString(),updatedAt:e.updatedAt.toISOString()}))}async function w(){let[e,i,t,r,s,n]=await Promise.all([a.prisma.user.findMany({select:{role:!0}}),a.prisma.job.findMany({select:{status:!0}}),a.prisma.application.count(),a.prisma.comment.count(),y(),_()]);return{ok:!0,metrics:{usersTotal:e.length,candidatesTotal:e.filter(e=>"candidate"===e.role).length,companiesTotal:e.filter(e=>"company"===e.role).length,adminsTotal:e.filter(e=>"admin"===e.role).length,jobsTotal:i.length,publishedJobsTotal:i.filter(e=>"published"===e.status).length,applicationsTotal:t,commentsTotal:r},recentUsers:s.slice(0,6),recentJobs:n.slice(0,6)}}e.s(["getAdminOverview",0,w,"listJobsForAdmin",0,_,"listRegisteredUsersForCompany",0,h,"listUsersForAdmin",0,y],73831),e.s([],2925)},13425,e=>{"use strict";let a="@#$%*!\\-.",i=RegExp(`^[A-Za-z0-9${a}]+$`),t=RegExp(`[${a}]`);e.s(["isStrongEnoughPassword",0,function(e){let a;return(a={minimumLengthMet:e.length>=10,hasNumber:/\d/.test(e),hasAllowedSpecialCharacter:t.test(e),hasOnlyAllowedCharacters:0===e.length||i.test(e),hasNoWhitespace:!/\s/.test(e)}).minimumLengthMet&&a.hasNumber&&a.hasAllowedSpecialCharacter&&a.hasOnlyAllowedCharacters&&a.hasNoWhitespace},"isValidEmail",0,function(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)},"normalizeEmail",0,function(e){return"string"!=typeof e?"":e.trim().toLowerCase()}],13425)}];

//# sourceMappingURL=_0zbrq3f._.js.map