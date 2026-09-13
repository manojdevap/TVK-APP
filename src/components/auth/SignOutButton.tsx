"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/server/auth-actions";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function SignOutButton({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    await signOut();
    router.replace(`/${locale}/login`);
    router.refresh();
  }

  return (
    <button type="button" onClick={handleClick} disabled={busy} className="btn-secondary w-full">
      {dict.auth.signOut}
    </button>
  );
}
