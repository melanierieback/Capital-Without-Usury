import type { Chapter } from "../types/book";
import { SectionContent } from "./SectionContent";
import { book } from "../lib/book";

interface ChapterViewProps {
  chapter: Chapter;
  chapterIndex: number;
}

function OrnamentalDivider() {
  return (
    <div className="flex items-center gap-0 my-7" aria-hidden="true">
      <div
        className="flex-1 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(163,122,34,0.45), rgba(163,122,34,0.95) 50%, rgba(163,122,34,0.45), transparent)",
          maxWidth: 520,
        }}
      />
    </div>
  );
}

export function ChapterView({ chapter, chapterIndex }: ChapterViewProps) {
  const shortTitle = (title: string) => title.replace(/^Chapter \d+:\s*/, "");

  const chapterLabel = () => {
    if (chapter.label) return chapter.label;
    if (chapterIndex === 0) return "Prologue";
    if (chapterIndex === book.chapters.length - 1) return "Conclusion";
    return `Chapter ${chapterIndex}`;
  };

  return (
    <article
      aria-labelledby={`chapter-heading-${chapter.slug}`}
      data-testid={`chapter-${chapter.slug}`}
    >
      {/* Chapter heading */}
      <header id={chapter.slug} className="scroll-mt-[80px] mb-10 md:mb-12">
        <p
          className="font-sans font-semibold uppercase tracking-[0.22em] mb-4 select-none"
          style={{ fontSize: 12, color: "#a37a22" }}
        >
          {chapterLabel()}
        </p>

        <h2
          id={`chapter-heading-${chapter.slug}`}
          className="font-serif font-medium leading-tight tracking-tight"
          style={{
            fontSize: "clamp(2.1rem, 4vw, 3.2rem)",
            color: "#111722",
            margin: 0,
          }}
        >
          {shortTitle(chapter.title)}
        </h2>

        <OrnamentalDivider />
      </header>

      {/* Sections */}
      <div>
        {chapter.sections.map((section) => (
          <SectionContent key={section.slug} section={section} />
        ))}
      </div>
    </article>
  );
}
