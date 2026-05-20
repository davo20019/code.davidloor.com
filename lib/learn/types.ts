export interface LearnGuideMeta {
  id: string;
  title: string;
  blurb: string;
  topics: string[];
  estMinutes: number;
  // Order on the index page. Lower numbers appear first.
  order: number;
}

export interface LearnGuide {
  type: "learn";
  meta: LearnGuideMeta;
  contentMarkdown: string;
}
