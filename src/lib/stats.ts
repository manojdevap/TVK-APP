import type { Gender, GenderStats, User } from "@/types";

export function genderBreakdown(items: { gender: Gender }[]): GenderStats {
  const male = items.filter((i) => i.gender === "male").length;
  const female = items.filter((i) => i.gender === "female").length;
  return { male, female, total: male + female };
}

export function ourVotesBreakdown(users: User[]): GenderStats {
  return genderBreakdown(users.filter((u) => u.isOurVote));
}
