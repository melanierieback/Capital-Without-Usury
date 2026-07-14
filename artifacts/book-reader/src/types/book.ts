export interface Subsection {
  slug: string;
  title: string;
  paragraphs: string[];
}

export interface Section {
  slug: string;
  title: string | null;
  paragraphs: string[];
  subsections?: Subsection[];
}

export interface Chapter {
  slug: string;
  /** Short title without the unit label, e.g. "Sterile Gain and Living Exchange" */
  title: string;
  /** Unit label, e.g. "Preface", "Chapter 7", "Comparative Interlude I", "Appendix C" */
  label?: string;
  /** Short badge text for TOC chips, e.g. "PRE", "7", "I", "END", "C" */
  badge?: string;
  /** Part divider this unit falls under, e.g. "Part IV — Partnership as the Great Escape from Usury" */
  part?: string;
  sections: Section[];
}

export interface Book {
  title: string;
  subtitle: string;
  chapters: Chapter[];
}

export interface TocEntry {
  chapterSlug: string;
  chapterTitle: string;
  chapterIndex: number;
  sectionSlug: string | null;
  sectionTitle: string | null;
  sectionIndex: number | null;
}
