import Link from "next/link";

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="card flex flex-col items-center gap-2 py-10 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {body && <p className="max-w-xs text-sm text-muted">{body}</p>}
      {action && (
        <Link href={action.href} className="btn-primary mt-3">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-maroon-dark">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
      {children}
    </p>
  );
}
