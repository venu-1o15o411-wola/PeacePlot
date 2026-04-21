

export type DiscoverChipId =
  | "all"
  | "books"
  | "video"
  | "image"
  | "music"
  | "movement"
  | "places"
  | "ai";

export type DiscoverModality =
  | "book"
  | "video"
  | "music"
  | "story"
  | "yoga"
  | "tai-chi"
  | "place"
  | "ai";

export type DiscoverItem = {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  modality: DiscoverModality;
  doctorBadge?: boolean;
  featured?: boolean;
};

export const DISCOVER_CHIPS: { id: DiscoverChipId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "books", label: "Books" },
  { id: "video", label: "Video" },
  { id: "image", label: "Images" },
  { id: "music", label: "Music" },
  { id: "movement", label: "Yoga & Tai Chi" },
  { id: "places", label: "Places" },
  { id: "ai", label: "AI advice" },
];

export const DISCOVER_ITEMS: DiscoverItem[] = [
  {
    id: "1",
    title: "Breathing Room",
    subtitle: "Short read · calm pacing for anxious days",
    duration: "12 min read",
    modality: "book",
    doctorBadge: true,
    featured: true,
  },
  {
    id: "2",
    title: "Ocean Light — wind-down visuals",
    subtitle: "Slow video · sound-off friendly captions",
    duration: "8 min",
    modality: "video",
    featured: true,
  },
  {
    id: "3",
    title: "Piano wash — focus loop",
    subtitle: "Audio · library playback (not measurement)",
    duration: "15 min",
    modality: "music",
    featured: true,
  },
  {
    id: "4",
    title: "The river road",
    subtitle: "Spoken story · narrative calm",
    duration: "22 min",
    modality: "story",
    doctorBadge: true,
    featured: true,
  },
  {
    id: "5",
    title: "Morning spine wake-up",
    subtitle: "Yoga · gentle movement",
    duration: "10 min",
    modality: "yoga",
  },
  {
    id: "6",
    title: "Tai Chi — cloud hands intro",
    subtitle: "Slow form · balance & breath",
    duration: "18 min",
    modality: "tai-chi",
  },
  {
    id: "7",
    title: "Quiet garden walk (local)",
    subtitle: "Places · greenspace · permission-gated in full build",
    duration: "Map + tips",
    modality: "place",
  },
  {
    id: "8",
    title: "Reframe the spike",
    subtitle: "AI advice · skills after check-ins",
    duration: "2 min read",
    modality: "ai",
  },
  {
    id: "9",
    title: "Letters to a Young Poet (excerpt)",
    subtitle: "Peaceful book · doctor-curated shelf",
    duration: "20 min read",
    modality: "book",
    doctorBadge: true,
  },
  {
    id: "10",
    title: "Body scan — seated",
    subtitle: "Guided audio story-style body scan",
    duration: "14 min",
    modality: "story",
  },
  {
    id: "11",
    title: "City overlook loop",
    subtitle: "B-roll + ambient · evening unwind",
    duration: "6 min",
    modality: "video",
  },
  {
    id: "12",
    title: "Micro-coach: tonight’s one step",
    subtitle: "AI advice · transparent, wellness-tier copy",
    duration: "1 min",
    modality: "ai",
  },
];

export function modalityMatchesChip(
  modality: DiscoverModality,
  chip: DiscoverChipId,
): boolean {
  if (chip === "all") return true;
  if (chip === "books") return modality === "book";
  if (chip === "video")
    return modality === "video" || modality === "story";
  if (chip === "image") return modality === "place";
  if (chip === "music") return modality === "music";
  if (chip === "movement")
    return modality === "yoga" || modality === "tai-chi";
  if (chip === "places") return modality === "place";
  if (chip === "ai") return modality === "ai";
  return false;
}

export function getDiscoverItem(id: string): DiscoverItem | undefined {
  return DISCOVER_ITEMS.find((x) => x.id === id);
}
