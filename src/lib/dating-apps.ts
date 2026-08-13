export const DATING_APPS = [
  "Hinge",
  "Match",
  "eharmony",
  "Tinder",
  "Bumble",
  "OkCupid",
  "Facebook Dating",
  "Coffee Meets Bagel",
  "happn",
  "The League",
  "Grindr",
  "HER",
  "SilverSingles",
  "Feeld",
  "BLK",
  "Plenty of Fish",
  "Other",
  "Prefer not to say",
  "I'm not using a dating platform yet",
] as const;

export type DatingApp = (typeof DATING_APPS)[number];

export const CONNECTION_STAGES = [
  { value: "new_match", label: "New match" },
  { value: "messaging", label: "Messaging" },
  { value: "planning_first_date", label: "Planning a first date" },
  { value: "first_date_scheduled", label: "First date scheduled" },
  { value: "casually_dating", label: "Casually dating" },
  { value: "exclusively_dating", label: "Exclusively dating" },
  { value: "in_relationship", label: "In a relationship" },
  { value: "paused", label: "Paused" },
  { value: "ended", label: "Ended" },
  { value: "unsure", label: "Unsure" },
] as const;

export const MOODS = [
  "Hopeful",
  "Excited",
  "Calm",
  "Confused",
  "Anxious",
  "Disappointed",
  "Frustrated",
  "Hurt",
  "Relieved",
  "Proud",
  "Neutral",
] as const;
