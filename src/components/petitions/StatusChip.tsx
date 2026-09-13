import type { PetitionStatus } from "@/db/schema";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * Status carries colour as well as words: an organiser scanning a long queue needs
 * to see what is still open without reading every row.
 */
const styles: Record<PetitionStatus, string> = {
  submitted: "bg-yellow-soft text-maroon-dark",
  in_progress: "bg-blue-100 text-blue-900",
  resolved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-surface-sunk text-muted",
};

export function StatusChip({ status, dict }: { status: PetitionStatus; dict: Dictionary }) {
  return (
    <span className={`chip ${styles[status]}`}>{dict.petitionStatus[status]}</span>
  );
}
