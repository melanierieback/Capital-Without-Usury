import { useState, useEffect, useRef } from "react";
import { ChevronRight, ArrowRight, ArrowDown, Sun, Moon, ExternalLink } from "lucide-react";
import { book } from "../lib/book";
import type { Chapter } from "../types/book";
import { NecLogo } from "../components/NecLogo";
import { Search } from "../components/Search";
import coverImg from "@assets/capital-without-usury-cover.png";
import cosmicBg from "@assets/cosmic-grid-purple-background.png";

interface HomePageProps {
  onOpenReading: (chapterSlug: string, sectionSlug?: string) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

function chapterLabel(chapter: Chapter, idx: number, total: number): string {
  if (chapter.label) return chapter.label;
  if (idx === 0) return "Prologue";
  if (idx === total - 1) return "Conclusion";
  return `Chapter ${idx}`;
}

function chapterBadge(chapter: Chapter, idx: number, total: number) {
  const badge =
    chapter.badge ?? (idx === 0 ? "★" : idx === total - 1 ? "END" : String(idx));
  if (badge === "★") {
    return (
      <span
        className="shrink-0 flex items-center justify-center w-8 h-8 text-[13px] rounded"
        style={{
          background: "rgba(214,169,58,0.14)",
          border: "1px solid rgba(214,169,58,0.38)",
          color: "rgba(214,169,58,0.90)",
        }}
        aria-hidden="true"
      >
        ★
      </span>
    );
  }
  if (badge.length >= 3) {
    return (
      <span
        className="shrink-0 flex items-center justify-center w-8 h-8 text-[9px] font-sans font-bold tracking-wide rounded"
        style={{
          background: "rgba(214,169,58,0.10)",
          border: "1px solid rgba(214,169,58,0.28)",
          color: "rgba(214,169,58,0.72)",
        }}
        aria-hidden="true"
      >
        {badge}
      </span>
    );
  }
  return (
    <span
      className="shrink-0 flex items-center justify-center w-8 h-8 text-[12px] font-sans font-bold rounded"
      style={{
        background: "rgba(214,169,58,0.10)",
        border: "1px solid rgba(214,169,58,0.28)",
        color: "rgba(214,169,58,0.80)",
        fontVariantNumeric: "tabular-nums",
      }}
      aria-hidden="true"
    >
      {badge}
    </span>
  );
}

function PartHeading({ part }: { part: string }) {
  const [partNo, partTitle] = part.includes(" — ")
    ? [part.slice(0, part.indexOf(" — ")), part.slice(part.indexOf(" — ") + 3)]
    : [part, null];
  return (
    <div className="flex items-center gap-3 pt-7 pb-2 px-1">
      <span
        className="font-sans font-bold uppercase tracking-[0.22em] text-[10px] shrink-0"
        style={{ color: "rgba(214,169,58,0.80)" }}
      >
        {partNo}
      </span>
      {partTitle && (
        <span
          className="font-serif italic text-[12px] leading-snug"
          style={{ color: "rgba(226,210,180,0.60)" }}
        >
          {partTitle}
        </span>
      )}
      <div
        className="flex-1 h-px"
        style={{ background: "rgba(214,169,58,0.14)" }}
      />
    </div>
  );
}

export function HomePage({ onOpenReading, darkMode, onToggleDark }: HomePageProps) {
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);
  const [continueSlug, setContinueSlug] = useState<string | null>(null);
  const tocRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cwu-last-chapter");
      if (saved && book.chapters.find((c) => c.slug === saved)) {
        setContinueSlug(saved);
      }
    } catch { /* ignore */ }
  }, []);

  const continueChapter = continueSlug
    ? book.chapters.find((c) => c.slug === continueSlug)
    : null;

  const toggleExpand = (slug: string) => {
    setExpandedChapter((prev) => (prev === slug ? null : slug));
  };

  const isChapterExpanded = (slug: string) =>
    expandAll || expandedChapter === slug;

  const scrollToTOC = () => {
    tocRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSearchNavigate = (slug: string) => {
    const ch = book.chapters.find(
      (c) => c.slug === slug || c.sections.some((s) => s.slug === slug)
    );
    if (ch) onOpenReading(ch.slug, ch.slug !== slug ? slug : undefined);
  };

  const heroBg = {
    backgroundImage: [
      "linear-gradient(180deg, rgba(3,4,14,0.82) 0%, rgba(6,6,22,0.60) 45%, rgba(3,4,14,0.85) 100%)",
      `url(${cosmicBg})`,
    ].join(", "),
    backgroundSize: "cover",
    backgroundPosition: "center top",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#03040c", color: "#f0ede6" }}>

      {/* ── HERO SECTION ─────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col"
        style={heroBg}
      >
        {/* Header */}
        <header className="relative z-20 nec-header">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between gap-6">
            <NecLogo size="sm" />

            {/* Center nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Site navigation">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="px-4 py-2 text-[13px] font-sans font-semibold transition-colors rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30 relative"
                style={{ color: "#d6a93a" }}
              >
                Contents
                <span
                  className="absolute bottom-0 left-4 right-4 h-[2px]"
                  style={{ background: "rgba(214,169,58,0.70)" }}
                />
              </button>
              <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.10)" }} />
              <Search onNavigate={handleSearchNavigate} />
              <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />
              <button
                className="px-4 py-2 text-[13px] font-sans transition-colors rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30"
                style={{ color: "rgba(247,240,223,0.80)" }}
              >
                About
              </button>
              <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.07)" }} />
              <a
                href="https://melanierieback.github.io/NEC-Home-Small/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-4 py-2 text-[13px] font-sans transition-colors rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30"
                style={{ color: "rgba(247,240,223,0.80)" }}
              >
                NEC Home
                <ExternalLink size={10} />
              </a>
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              <span className="md:hidden">
                <Search onNavigate={handleSearchNavigate} />
              </span>
              <button
                onClick={onToggleDark}
                aria-label={darkMode ? "Switch to light reading mode" : "Switch to dark reading mode"}
                className="text-white/70 hover:text-white/90 transition-colors p-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30"
              >
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        </header>

        {/* Hero body — Cover LEFT, Info RIGHT */}
        <div className="relative z-10 flex flex-1 items-start">
          <div className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-12 md:pt-16 pb-12">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-10 lg:gap-20">

              {/* LEFT — Real book cover image */}
              <div
                className="shrink-0 w-[260px] sm:w-[320px] md:w-[380px] lg:w-[440px]"
              >
                <img
                  src={coverImg}
                  alt="Capital Without Usury book cover"
                  className="w-full h-auto rounded-lg"
                  style={{
                    border: "1px solid rgba(214,169,58,0.32)",
                    boxShadow: [
                      "0 24px 100px rgba(20,8,80,0.80)",
                      "0 6px 32px rgba(0,0,0,0.80)",
                      "0 0 80px rgba(214,169,58,0.06)",
                    ].join(", "),
                  }}
                />
              </div>

              {/* RIGHT — Book info */}
              <div className="flex-1 min-w-0 md:pt-6">
                <p
                  className="font-sans text-[11px] tracking-[0.30em] uppercase mb-5 font-semibold"
                  style={{ color: "rgba(214,169,58,0.65)" }}
                >
                  Working Manuscript
                </p>

                <h1
                  className="font-serif font-bold leading-tight tracking-tight mb-5"
                  style={{
                    fontSize: "clamp(2.6rem, 5vw, 4.2rem)",
                    color: "#f7f0df",
                    textShadow: "0 2px 32px rgba(0,0,0,0.55)",
                  }}
                >
                  {book.title}
                </h1>

                <p
                  className="font-serif italic leading-relaxed mb-5"
                  style={{
                    fontSize: "clamp(1.05rem, 1.9vw, 1.35rem)",
                    color: "rgba(226,197,104,0.72)",
                  }}
                >
                  {book.subtitle}
                </p>

                {/* Ornamental divider */}
                <div className="flex items-center gap-3 mb-6" aria-hidden="true">
                  <div className="flex-1 max-w-[90px] h-px" style={{ background: "rgba(214,169,58,0.28)" }} />
                  <span style={{ color: "rgba(214,169,58,0.55)", fontSize: "9px" }}>◆</span>
                  <div className="flex-1 max-w-[90px] h-px" style={{ background: "rgba(214,169,58,0.28)" }} />
                </div>

                <p
                  className="font-sans leading-relaxed mb-10 max-w-[500px]"
                  style={{ fontSize: "1.0rem", color: "rgba(235,228,210,0.76)" }}
                >
                  How Judaism, Christianity, and Islam disciplined money: usury, risk,
                  and partnership from Scripture to a working design for non-extractive
                  finance today.
                </p>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
                  {/* Primary — GOLD fill */}
                  <button
                    onClick={() => onOpenReading(book.chapters[0].slug)}
                    data-testid="button-start-reading"
                    className="inline-flex items-center gap-2 px-7 py-[14px] font-sans font-semibold text-[15px] rounded transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400/50"
                    style={{
                      background: "linear-gradient(135deg, #d6a93a 0%, #b08020 100%)",
                      color: "#0a0810",
                      boxShadow: "0 0 28px rgba(214,169,58,0.28), 0 4px 12px rgba(0,0,0,0.50)",
                      minWidth: "220px",
                    }}
                  >
                    Start with the {chapterLabel(book.chapters[0], 0, book.chapters.length)}
                    <ArrowRight size={15} />
                  </button>

                  {/* Secondary — gold outlined */}
                  <button
                    onClick={scrollToTOC}
                    className="inline-flex items-center gap-2 px-7 py-[13px] font-sans text-[15px] rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/30"
                    style={{
                      border: "1px solid rgba(214,169,58,0.40)",
                      color: "rgba(226,197,104,0.80)",
                      background: "rgba(214,169,58,0.06)",
                      minWidth: "220px",
                    }}
                  >
                    View Table of Contents
                    <ArrowDown size={14} />
                  </button>

                  {/* Continue */}
                  {continueChapter && continueChapter.slug !== book.chapters[0].slug && (
                    <button
                      onClick={() => onOpenReading(continueChapter.slug)}
                      className="inline-flex items-center gap-2 px-5 py-3 font-sans text-sm rounded transition-colors"
                      style={{
                        color: "rgba(214,169,58,0.68)",
                        border: "1px solid rgba(214,169,58,0.16)",
                        background: "rgba(214,169,58,0.04)",
                      }}
                    >
                      Continue: <span className="truncate max-w-[140px]">
                        {continueChapter.title.replace(/^Chapter \d+:\s*/, "")}
                      </span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="relative z-10 flex justify-center pb-8">
          <button
            onClick={scrollToTOC}
            aria-label="Scroll to Table of Contents"
            className="flex flex-col items-center gap-2 transition-opacity hover:opacity-75 focus-visible:outline-none"
            style={{ color: "rgba(214,169,58,0.68)" }}
          >
            <span className="font-sans text-[10px] tracking-[0.28em] uppercase">Contents</span>
            <ArrowDown size={13} className="animate-bounce" />
          </button>
        </div>
      </section>

      {/* ── TABLE OF CONTENTS ─────────────────────────────────────────── */}
      <section
        ref={tocRef}
        id="toc-section"
        className="nec-toc-bg px-5 sm:px-8 py-20 md:py-28"
        aria-label="Table of Contents"
      >
        <div className="max-w-4xl mx-auto">

          {/* Section header */}
          <div className="flex items-end justify-between mb-4">
            <h2
              className="font-sans font-bold uppercase tracking-[0.26em] text-sm"
              style={{ color: "rgba(214,169,58,0.75)" }}
            >
              Table of Contents
            </h2>
            <button
              onClick={() => setExpandAll((e) => !e)}
              className="font-sans text-[11px] flex items-center gap-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/25 rounded px-1"
              style={{ color: "rgba(214,169,58,0.78)" }}
            >
              {expandAll ? "Collapse all ↑" : "Expand all ↓"}
            </button>
          </div>

          {/* Gold ornamental divider */}
          <div className="flex items-center gap-3 mb-10" aria-hidden="true">
            <div
              className="flex-1 h-px"
              style={{ background: "linear-gradient(90deg, rgba(214,169,58,0.45) 0%, rgba(214,169,58,0.08) 70%, transparent 100%)" }}
            />
            <span style={{ color: "rgba(214,169,58,0.55)", fontSize: "9px" }}>◆</span>
            <div className="flex-1 max-w-[60px] h-px" style={{ background: "rgba(214,169,58,0.08)" }} />
          </div>

          {/* Chapter list */}
          <ol className="space-y-[3px]" role="list">
            {book.chapters.map((chapter, idx) => {
              const label = chapterLabel(chapter, idx, book.chapters.length);
              const shortTitle = chapter.title.replace(/^Chapter \d+:\s*/, "");
              const sections = chapter.sections.filter((s) => s.title);
              const isExpanded = isChapterExpanded(chapter.slug);
              const startsPart =
                chapter.part && chapter.part !== book.chapters[idx - 1]?.part
                  ? chapter.part
                  : null;

              return (
                <li key={chapter.slug} role="listitem">
                  {startsPart && <PartHeading part={startsPart} />}
                  <div
                    className="rounded-sm transition-all duration-150"
                    style={{
                      border: `1px solid ${isExpanded ? "rgba(214,169,58,0.18)" : "rgba(255,255,255,0.06)"}`,
                      background: isExpanded
                        ? "rgba(214,169,58,0.04)"
                        : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div className="flex items-center gap-3 px-3 py-0">
                      {/* Badge */}
                      <div className="shrink-0 py-3">
                        {chapterBadge(chapter, idx, book.chapters.length)}
                      </div>

                      {/* Label + title */}
                      <button
                        onClick={() => onOpenReading(chapter.slug)}
                        data-testid={`home-chapter-${chapter.slug}`}
                        className="flex-1 flex flex-col gap-[3px] py-3 text-left group focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/20 rounded min-w-0"
                      >
                        <span
                          className="text-[9px] font-sans uppercase tracking-[0.24em] font-semibold"
                          style={{ color: "rgba(214,169,58,0.78)" }}
                        >
                          {label}
                        </span>
                        <span
                          className="font-serif text-[0.95rem] leading-snug group-hover:text-white transition-colors"
                          style={{ color: "rgba(245,238,218,0.94)" }}
                        >
                          {shortTitle}
                        </span>
                      </button>

                      {/* Section count */}
                      {sections.length > 0 && (
                        <span
                          className="shrink-0 font-sans text-[10px] hidden sm:block tabular-nums"
                          style={{ color: "rgba(255,255,255,0.58)" }}
                        >
                          {sections.length} sections
                        </span>
                      )}

                      {/* Expand/arrow */}
                      <button
                        onClick={() => sections.length > 0 ? toggleExpand(chapter.slug) : onOpenReading(chapter.slug)}
                        aria-expanded={sections.length > 0 ? isExpanded : undefined}
                        className="shrink-0 p-2 rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/20"
                        style={{ color: "rgba(214,169,58,0.70)" }}
                        aria-label={
                          sections.length > 0
                            ? isExpanded ? "Collapse" : "Expand sections"
                            : `Open ${shortTitle}`
                        }
                      >
                        <ChevronRight
                          size={14}
                          className={`transition-transform duration-200 ${isExpanded && sections.length > 0 ? "rotate-90" : ""}`}
                        />
                      </button>
                    </div>

                    {/* Expanded sections */}
                    {isExpanded && sections.length > 0 && (
                      <div
                        className="pb-2 px-3 ml-[52px]"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        <ol className="space-y-0" role="list">
                          {sections.map((section) => (
                            <li key={section.slug} role="listitem">
                              <button
                                onClick={() => onOpenReading(chapter.slug, section.slug)}
                                data-testid={`home-section-${section.slug}`}
                                className="w-full text-left px-2 py-[6px] text-[0.78rem] font-sans rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/15 flex items-center gap-2 group"
                                style={{ color: "rgba(226,210,180,0.72)" }}
                              >
                                <span
                                  className="w-[3px] h-[3px] rounded-full shrink-0"
                                  style={{ background: "rgba(214,169,58,0.65)" }}
                                />
                                <span className="flex-1 leading-snug group-hover:text-white/90 transition-colors">
                                  {section.title}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Bottom link */}
          <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() =>
                onOpenReading(
                  (book.chapters.find((c) => c.label === "Conclusion") ??
                    book.chapters[book.chapters.length - 1]).slug
                )
              }
              className="flex items-center gap-1.5 font-sans text-[12px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/25 rounded"
              style={{ color: "rgba(214,169,58,0.78)" }}
            >
              {(() => {
                const n = book.chapters.filter((c) => c.label?.startsWith("Chapter")).length;
                return n > 0
                  ? `Skip ahead to the Conclusion (after ${n} chapters, two interludes, and six appendices)`
                  : `Continue through all ${book.chapters.length - 2} chapters and Conclusion`;
              })()}
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        className="px-5 sm:px-8 py-8"
        style={{ background: "#03040c", borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <NecLogo size="sm" />
          <p className="font-sans text-xs" style={{ color: "rgba(220,210,188,0.62)" }}>
            <span className="font-serif italic">{book.title}</span> — Working manuscript
          </p>
        </div>
      </footer>
    </div>
  );
}
