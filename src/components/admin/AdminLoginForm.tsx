"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function AdminLoginForm({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "error" | "success">("info");
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <div className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Configure <code className="rounded bg-amber-100 px-1">.env.local</code> with Supabase credentials first.
      </div>
    );
  }

  async function quickAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setMessageType("error");
      setMessage(data.error ?? dict.admin.error);
      return;
    }
    setMessageType("success");
    setMessage(dict.admin.quickLoginSuccess);
    router.push(`/${locale}/admin`);
    router.refresh();
  }

  async function sendOtp() {
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setMessageType("error");
      setMessage(error.message);
      return;
    }
    setStep("otp");
    setMessageType("info");
    setMessage(dict.admin.otpSent);
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    setLoading(false);
    if (error) {
      setMessageType("error");
      setMessage(error.message);
      return;
    }
    router.push(`/${locale}/admin`);
    router.refresh();
  }

  const messageColor =
    messageType === "error"
      ? "text-red-600"
      : messageType === "success"
        ? "text-emerald-700"
        : "text-muted";

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
      <div className="bg-tvk-maroon-dark px-8 py-6 text-center">
        <h1 className="text-lg font-bold text-tvk-yellow">{dict.admin.login}</h1>
        <p className="mt-1 text-xs text-white/75">{dict.admin.loginDescription}</p>
      </div>

      <div className="p-6 sm:p-8">
        <form onSubmit={quickAdminLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">{dict.admin.email}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field mt-1"
              placeholder="you@gmail.com"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {dict.admin.quickLogin}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted">{dict.admin.orOtp}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {step === "email" ? (
          <button
            type="button"
            disabled={loading || !email}
            onClick={sendOtp}
            className="btn-secondary w-full disabled:opacity-50"
          >
            {dict.admin.sendOtp}
          </button>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder={dict.admin.otpCode}
              className="input-field text-center tracking-widest"
            />
            <button type="submit" disabled={loading} className="btn-secondary w-full">
              {dict.admin.verifyOtp}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-xs text-muted hover:text-foreground"
            >
              {dict.admin.cancel}
            </button>
          </form>
        )}

        {message && <p className={`mt-4 text-sm ${messageColor}`}>{message}</p>}
        <p className="mt-4 text-xs leading-relaxed text-muted">{dict.admin.quickLoginHint}</p>
      </div>
    </div>
  );
}
