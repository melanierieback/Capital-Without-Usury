import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search as SearchIcon, X, ArrowRight } from "lucide-react";
import { book } from "../lib/book";

interface SearchItem {
  id: string;
  chapterSlug: string;
  chapterTitle: string;
  sectionSlug: string | null;
  sectionTitle: string | null;
  text: string;
  type: "chapter" | "section" | "paragraph";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&mdash;/g, "—").replace(/\s+/g, " ").trim();
}

function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];
  for (const chapter of book.chapters) {
    const displayTitle = chapter.label ? `${chapter.label} · ${chapter.title}` : chapter.title;
    items.push({
      id: chapter.slug,
      chapterSlug: chapter.slug,
      chapterTitle: displayTitle,
      sectionSlug: null,
      sectionTitle: null,
      text: `${chapter.label ?? ""} ${chapter.title}`.trim().toLowerCase(),
      type: "chapter",
    });
    for (const section of chapter.sections) {
      if (section.title) {
        items.push({
          id: section.slug,
          chapterSlug: chapter.slug,
          chapterTitle: displayTitle,
          sectionSlug: section.slug,
          sectionTitle: section.title,
          text: section.title.toLowerCase(),
          type: "section",
        });
      }
      for (let i = 0; i < section.paragraphs.length; i++) {
        const plain = stripHtml(section.paragraphs[i]);
        if (plain.length < 20) continue;
        items.push({
          id: `${section.slug}-p${i}`,
          chapterSlug: chapter.slug,
          chapterTitle: displayTitle,
          sectionSlug: section.slug,
          sectionTitle: section.title,
          text: plain.toLowerCase(),
          type: "paragraph",
        });
      }
    }
  }
  return items;
}

interface SearchResult {
  item: SearchItem;
  snippet: string;
  matchStart: number;
}

function getSnippet(text: string, query: string, maxLen = 160): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? "…" : "");
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + query.length + 100);
  let snippet = (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  return snippet;
}

function highlightSnippet(snippet: string, query: string): string {
  if (!query) return snippet;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return snippet.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
}

interface SearchProps {
  onNavigate?: (slug: string) => void;
}

export function Search({ onNavigate }: SearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedRef = useRef<HTMLLIElement>(null);

  const index = useMemo(() => buildSearchIndex(), []);

  const results = useMemo((): SearchResult[] => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.trim().toLowerCase();
    const seen = new Set<string>();
    const matches: SearchResult[] = [];

    for (const item of index) {
      if (item.text.includes(q)) {
        const key = item.sectionSlug ?? item.chapterSlug;
        if (item.type === "paragraph" && seen.has(key)) continue;
        if (item.type === "paragraph") seen.add(key);

        const displayText = item.type === "paragraph"
          ? item.text
          : item.text;
        const snippet = getSnippet(item.type === "paragraph" ? item.text : item.text, q);
        matches.push({ item, snippet, matchStart: item.text.indexOf(q) });

        if (matches.length >= 30) break;
      }
    }

    // Sort: title matches first, then by match position
    matches.sort((a, b) => {
      const aIsTitle = a.item.type !== "paragraph";
      const bIsTitle = b.item.type !== "paragraph";
      if (aIsTitle && !bIsTitle) return -1;
      if (!aIsTitle && bIsTitle) return 1;
      return a.matchStart - b.matchStart;
    });

    return matches.slice(0, 12);
  }, [query, index]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const openSearch = useCallback(() => {
    setOpen(true);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const goToResult = useCallback((result: SearchResult) => {
    const targetSlug = result.item.sectionSlug ?? result.item.chapterSlug;
    const el = document.getElementById(targetSlug);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    closeSearch();
    onNavigate?.(targetSlug);
  }, [closeSearch, onNavigate]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) closeSearch();
        else openSearch();
      }
      if (e.key === "Escape" && open) closeSearch();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, openSearch, closeSearch]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) goToResult(results[selectedIndex]);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openSearch}
        data-testid="button-open-search"
        aria-label="Search (Ctrl+K)"
        className="flex items-center gap-1.5 text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors text-[11px] font-sans"
        title="Search (⌘K)"
      >
        <SearchIcon size={13} />
        <span className="hidden xl:inline">Search</span>
        <kbd className="hidden xl:inline text-[9px] opacity-50 bg-sidebar-accent/40 px-1 py-0.5 rounded">⌘K</kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeSearch}
          />

          {/* Panel */}
          <div className="relative w-full max-w-xl bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <SearchIcon size={16} className="text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search chapters, sections, and text…"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 text-sm font-sans outline-none"
                data-testid="input-search"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
              <kbd
                className="text-[10px] text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded font-sans"
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            {results.length > 0 ? (
              <ul
                ref={listRef}
                role="listbox"
                className="max-h-[60vh] overflow-y-auto py-2"
                data-testid="search-results"
              >
                {results.map((result, i) => (
                  <li
                    key={result.item.id}
                    ref={i === selectedIndex ? selectedRef : undefined}
                    role="option"
                    aria-selected={i === selectedIndex}
                  >
                    <button
                      onClick={() => goToResult(result)}
                      data-testid={`search-result-${i}`}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                        i === selectedIndex
                          ? "bg-accent/60"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <ArrowRight
                        size={13}
                        className={`mt-0.5 shrink-0 ${i === selectedIndex ? "text-primary" : "text-muted-foreground/30"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          {result.item.type !== "paragraph" ? (
                            <span className="text-[11px] uppercase tracking-wide text-primary/70 font-sans font-medium">
                              {result.item.type === "chapter" ? "Chapter" : "Section"}
                            </span>
                          ) : (
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground/50 font-sans">
                              {result.item.chapterTitle.replace(/^Chapter \d+:\s*/, "")}
                              {result.item.sectionTitle && ` › ${result.item.sectionTitle}`}
                            </span>
                          )}
                        </div>
                        {result.item.type !== "paragraph" ? (
                          <p
                            className="text-sm font-sans text-foreground leading-snug"
                            dangerouslySetInnerHTML={{
                              __html: highlightSnippet(
                                result.item.type === "chapter" ? result.item.chapterTitle : result.item.sectionTitle ?? "",
                                query
                              ),
                            }}
                          />
                        ) : (
                          <p
                            className="text-[0.8rem] text-muted-foreground font-sans leading-relaxed line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: highlightSnippet(result.snippet, query),
                            }}
                          />
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.length >= 2 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground font-sans">
                No results for <strong className="text-foreground">"{query}"</strong>
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground font-sans">
                Type to search across all {book.chapters.length} chapters
              </div>
            )}

            {/* Footer hint */}
            {results.length > 0 && (
              <div className="px-4 py-2 border-t border-border flex items-center gap-3 text-[10px] text-muted-foreground/50 font-sans">
                <span><kbd>↑↓</kbd> navigate</span>
                <span><kbd>↵</kbd> go</span>
                <span><kbd>ESC</kbd> close</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
