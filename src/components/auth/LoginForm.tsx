"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/server/auth-actions";
import { ErrorNote } from "@/components/ui/Empty";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function LoginForm({
  locale,
  dict,
  nextPath,
}: {
  locale: Locale;
  dict: Dictionary;
  nextPath?: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const result = await signIn(username, password);

    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }

    if (result.data.mustChangePassword) {
      router.replace(`/${locale}/change-password`);
      router.refresh();
      return;
    }

    // Only follow `next` when it points back inside this app.
    const safeNext =
      nextPath && nextPath.startsWith(`/${locale}/`) && !nextPath.startsWith("//")
        ? nextPath
        : `/${locale}`;

    router.replace(safeNext);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label className="field-label" htmlFor="username">
          {dict.auth.username}
        </label>
        <input
          id="username"
          name="username"
          className="field"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div>
        <label className="field-label" htmlFor="password">
          {dict.auth.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? dict.auth.signingIn : dict.auth.signIn}
      </button>

      <p className="text-xs leading-relaxed text-muted">{dict.auth.inviteOnly}</p>
    </form>
  );
}
