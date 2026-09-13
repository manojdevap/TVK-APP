"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePassword, signOut } from "@/server/auth-actions";
import { ErrorNote } from "@/components/ui/Empty";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/credentials";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function ChangePasswordForm({
  locale,
  dict,
  forced,
}: {
  locale: Locale;
  dict: Dictionary;
  forced: boolean;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (next !== confirm) {
      setError(dict.auth.passwordsMismatch);
      return;
    }

    setBusy(true);
    const result = await changePassword(current, next);

    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }

    router.replace(`/${locale}`);
    router.refresh();
  }

  async function handleSignOut() {
    await signOut();
    router.replace(`/${locale}/login`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {forced && (
        <div className="rounded-xl bg-yellow-soft px-3 py-2.5">
          <p className="text-sm font-semibold text-maroon-dark">{dict.auth.mustChangeTitle}</p>
          <p className="mt-0.5 text-xs text-muted">{dict.auth.mustChangeBody}</p>
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="current">
          {dict.auth.currentPassword}
        </label>
        <input
          id="current"
          type="password"
          className="field"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="next">
          {dict.auth.newPassword}
        </label>
        <input
          id="next"
          type="password"
          className="field"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <p className="field-hint">
          {dict.auth.newPassword} · {MIN_PASSWORD_LENGTH}+
        </p>
      </div>

      <div>
        <label className="field-label" htmlFor="confirm">
          {dict.auth.confirmPassword}
        </label>
        <input
          id="confirm"
          type="password"
          className="field"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? dict.common.saving : dict.auth.changePassword}
      </button>

      {forced && (
        <button type="button" onClick={handleSignOut} className="btn-secondary w-full">
          {dict.auth.signOut}
        </button>
      )}
    </form>
  );
}
