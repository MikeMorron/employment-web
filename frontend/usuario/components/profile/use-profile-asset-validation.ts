"use client";

import { useEffect, useRef } from "react";
import type { User } from "@/types/user";

export function useProfileAssetValidation({
  profile,
  setDraft,
  setProfile,
  scheduleAuthUserProfileSync,
}: {
  profile: User;
  setDraft: React.Dispatch<React.SetStateAction<User>>;
  setProfile: React.Dispatch<React.SetStateAction<User>>;
  scheduleAuthUserProfileSync: (nextProfile: User | null) => void;
}) {
  const lastValidatedAssetsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const hasCv = Boolean(profile.cv?.trim() && profile.cvDownloadUrl?.trim());
    const hasAvatar = Boolean(profile.avatar?.trim());
    const assetsKey = `${hasCv ? profile.cvDownloadUrl?.trim() : ""}::${hasAvatar ? profile.avatar?.trim() : ""}`;

    if (lastValidatedAssetsKeyRef.current === assetsKey) {
      return;
    }

    if (!hasCv && !hasAvatar) {
      lastValidatedAssetsKeyRef.current = assetsKey;
      return;
    }

    lastValidatedAssetsKeyRef.current = assetsKey;

    let cancelled = false;

    const validateStoredAssets = async () => {
      try {
        const [cvResponse, avatarResponse] = await Promise.all([
          hasCv
            ? fetch(profile.cvDownloadUrl!, {
                method: "HEAD",
                cache: "no-store",
              })
            : Promise.resolve(null),
          hasAvatar
            ? fetch(profile.avatar!, {
                method: "HEAD",
                cache: "no-store",
              })
            : Promise.resolve(null),
        ]);

        if (cancelled) {
          return;
        }

        const cvExists = hasCv ? cvResponse?.ok : false;
        const avatarExists = hasAvatar ? avatarResponse?.ok : false;

        if (cvExists) {
          setDraft((current) => ({
            ...current,
            cv: profile.cv?.trim() || "",
          }));

          setProfile((current) => ({
            ...current,
            cv: current.cv?.trim() || profile.cv?.trim() || "",
          }));
          scheduleAuthUserProfileSync({
            ...profile,
            cv: profile.cv?.trim() || "",
          });
        } else if (hasCv) {
          setDraft((current) => ({
            ...current,
            cv: "",
          }));

          setProfile((current) => ({
            ...current,
            cv: "",
          }));
          scheduleAuthUserProfileSync({
            ...profile,
            cv: "",
          });
        }

        if (!avatarExists && hasAvatar) {
          setDraft((current) => ({
            ...current,
            avatar: "",
          }));

          setProfile((current) => ({
            ...current,
            avatar: "",
          }));
          scheduleAuthUserProfileSync({
            ...profile,
            avatar: "",
          });
        }
      } catch {
        if (!cancelled) {
          setDraft((current) => ({
            ...current,
            cv: "",
            avatar: "",
          }));

          setProfile((current) => ({
            ...current,
            cv: "",
            avatar: "",
          }));
          scheduleAuthUserProfileSync({
            ...profile,
            cv: "",
            avatar: "",
          });
        }
      }
    };

    void validateStoredAssets();

    return () => {
      cancelled = true;
    };
  }, [profile, scheduleAuthUserProfileSync, setDraft, setProfile]);
}
