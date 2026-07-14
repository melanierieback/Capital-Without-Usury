import { useState, useEffect } from "react";
import { book } from "@/lib/book";
import { HomePage } from "@/pages/HomePage";
import { Reader } from "@/pages/Reader";

type View = "home" | "reading";

function getInitialView(): { view: View; chapterSlug: string; sectionSlug?: string } {
  const hash = window.location.hash.slice(1);
  if (!hash) return { view: "home", chapterSlug: book.chapters[0]?.slug ?? "" };

  // Check if hash matches a chapter slug
  const chapterMatch = book.chapters.find((c) => c.slug === hash);
  if (chapterMatch) return { view: "reading", chapterSlug: chapterMatch.slug };

  // Check if hash matches a section slug
  for (const chapter of book.chapters) {
    const sectionMatch = chapter.sections.find((s) => s.slug === hash);
    if (sectionMatch) {
      return { view: "reading", chapterSlug: chapter.slug, sectionSlug: sectionMatch.slug };
    }
  }

  return { view: "home", chapterSlug: book.chapters[0]?.slug ?? "" };
}

export default function App() {
  const initial = getInitialView();
  const [view, setView] = useState<View>(initial.view);
  const [currentChapterSlug, setCurrentChapterSlug] = useState(initial.chapterSlug);
  const [currentSectionSlug, setCurrentSectionSlug] = useState<string | undefined>(initial.sectionSlug);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("cwu-dark-mode") === "true"; } catch { return false; }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("cwu-dark-mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("cwu-dark-mode", "false");
    }
  }, [darkMode]);

  const openReading = (chapterSlug: string, sectionSlug?: string) => {
    setCurrentChapterSlug(chapterSlug);
    setCurrentSectionSlug(sectionSlug);
    setView("reading");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const goHome = () => {
    setView("home");
    history.replaceState(null, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  if (view === "reading") {
    return (
      <Reader
        initialChapterSlug={currentChapterSlug}
        initialSectionSlug={currentSectionSlug}
        onGoHome={goHome}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((d) => !d)}
      />
    );
  }

  return (
    <HomePage
      onOpenReading={openReading}
      darkMode={darkMode}
      onToggleDark={() => setDarkMode((d) => !d)}
    />
  );
}
