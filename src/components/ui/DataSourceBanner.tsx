import type { Dictionary } from "@/i18n/dictionaries/en";
import type { DataSource } from "@/lib/data/queries";

export function DataSourceBanner({
  source,
  dict,
}: {
  source: DataSource;
  dict: Dictionary;
}) {
  if (source === "supabase") {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-tvk-maroon/15 bg-tvk-yellow/10 px-4 py-2.5 text-sm text-tvk-maroon-dark">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        {dict.dataSource.liveBanner}
      </div>
    );
  }

  if (source === "demo") {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
        {dict.dataSource.demoBanner}
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
      {dict.dataSource.mockBanner}
    </div>
  );
}
