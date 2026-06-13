"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { checkIsAdmin } from "@/lib/data/admin-actions";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function AdminGuard({
  children,
  locale,
  dict,
}: {
  children: React.ReactNode;
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "denied" | "no-config">("loading");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus("no-config");
      return;
    }

    checkIsAdmin().then((isAdmin) => {
      if (isAdmin) setStatus("ok");
      else setStatus("denied");
    });
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-tvk-maroon border-t-transparent" />
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  if (status === "no-config") {
    return (
      <div className="card mx-auto max-w-lg border-amber-200 bg-amber-50 text-center">
        <p className="font-medium text-amber-900">Supabase not configured</p>
        <p className="mt-2 text-sm text-amber-800">
          Copy <code className="rounded bg-amber-100 px-1">.env.example</code> to{" "}
          <code className="rounded bg-amber-100 px-1">.env.local</code> and add your Supabase keys.
        </p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="card mx-auto max-w-lg border-red-200 bg-red-50 text-center">
        <p className="font-medium text-red-900">{dict.admin.notAdmin}</p>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/login`)}
          className="btn-primary mt-4"
        >
          {dict.admin.login}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
