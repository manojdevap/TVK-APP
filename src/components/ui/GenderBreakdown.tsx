import type { GenderStats } from "@/types";

export function GenderBreakdown({
  title,
  stats,
  maleLabel = "Male",
  femaleLabel = "Female",
}: {
  title: string;
  stats: GenderStats;
  maleLabel?: string;
  femaleLabel?: string;
}) {
  const malePct = stats.total ? Math.round((stats.male / stats.total) * 100) : 0;
  const femalePct = stats.total ? Math.round((stats.female / stats.total) * 100) : 0;

  return (
    <div className="card">
      <p className="text-sm font-medium text-muted">{title}</p>
      <p className="mt-2 text-2xl font-bold text-tvk-maroon-dark">{stats.total}</p>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-background">
        <div
          className="bg-tvk-maroon"
          style={{ width: `${malePct}%` }}
          title={`${maleLabel}: ${stats.male}`}
        />
        <div
          className="bg-tvk-yellow"
          style={{ width: `${femalePct}%` }}
          title={`${femaleLabel}: ${stats.female}`}
        />
      </div>
      <div className="mt-3 flex flex-col gap-1 text-xs text-muted sm:flex-row sm:justify-between">
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-tvk-maroon" />
          {maleLabel} {stats.male} ({malePct}%)
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-tvk-yellow" />
          {femaleLabel} {stats.female} ({femalePct}%)
        </span>
      </div>
    </div>
  );
}
