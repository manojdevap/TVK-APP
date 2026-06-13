export type Gender = "male" | "female";

export type UserRole =
  | "ward_member"
  | "ward_organiser"
  | "ward_head"
  | "admin";

export type Department =
  | "electricity_board"
  | "revenue_board"
  | "corporation"
  | "water_board"
  | "police"
  | "other";

export type EventStatus = "planned" | "ongoing" | "completed" | "cancelled";

export type PetitionStatus = "submitted" | "in_progress" | "resolved" | "rejected";

export interface Ward {
  id: string;
  number: number;
  name: string;
  area: string;
  totalVoters: number;
  ourVotes: number;
  maleVoters: number;
  femaleVoters: number;
  headId: string;
  organiserId: string;
  memberIds: string[];
}

export interface User {
  id: string;
  username: string;
  address: string;
  voterId: string;
  wardId: string;
  role: UserRole;
  gender: Gender;
  phone?: string;
  isOurVote: boolean;
  avatarUrl?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  wardId: string;
  date: string;
  location: string;
  status: EventStatus;
  photos: string[];
  organiserId: string;
  participantIds: string[];
  invitedIds: string[];
}

export interface Petition {
  id: string;
  title: string;
  description: string;
  wardId: string;
  petitionerId: string;
  department: Department;
  status: PetitionStatus;
  submittedAt: string;
  photos: string[];
}

export interface GenderStats {
  male: number;
  female: number;
  total: number;
}
