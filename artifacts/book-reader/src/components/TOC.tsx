import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { book } from "../lib/book";

interface TOCProps {
  activeSlug: string;
  onNavigate?: (slug: string) => void;
  onChapterNavigate?: (slug: string) => void;
  onGoHome?: () => void;
  scrollProgress?: number;
}

function getActiveChapterSlug(activeSlug: string): string {
  const chapter = book.chapters.find(
    (ch) => ch.slug === activeSlug || ch.sections.some((s) => s.slug === activeSlug)
  );
  return chapter?.slug ?? "";
}

export function TOC({ activeSlug, onNavigate, onChapterNavigate, onGoHome, scrollProgress = 0 }: TOCProps) {
  const activeChapterSlug = getActiveChapterSlug(activeSlug);
  const [manualExpanded, setManualExpanded] = useState<Set<string>>(new Set());
  const [manualCollapsed, setManualCollapsed] = useState<Set<string>>(new Set());
  const activeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setManualCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(activeChapterSlug);
      return next;
    });
  }, [activeChapterSlug]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeSlug]);

  const isExpanded = useCallback(
    (chapterSlug: string) => {
      if (manualCollapsed.has(chapterSlug)) return false;
      if (manualExpanded.has(chapterSlug)) return true;
      return chapterSlug === activeChapterSlug;
    },
    [manualCollapsed, manualExpanded, activeChapterSlug]
  );

  const toggleChapter = useCallback((chapterSlug: string, currentlyExpanded: boolean) => {
    if (currentlyExpanded) {
      setManualCollapsed((prev) => new Set([...prev, chapterSlug]));
      setManualExpanded((prev) => { const n = new Set(prev); n.delete(chapterSlug); return n; });
    } else {
      setManualExpanded((prev) => new Set([...prev, chapterSlug]));
      setManualCollapsed((prev) => { const n = new Set(prev); n.delete(chapterSlug); return n; });
    }
  }, []);

  const scrollToSlug = useCallback(
    (slug: string) => {
      const el = document.getElementById(slug);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); history.replaceState(null, "", `#${slug}`); }
      onNavigate?.(slug);
    },
    [onNavigate]
  );

  const activeChapterIndex = book.chapters.findIndex((c) => c.slug === activeChapterSlug);
  const progressPct = book.chapters.length > 0
    ? Math.round(((activeChapterIndex + scrollProgress) / book.chapters.length) * 100)
    : 0;

  return (
    <nav
      className="flex flex-col h-full"
      aria-label="Table of contents"
      data-testid="toc-nav"
      style={{ color: "#f7f0df" }}
    >
      {/* Progress block */}
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-baseline justify-between mb-2">
          <p style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#f7f0df", fontFamily: "var(--app-font-sans, sans-serif)", margin: 0 }}>
            {progressPct}% Complete
          </p>
        </div>
        {/* Purple → gold gradient progress bar */}
        <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.12)", borderRadius: 2, overflow: "hidden" }}>
          <div
            style={{
              height: 3,
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #8b5cff, #d6a93a)",
              transition: "width 0.7s ease",
            }}
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Reading progress: ${progressPct}%`}
          />
        </div>

        {/* CONTENTS OUTLINE label */}
        <p style={{ marginTop: 28, marginBottom: 4, fontSize: 11, letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(247,240,223,0.72)", fontFamily: "var(--app-font-sans, sans-serif)" }}>
          Contents Outline
        </p>
        <div style={{ height: 1, background: "rgba(214,169,58,0.12)", marginBottom: 4 }} />
      </div>

      {/* Chapter list */}
      <ol className="flex-1 overflow-y-auto py-1 px-3 space-y-0" role="list">
        {book.chapters.map((chapter, chIdx) => {
          const isActive = activeSlug === chapter.slug;
          const isChapterInView = activeChapterSlug === chapter.slug;
          const expanded = isExpanded(chapter.slug);
          const hasSections = chapter.sections.filter((s) => s.title).length > 0;
          const chapterTitle = chapter.title.replace(/^Chapter \d+:\s*/, "") || chapter.title;
          const startsPart =
            chapter.part && chapter.part !== book.chapters[chIdx - 1]?.part
              ? chapter.part
              : null;
          const partNo = startsPart?.includes(" — ")
            ? startsPart.slice(0, startsPart.indexOf(" — "))
            : startsPart;

          return (
            <li key={chapter.slug} role="listitem">
              {startsPart && (
                <div
                  className="flex items-center gap-2 pt-4 pb-1 pl-[22px] pr-2"
                  title={startsPart}
                >
                  <span
                    className="font-sans font-bold uppercase tracking-[0.18em] text-[9px] shrink-0"
                    style={{ color: "rgba(214,169,58,0.72)" }}
                  >
                    {partNo}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(214,169,58,0.14)" }} />
                </div>
              )}
              <div className="flex items-center gap-0.5">
                {hasSections ? (
                  <button
                    onClick={() => toggleChapter(chapter.slug, expanded)}
                    aria-expanded={expanded}
                    aria-label={expanded ? `Collapse ${chapter.title}` : `Expand ${chapter.title}`}
                    className="shrink-0 p-1 rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/20"
                    style={{ color: isChapterInView ? "rgba(247,240,223,0.85)" : "rgba(247,240,223,0.50)" }}
                    data-testid={`toc-toggle-${chapter.slug}`}
                  >
                    <ChevronRight
                      size={10}
                      className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                    />
                  </button>
                ) : (
                  <span className="w-[22px] shrink-0" />
                )}

                {isChapterInView && (
                  <span
                    className="shrink-0 text-[9px] font-sans font-bold uppercase tracking-[0.20em] mr-1 hidden xl:block"
                    style={{ color: "rgba(214,169,58,0.80)" }}
                  >
                    {chapter.badge ?? (chIdx === 0 ? "PRO" : chIdx === book.chapters.length - 1 ? "END" : chIdx)}
                  </span>
                )}

                <button
                  ref={isActive ? (activeRef as React.RefObject<HTMLButtonElement>) : undefined}
                  onClick={() => onChapterNavigate ? onChapterNavigate(chapter.slug) : scrollToSlug(chapter.slug)}
                  data-testid={`toc-chapter-${chapter.slug}`}
                  aria-current={isActive ? "location" : undefined}
                  className="flex-1 text-left px-2 py-[7px] rounded text-[0.73rem] font-sans leading-snug transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/25 focus-visible:outline-offset-1"
                  style={{
                    color: isActive
                      ? "#d6a93a"
                      : isChapterInView
                      ? "#f7f0df"
                      : "rgba(247,240,223,0.78)",
                    fontWeight: isActive ? 600 : isChapterInView ? 500 : 400,
                  }}
                >
                  {chapterTitle}
                </button>
              </div>

              {/* Section list */}
              {expanded && hasSections && (
                <ol
                  className="mt-0.5 mb-1 ml-5 space-y-0"
                  style={{ borderLeft: "1px solid rgba(214,169,58,0.18)", paddingLeft: 14 }}
                  role="list"
                >
                  {chapter.sections
                    .filter((s) => s.title)
                    .map((section) => {
                      const isSectionActive = activeSlug === section.slug;
                      return (
                        <li key={section.slug} role="listitem">
                          <button
                            ref={isSectionActive ? (activeRef as React.RefObject<HTMLButtonElement>) : undefined}
                            onClick={() => scrollToSlug(section.slug)}
                            data-testid={`toc-section-${section.slug}`}
                            aria-current={isSectionActive ? "location" : undefined}
                            className="w-full text-left py-[7px] rounded text-[0.68rem] font-sans leading-snug transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/20 focus-visible:outline-offset-1"
                            style={{
                              color: isSectionActive
                                ? "#d6a93a"
                                : "rgba(247,240,223,0.78)",
                              fontWeight: isSectionActive ? 600 : 400,
                              borderLeft: isSectionActive ? "2px solid #d6a93a" : "2px solid transparent",
                              paddingLeft: isSectionActive ? 10 : 0,
                              marginLeft: isSectionActive ? -2 : 0,
                              transition: "all 0.15s ease",
                            }}
                          >
                            {section.title}
                          </button>
                        </li>
                      );
                    })}
                </ol>
              )}
            </li>
          );
        })}
      </ol>

      {/* View Full Contents button */}
      {onGoHome && (
        <div className="shrink-0 px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={onGoHome}
            className="w-full flex items-center justify-center gap-2 font-sans uppercase tracking-[0.14em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/25 rounded"
            style={{
              fontSize: 11,
              height: 44,
              border: "1px solid rgba(214,169,58,0.28)",
              background: "rgba(255,255,255,0.03)",
              color: "#f7f0df",
            }}
          >
            View Full Contents
          </button>
        </div>
      )}
    </nav>
  );
}
