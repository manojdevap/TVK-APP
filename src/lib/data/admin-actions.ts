export async function checkIsAdmin(): Promise<boolean> {
  const res = await fetch("/api/admin/session", { credentials: "include" });
  if (!res.ok) return false;
  const data = (await res.json()) as { isAdmin: boolean };
  return data.isAdmin;
}
