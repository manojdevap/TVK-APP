"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorNote } from "@/components/ui/Empty";
import {
  createAccount,
  deleteAccount,
  resetAccountPassword,
  setAccountAdmin,
  type AccountInput,
  type IssuedPassword,
} from "@/server/user-actions";
import type { Dictionary } from "@/i18n/dictionaries/en";

export type AccountRow = {
  id: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  mustChangePassword: boolean;
};

const blank: AccountInput = { username: "", displayName: "", isAdmin: true };

export function AccountsManager({
  dict,
  accounts,
  currentUserId,
}: {
  dict: Dictionary;
  accounts: AccountRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<AccountInput>(blank);
  const [open, setOpen] = useState(false);
  const [issued, setIssued] = useState<IssuedPassword | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function show(result: Awaited<ReturnType<typeof createAccount>>) {
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setIssued(result.data);
    setOpen(false);
    setForm(blank);
    router.refresh();
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const result = await createAccount(form);
    setBusy(false);
    show(result);
  }

  async function handleReset(account: AccountRow) {
    if (!confirm(dict.accounts.confirmReset)) return;
    setError("");
    show(await resetAccountPassword(account.id));
  }

  async function handleToggleAdmin(account: AccountRow) {
    setError("");
    const result = await setAccountAdmin(account.id, !account.isAdmin);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete(account: AccountRow) {
    if (!confirm(dict.accounts.confirmDelete)) return;
    setError("");
    const result = await deleteAccount(account.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  function tier(account: AccountRow) {
    if (account.isSuperAdmin) return dict.accounts.superAdmin;
    return account.isAdmin ? dict.accounts.admin : dict.accounts.viewer;
  }

  // A freshly issued password takes over the screen: it is shown once, and losing it
  // means issuing another one.
  if (issued) {
    return <IssuedPasswordCard dict={dict} issued={issued} onDone={() => setIssued(null)} />;
  }

  return (
    <div className="space-y-3">
      {error && <ErrorNote>{error}</ErrorNote>}

      <ul className="space-y-2">
        {accounts.map((account) => {
          const isSelf = account.id === currentUserId;

          return (
            <li key={account.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{account.displayName}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {account.username} · {tier(account)}
                    {isSelf ? ` · ${dict.accounts.you}` : ""}
                  </p>
                  {account.mustChangePassword && (
                    <p className="mt-1 text-xs text-muted">
                      {dict.accounts.awaitingFirstSignIn}
                    </p>
                  )}
                </div>
              </div>

              {!account.isSuperAdmin && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
                  <button
                    type="button"
                    className="text-maroon"
                    onClick={() => handleReset(account)}
                  >
                    {dict.accounts.resetPassword}
                  </button>
                  <button
                    type="button"
                    className="text-maroon"
                    onClick={() => handleToggleAdmin(account)}
                  >
                    {account.isAdmin ? dict.accounts.removeAdmin : dict.accounts.makeAdmin}
                  </button>
                  <button
                    type="button"
                    className="text-danger"
                    onClick={() => handleDelete(account)}
                  >
                    {dict.common.delete}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-muted">{dict.accounts.superAdminNote}</p>

      {!open ? (
        <button
          type="button"
          className="btn-primary w-full"
          onClick={() => {
            setForm(blank);
            setError("");
            setOpen(true);
          }}
        >
          {dict.accounts.addAccount}
        </button>
      ) : (
        <form onSubmit={handleCreate} className="card space-y-4">
          <p className="font-medium text-maroon-dark">{dict.accounts.addAccount}</p>

          <div>
            <label className="field-label" htmlFor="account-name">
              {dict.accounts.displayName}
            </label>
            <input
              id="account-name"
              className="field"
              required
              autoComplete="off"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
            <p className="field-hint">{dict.accounts.displayNameHint}</p>
          </div>

          <div>
            <label className="field-label" htmlFor="account-username">
              {dict.accounts.username}
            </label>
            <input
              id="account-username"
              className="field"
              required
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
            />
            <p className="field-hint">{dict.accounts.usernameHint}</p>
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 accent-maroon"
              checked={form.isAdmin}
              onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })}
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">
                {dict.accounts.canEdit}
              </span>
              <span className="block text-xs text-muted">{dict.accounts.canEditHint}</span>
            </span>
          </label>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={busy}>
              {busy ? dict.common.saving : dict.accounts.addAccount}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              {dict.common.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function IssuedPasswordCard({
  dict,
  issued,
  onDone,
}: {
  dict: Dictionary;
  issued: IssuedPassword;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = `${dict.accounts.username}: ${issued.username}\n${dict.auth.password}: ${issued.password}`;

    navigator.clipboard
      ?.writeText(text)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  }

  return (
    <div className="card space-y-4">
      <div>
        <p className="font-medium text-maroon-dark">{dict.accounts.passwordReady}</p>
        <p className="mt-1 text-sm text-muted">{issued.displayName}</p>
      </div>

      <dl className="space-y-3">
        <div>
          <dt className="field-label">{dict.accounts.username}</dt>
          <dd className="font-mono text-base text-foreground">{issued.username}</dd>
        </div>
        <div>
          <dt className="field-label">{dict.auth.password}</dt>
          <dd className="select-all font-mono text-xl tracking-wide text-foreground">
            {issued.password}
          </dd>
        </div>
      </dl>

      <p className="text-xs text-muted">{dict.accounts.passwordShownOnce}</p>

      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={handleCopy}>
          {copied ? dict.accounts.copied : dict.accounts.copy}
        </button>
        <button type="button" className="btn-primary flex-1" onClick={onDone}>
          {dict.accounts.done}
        </button>
      </div>
    </div>
  );
}
