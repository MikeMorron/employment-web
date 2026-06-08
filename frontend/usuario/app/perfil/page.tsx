"use client";

import { MiniPageNav } from "@/compartido/components/ui/mini-page-nav";
import { useAuthUser } from "@/compartido/hooks/use-auth-user";
import { useProfilePreviewUser } from "@/compartido/hooks/use-profile-preview-user";
import { useVacancyTheme } from "@/compartido/theme/use-vacancy-theme";
import { UserProfilePage } from "@/frontend/usuario/components/profile/user-profile-page";

export default function PerfilUsuarioPage() {
  const { isDark, themeReady, toggleTheme } = useVacancyTheme();
  const { authUser } = useAuthUser();
  const { previewId, previewResolved, previewUser } = useProfilePreviewUser();

  if (previewId && !previewResolved) {
    return null;
  }

  const candidateUser = previewUser?.role === "candidate"
    ? previewUser
    : authUser?.role === "candidate"
      ? authUser
      : null;

  if (!candidateUser) {
    return null;
  }

  const canEdit =
    authUser?.role === "candidate" &&
    authUser.id === candidateUser.id &&
    !previewUser;

  return (
    <main
      className={`vacancies-shell min-h-screen px-5 py-10 ${
        isDark ? "text-[#eef6ff]" : "vacancies-shell-light text-slate-900"
      } ${themeReady ? "" : "invisible"}`}
    >
      <div className="mx-auto max-w-6xl">
        <MiniPageNav isDark={isDark} onToggleTheme={toggleTheme} />

        <div className="mt-6">
          <UserProfilePage key={candidateUser.id} user={candidateUser} isDark={isDark} canEdit={canEdit} />
        </div>
      </div>
    </main>
  );
}
