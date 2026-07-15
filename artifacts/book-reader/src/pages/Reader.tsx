import { useState, useEffect, useRef, useCallback } from "react";
import { Menu, X, Sun, Moon, ArrowLeft, Bookmark, Search as SearchIcon } from "lucide-react";
import { book } from "../lib/book";
import { TOC } from "../components/TOC";
import { ChapterView } from "../components/ChapterView";
import { Search } from "../components/Search";
import { NecLogo } from "../components/NecLogo";

interface ReaderProps {
  initialChapterSlug: string;
  initialSectionSlug?: string;
  onGoHome: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const HEADER_H = 76;
const BOTTOM_NAV_H = 82;
const SIDEBAR_W = 300;

function useSectionScrollspy(chapterSlug: string) {
  const chapter = book.chapters.find((c) => c.slug === chapterSlug);
  const sectionSlugs = chapter
    ? chapter.sections.filter((s) => s.title).map((s) => s.slug)
    : [];
  const allSlugs = [chapterSlug, ...sectionSlugs];
  const [activeSlug, setActiveSlug] = useState<string>(chapterSlug);

  useEffect(() => {
    setActiveSlug(chapterSlug);
    const visibleMap = new Map<string, number>();
    const updateActive = () => {
      let best: string | null = null;
      let bestTop = Infinity;
      for (const [slug, top] of visibleMap.entries()) {
        if (top >= 0 && top < bestTop) { bestTop = top; best = slug; }
      }
      if (!best && visibleMap.size > 0) {
        let closestNeg = -Infinity;
        for (const [slug, top] of visibleMap.entries()) {
          if (top < 0 && top > closestNeg) { closestNeg = top; best = slug; }
        }
      }
      if (best) setActiveSlug(best);
    };
    const observers: IntersectionObserver[] = [];
    for (const slug of allSlugs) {
      const el = document.getElementById(slug);
      if (!el) continue;
      const obs = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            visibleMap.set(slug, entry.boundingClientRect.top);
            updateActive();
          }
        },
        { rootMargin: `-${HEADER_H + 16}px 0px -50% 0px`, threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    }
    return () => { for (const obs of observers) obs.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterSlug]);

  return activeSlug;
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? window.scrollY / total : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return progress;
}

export function Reader({ initialChapterSlug, initialSectionSlug, onGoHome, darkMode, onToggleDark }: ReaderProps) {
  const [currentChapterSlug, setCurrentChapterSlug] = useState(initialChapterSlug);
  const [mobileOpen, setMobileOpen] = useState(false);
  const didMount = useRef(false);

  const currentChapterIndex = book.chapters.findIndex((c) => c.slug === currentChapterSlug);
  const currentChapter = book.chapters[currentChapterIndex];
  const prevChapter = currentChapterIndex > 0 ? book.chapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < book.chapters.length - 1 ? book.chapters[currentChapterIndex + 1] : null;

  const activeSlug = useSectionScrollspy(currentChapterSlug);
  const scrollProgress = useScrollProgress();

  // Derived chapter/section progress
  const sectionSlugs = currentChapter?.sections.filter((s) => s.title).map((s) => s.slug) ?? [];
  const activeSecIdx = sectionSlugs.indexOf(activeSlug);
  const currentSecNum = activeSecIdx >= 0 ? activeSecIdx + 1 : 1;
  const totalSections = sectionSlugs.length;

  const chapterProgress = sectionSlugs.length > 0
    ? Math.max(0, activeSecIdx) / sectionSlugs.length + scrollProgress / sectionSlugs.length
    : scrollProgress;
  const overallPct = book.chapters.length > 0
    ? Math.round(((currentChapterIndex + chapterProgress) / book.chapters.length) * 100)
    : 0;

  const shortTitle = (title: string) => title.replace(/^Chapter \d+:\s*/, "");

  useEffect(() => {
    try { localStorage.setItem("cwu-last-chapter", currentChapterSlug); } catch { /* ignore */ }
  }, [currentChapterSlug]);

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentChapterSlug]);

  useEffect(() => {
    if (!initialSectionSlug) return;
    const attempt = (tries: number) => {
      const el = document.getElementById(initialSectionSlug);
      if (el) { el.scrollIntoView({ behavior: "instant", block: "start" }); }
      else if (tries > 0) { setTimeout(() => attempt(tries - 1), 150); }
    };
    setTimeout(() => attempt(5), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeSlug) return;
    const id = setTimeout(() => { history.replaceState(null, "", `#${activeSlug}`); }, 200);
    return () => clearTimeout(id);
  }, [activeSlug]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const goToChapter = useCallback((slug: string) => {
    setCurrentChapterSlug(slug);
    setMobileOpen(false);
  }, []);

  const scrollToSection = useCallback((slug: string) => {
    const el = document.getElementById(slug);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${slug}`);
    setMobileOpen(false);
  }, []);

  const handleSearchNavigate = useCallback((slug: string) => {
    const ch = book.chapters.find(c => c.slug === slug || c.sections.some(s => s.slug === slug));
    if (ch) { goToChapter(ch.slug); setTimeout(() => scrollToSection(slug), 200); }
  }, [goToChapter, scrollToSection]);

  const handleTocNavigate = useCallback((slug: string) => {
    const ch = book.chapters.find(c => c.slug === slug || c.sections.some(s => s.slug === slug));
    if (ch) {
      if (ch.slug !== currentChapterSlug) goToChapter(ch.slug);
      else scrollToSection(slug);
    }
  }, [currentChapterSlug, goToChapter, scrollToSection]);

  const activeTocSlug = activeSlug || currentChapterSlug;

  // Sidebar background
  const sidebarBg = "linear-gradient(180deg, rgba(7,11,28,0.99) 0%, rgba(3,4,12,0.99) 100%)";

  // Reading surface background
  const readingBg = darkMode
    ? "hsl(240 22% 8%)"
    : "linear-gradient(180deg, #f8f1e4 0%, #f2e8d5 100%)";
  const readingColor = darkMode ? "hsl(40 22% 88%)" : "#151923";

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#03040c" }}
    >
      {/* ── STICKY READING HEADER (full width, spans sidebar + content) ─ */}
      <header
        className="sticky top-0 z-40"
        style={{
          height: HEADER_H,
          background: "rgba(3,4,12,0.98)",
          borderBottom: "1px solid rgba(214,169,58,0.18)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center h-full px-5 md:px-7 gap-4">
          {/* Logo */}
          <NecLogo size="sm" className="shrink-0" href="https://melanierieback.github.io/NEC-Home-Small/index.html" />

          {/* ← Back to Contents (desktop) */}
          <button
            onClick={onGoHome}
            data-testid="button-back-home-desktop"
            className="hidden lg:flex items-center gap-1.5 font-sans font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30 rounded shrink-0"
            style={{ fontSize: 14, color: "#e2c568", marginLeft: 16 }}
          >
            <ArrowLeft size={14} />
            Back to Contents
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            <Search onNavigate={handleSearchNavigate} />
            <button
              aria-label="Bookmark (coming soon)"
              className="hidden sm:flex p-2 rounded opacity-30 cursor-default"
              style={{ color: "rgba(240,232,210,0.6)" }}
            >
              <Bookmark size={15} />
            </button>
            <button
              onClick={onToggleDark}
              className="p-2 rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30"
              aria-label={darkMode ? "Light mode" : "Dark mode"}
              data-testid="button-toggle-dark"
              style={{ color: "rgba(240,232,210,0.78)" }}
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            {/* Mobile: back to contents */}
            <button
              onClick={onGoHome}
              data-testid="button-back-home"
              className="lg:hidden flex items-center gap-1 font-sans font-semibold px-2 py-1.5 rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30"
              style={{ fontSize: 12, color: "#e2c568" }}
            >
              <ArrowLeft size={12} />
              <span className="hidden sm:inline">Contents</span>
            </button>
            {/* Mobile: TOC drawer */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/30"
              data-testid="button-open-toc"
              aria-label="Open chapter outline"
              style={{ color: "rgba(240,232,210,0.82)" }}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 backdrop-blur-sm"
            style={{ background: "rgba(3,4,14,0.80)" }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="relative flex flex-col w-72 max-w-[85vw] shadow-2xl"
            style={{ background: "#070b1c" }}
          >
            <div
              className="flex items-center justify-between px-4 h-14 shrink-0"
              style={{ borderBottom: "1px solid rgba(214,169,58,0.10)" }}
            >
              <button
                onClick={onGoHome}
                className="flex items-center gap-1.5 font-sans font-semibold transition-colors focus-visible:outline rounded"
                style={{ fontSize: 12, color: "#e2c568" }}
              >
                <ArrowLeft size={13} />
                Table of Contents
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded transition-colors"
                aria-label="Close"
                style={{ color: "rgba(240,232,210,0.72)" }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <TOC
                activeSlug={activeTocSlug}
                scrollProgress={chapterProgress}
                onNavigate={handleTocNavigate}
                onChapterNavigate={goToChapter}
                onGoHome={() => { setMobileOpen(false); onGoHome(); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP LAYOUT: sidebar (fixed) + reading content ─────────── */}

      {/* Fixed sidebar — desktop only */}
      <aside
        className="hidden lg:flex flex-col"
        style={{
          position: "fixed",
          top: HEADER_H,
          left: 0,
          width: SIDEBAR_W,
          height: `calc(100vh - ${HEADER_H}px - ${BOTTOM_NAV_H}px)`,
          background: sidebarBg,
          borderRight: "1px solid rgba(214,169,58,0.14)",
          zIndex: 30,
          overflowY: "auto",
        }}
        aria-label="Chapter navigation"
      >
        <TOC
          activeSlug={activeTocSlug}
          scrollProgress={chapterProgress}
          onNavigate={handleTocNavigate}
          onChapterNavigate={goToChapter}
          onGoHome={onGoHome}
        />
      </aside>

      {/* Reading content — offset by sidebar + padded for bottom nav */}
      <main
        id="main-content"
        style={{
          /* NB: margin-left must stay OUT of this inline style — an inline
             `marginLeft: 0` overrides the lg:ml-[300px] class and lets the
             fixed sidebar overlap the text at 1024–1360px widths. */
          paddingBottom: BOTTOM_NAV_H + 48,
          background: readingBg,
          color: readingColor,
          minHeight: `calc(100vh - ${HEADER_H}px)`,
        }}
        className="lg:ml-[300px]"
      >
        {/* Reading article */}
        <div
          className="mx-auto"
          style={{
            maxWidth: 780,
            padding: "64px 28px 48px",
          }}
        >
          <div style={{ paddingLeft: "clamp(0px, 5vw, 44px)", paddingRight: "clamp(0px, 5vw, 44px)" }}>
            {currentChapter && (
              <ChapterView
                chapter={currentChapter}
                chapterIndex={currentChapterIndex}
              />
            )}
          </div>
        </div>
      </main>

      {/* ── FIXED BOTTOM NAV ─────────────────────────────────────────── */}
      <nav
        aria-label="Chapter navigation"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: BOTTOM_NAV_H,
          zIndex: 30,
          background: darkMode ? "#0e1120" : "#f3e8d5",
          borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.07)" : "rgba(21,25,35,0.12)"}`,
          display: "grid",
          gridTemplateColumns: "1fr minmax(200px, 320px) 1fr",
          alignItems: "center",
          gap: 16,
          /* horizontal padding lives in the classes below — inline padding
             would override the lg: variants (same trap as the sidebar margin) */
        }}
        className="px-6 lg:pl-[324px] lg:pr-12"
      >
        {/* Previous */}
        <div className="justify-self-start">
          {prevChapter ? (
            <button
              onClick={() => goToChapter(prevChapter.slug)}
              data-testid={`nav-prev-${prevChapter.slug}`}
              className="group text-left flex flex-col gap-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded transition-opacity hover:opacity-80"
            >
              <span
                className="font-sans uppercase tracking-[0.14em] block"
                style={{ fontSize: 11, color: darkMode ? "#d3a94c" : "#8b6b22" }}
              >
                ← Previous
              </span>
              <span
                className="font-serif leading-snug hidden sm:block"
                style={{
                  fontSize: 14,
                  color: darkMode ? "rgba(240,232,210,0.92)" : "#151923",
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {shortTitle(prevChapter.title)}
              </span>
            </button>
          ) : (
            <div />
          )}
        </div>

        {/* Center: section progress */}
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="font-sans tabular-nums"
            style={{
              fontSize: 13,
              color: darkMode ? "rgba(240,232,210,0.88)" : "#151923",
            }}
          >
            {totalSections > 0
              ? `Section ${currentSecNum} of ${totalSections}`
              : `${overallPct}% complete`}
          </span>
          {/* Progress bar */}
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 3, background: darkMode ? "rgba(255,255,255,0.10)" : "rgba(21,25,35,0.14)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: totalSections > 0
                  ? `${Math.round((Math.max(0, activeSecIdx) / sectionSlugs.length) * 100)}%`
                  : `${overallPct}%`,
                background: "var(--nec-gold, #d6a93a)",
              }}
            />
          </div>
        </div>

        {/* Next */}
        <div className="justify-self-end">
          {nextChapter ? (
            <button
              onClick={() => goToChapter(nextChapter.slug)}
              data-testid={`nav-next-${nextChapter.slug}`}
              className="group text-right flex flex-col gap-0.5 items-end focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded transition-opacity hover:opacity-80"
            >
              <span
                className="font-sans uppercase tracking-[0.14em] block"
                style={{ fontSize: 11, color: darkMode ? "#d3a94c" : "#8b6b22" }}
              >
                Next →
              </span>
              <span
                className="font-serif leading-snug hidden sm:block"
                style={{
                  fontSize: 14,
                  color: darkMode ? "rgba(240,232,210,0.92)" : "#151923",
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {shortTitle(nextChapter.title)}
              </span>
            </button>
          ) : (
            <div />
          )}
        </div>
      </nav>
    </div>
  );
}
