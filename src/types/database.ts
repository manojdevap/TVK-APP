export interface DbWard {
  id: string;
  number: number;
  name_en: string;
  name_ta: string;
  area_en: string;
  area_ta: string;
  total_voters: number;
  our_votes: number;
  male_voters: number;
  female_voters: number;
  head_id: string | null;
  organiser_id: string | null;
  municipality_slug: string;
}

export interface DbProfile {
  id: string;
  auth_user_id: string | null;
  username: string;
  address: string;
  voter_id: string | null;
  ward_id: string | null;
  role: "ward_member" | "ward_organiser" | "ward_head" | "admin";
  gender: "male" | "female";
  phone: string | null;
  is_our_vote: boolean;
  avatar_url: string | null;
}

export interface DbEvent {
  id: string;
  title_en: string;
  title_ta: string;
  description_en: string;
  description_ta: string;
  ward_id: string;
  event_date: string;
  location: string;
  status: "planned" | "ongoing" | "completed" | "cancelled";
  organiser_id: string | null;
  photos: string[];
}

export interface DbPetition {
  id: string;
  title_en: string;
  title_ta: string;
  description_en: string;
  description_ta: string;
  ward_id: string;
  petitioner_id: string | null;
  department: string;
  status: "submitted" | "in_progress" | "resolved" | "rejected";
  submitted_at: string;
  photos: string[];
}
