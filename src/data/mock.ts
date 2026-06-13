import { sampleImages as img } from "@/config/samples";
import { municipality } from "@/config/municipality";
import type { Event, Petition, User, Ward } from "@/types";

const detailedWards: Record<number, Omit<Ward, "id" | "number">> = {
  1: {
    name: "Ward 1 — Nandhivaram",
    area: "Nandhivaram Main Road, Anna Nagar Extension",
    totalVoters: 3200,
    ourVotes: 1280,
    maleVoters: 1600,
    femaleVoters: 1600,
    headId: "user-1",
    organiserId: "user-2",
    memberIds: ["user-3", "user-4", "user-5"],
  },
  2: {
    name: "Ward 2 — Guduvancheri",
    area: "Guduvancheri Bus Stand, Railway Station Road",
    totalVoters: 4100,
    ourVotes: 1640,
    maleVoters: 2050,
    femaleVoters: 2050,
    headId: "user-6",
    organiserId: "user-7",
    memberIds: ["user-8", "user-9"],
  },
  3: {
    name: "Ward 3 — Perungalathur Border",
    area: "GST Road Vicinity, Industrial Workers Colony",
    totalVoters: 3800,
    ourVotes: 1520,
    maleVoters: 1900,
    femaleVoters: 1900,
    headId: "user-10",
    organiserId: "user-11",
    memberIds: ["user-12", "user-13", "user-14"],
  },
};

export const wards: Ward[] = Array.from({ length: municipality.wardCount }, (_, i) => {
  const number = i + 1;
  const detail = detailedWards[number];
  if (detail) {
    return { id: `ward-${number}`, number, ...detail };
  }
  return {
    id: `ward-${number}`,
    number,
    name: `Ward ${number}`,
    area: "",
    totalVoters: 0,
    ourVotes: 0,
    maleVoters: 0,
    femaleVoters: 0,
    headId: "",
    organiserId: "",
    memberIds: [],
  };
});

export const users: User[] = [
  {
    id: "user-1",
    username: "R. Murugan",
    address: "14, Nandhivaram Main Road, Ward 1",
    voterId: "TN/NG/2024/001234",
    wardId: "ward-1",
    role: "ward_head",
    gender: "male",
    phone: "9840123456",
    isOurVote: true,
    avatarUrl: img.avatars.murugan,
  },
  {
    id: "user-2",
    username: "K. Priya",
    address: "22, Anna Nagar Extension, Ward 1",
    voterId: "TN/NG/2024/001235",
    wardId: "ward-1",
    role: "ward_organiser",
    gender: "female",
    phone: "9840123457",
    isOurVote: true,
    avatarUrl: img.avatars.priya,
  },
  {
    id: "user-3",
    username: "S. Arun",
    address: "8, Temple Street, Ward 1",
    voterId: "TN/NG/2024/001236",
    wardId: "ward-1",
    role: "ward_member",
    gender: "male",
    isOurVote: true,
    avatarUrl: img.avatars.arun,
  },
  {
    id: "user-4",
    username: "M. Lakshmi",
    address: "31, Market Lane, Ward 1",
    voterId: "TN/NG/2024/001237",
    wardId: "ward-1",
    role: "ward_member",
    gender: "female",
    isOurVote: true,
    avatarUrl: img.avatars.lakshmi,
  },
  {
    id: "user-5",
    username: "V. Kumar",
    address: "5, Railway Colony, Ward 1",
    voterId: "TN/NG/2024/001238",
    wardId: "ward-1",
    role: "ward_member",
    gender: "male",
    isOurVote: false,
  },
  {
    id: "user-6",
    username: "P. Selvam",
    address: "18, Bus Stand Road, Ward 2",
    voterId: "TN/NG/2024/002101",
    wardId: "ward-2",
    role: "ward_head",
    gender: "male",
    isOurVote: true,
    avatarUrl: img.avatars.selvam,
  },
  {
    id: "user-7",
    username: "A. Deepa",
    address: "42, Guduvancheri High Road, Ward 2",
    voterId: "TN/NG/2024/002102",
    wardId: "ward-2",
    role: "ward_organiser",
    gender: "female",
    isOurVote: true,
    avatarUrl: img.avatars.deepa,
  },
  {
    id: "user-8",
    username: "G. Ravi",
    address: "7, School Street, Ward 2",
    voterId: "TN/NG/2024/002103",
    wardId: "ward-2",
    role: "ward_member",
    gender: "male",
    isOurVote: true,
  },
  {
    id: "user-9",
    username: "N. Meena",
    address: "19, Park Avenue, Ward 2",
    voterId: "TN/NG/2024/002104",
    wardId: "ward-2",
    role: "ward_member",
    gender: "female",
    isOurVote: false,
    avatarUrl: img.avatars.meena,
  },
  {
    id: "user-10",
    username: "D. Karthik",
    address: "55, GST Road, Ward 3",
    voterId: "TN/NG/2024/003001",
    wardId: "ward-3",
    role: "ward_head",
    gender: "male",
    isOurVote: true,
    avatarUrl: img.avatars.karthik,
  },
  {
    id: "user-11",
    username: "J. Anitha",
    address: "12, Workers Colony, Ward 3",
    voterId: "TN/NG/2024/003002",
    wardId: "ward-3",
    role: "ward_organiser",
    gender: "female",
    isOurVote: true,
    avatarUrl: img.avatars.anitha,
  },
  {
    id: "user-12",
    username: "B. Suresh",
    address: "31, Factory Lane, Ward 3",
    voterId: "TN/NG/2024/003003",
    wardId: "ward-3",
    role: "ward_member",
    gender: "male",
    isOurVote: true,
  },
  {
    id: "user-13",
    username: "H. Kavitha",
    address: "9, Union Office Road, Ward 3",
    voterId: "TN/NG/2024/003004",
    wardId: "ward-3",
    role: "ward_member",
    gender: "female",
    isOurVote: true,
    avatarUrl: img.avatars.kavitha,
  },
  {
    id: "user-14",
    username: "T. Mohan",
    address: "44, Industrial Estate, Ward 3",
    voterId: "TN/NG/2024/003005",
    wardId: "ward-3",
    role: "ward_member",
    gender: "male",
    isOurVote: false,
  },
];

export const events: Event[] = [
  {
    id: "event-1",
    title: "Ward 1 Voter Awareness Rally",
    description:
      "Door-to-door awareness on voter rights along Nandhivaram Main Road. TVK volunteers will distribute pamphlets, register grievances, and update our-vote contacts.",
    wardId: "ward-1",
    date: "2026-06-15",
    location: "Nandhivaram Main Road Ground",
    status: "planned",
    photos: [img.events.voterRally, img.events.rallyCrowd, img.events.doorToDoor],
    organiserId: "user-2",
    participantIds: ["user-1", "user-3", "user-4"],
    invitedIds: ["user-5"],
  },
  {
    id: "event-2",
    title: "Guduvancheri Community Meeting",
    description:
      "Monthly ward review: pending street-light petition, property tax errors, and corporation election preparedness. All ward members requested.",
    wardId: "ward-2",
    date: "2026-05-28",
    location: "Guduvancheri Community Hall",
    status: "completed",
    photos: [img.events.communityMeeting, img.events.meetingHall],
    organiserId: "user-7",
    participantIds: ["user-6", "user-7", "user-8", "user-9"],
    invitedIds: [],
  },
  {
    id: "event-3",
    title: "GST Road Labour Rights Camp",
    description:
      "Legal aid camp for factory workers near Perungalathur border. Revenue board and labour welfare representatives invited.",
    wardId: "ward-3",
    date: "2026-06-22",
    location: "Workers Colony Open Ground",
    status: "planned",
    photos: [img.events.labourCamp],
    organiserId: "user-11",
    participantIds: ["user-10", "user-12", "user-13"],
    invitedIds: ["user-14"],
  },
  {
    id: "event-4",
    title: "Nandhivaram Door-to-Door Membership Drive",
    description:
      "Weekend membership drive covering Anna Nagar Extension and Market Lane. Target: 200 new our-vote contacts.",
    wardId: "ward-1",
    date: "2026-06-08",
    location: "Ward 1 — starting at TVK booth",
    status: "ongoing",
    photos: [img.events.doorToDoor],
    organiserId: "user-1",
    participantIds: ["user-2", "user-3"],
    invitedIds: ["user-4", "user-5"],
  },
];

export const petitions: Petition[] = [
  {
    id: "petition-1",
    title: "Street Light Repair — Nandhivaram Main Road",
    description:
      "12 street lights non-functional for 3 months between Anna Nagar Extension and Market Lane. Safety risk for women and elderly after 7 PM.",
    wardId: "ward-1",
    petitionerId: "user-4",
    department: "electricity_board",
    status: "in_progress",
    submittedAt: "2026-04-10",
    photos: [img.petitions.streetLight],
  },
  {
    id: "petition-2",
    title: "Property Tax Double Assessment",
    description:
      "18 households in Ward 1 charged twice due to incorrect ward mapping in revenue records. Assessment numbers TN/NG/2019/4401–4418.",
    wardId: "ward-1",
    petitionerId: "user-3",
    department: "revenue_board",
    status: "submitted",
    submittedAt: "2026-05-02",
    photos: [img.petitions.propertyTax],
  },
  {
    id: "petition-3",
    title: "Drainage Overflow — Guduvancheri Bus Stand Area",
    description:
      "Storm water drain blocked near bus stand causing knee-deep flooding during monsoon. Corporation desilting needed before June rains.",
    wardId: "ward-2",
    petitionerId: "user-9",
    department: "corporation",
    status: "resolved",
    submittedAt: "2026-03-15",
    photos: [img.petitions.drainage],
  },
  {
    id: "petition-4",
    title: "Water Supply — Workers Colony",
    description:
      "Irregular water supply for 6 weeks. Pipeline leak near GST Road junction. Daily supply must be restored for 120+ families.",
    wardId: "ward-3",
    petitionerId: "user-13",
    department: "water_board",
    status: "in_progress",
    submittedAt: "2026-05-20",
    photos: [img.petitions.waterSupply],
  },
  {
    id: "petition-5",
    title: "GST Road Pothole Repair",
    description:
      "Major potholes on Perungalathur border stretch causing accidents. Highways department notified; ward petition for expedited repair.",
    wardId: "ward-3",
    petitionerId: "user-10",
    department: "corporation",
    status: "submitted",
    submittedAt: "2026-05-25",
    photos: [img.petitions.roadRepair],
  },
];

export function getWardById(id: string) {
  return wards.find((w) => w.id === id);
}

export function getUserById(id: string) {
  return users.find((u) => u.id === id);
}

export function getUsersByWard(wardId: string) {
  return users.filter((u) => u.wardId === wardId);
}

export function getEventsByWard(wardId: string) {
  return events.filter((e) => e.wardId === wardId);
}

export function getPetitionsByWard(wardId: string) {
  return petitions.filter((p) => p.wardId === wardId);
}

export function getEventById(id: string) {
  return events.find((e) => e.id === id);
}
