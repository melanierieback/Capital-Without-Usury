import bookData from "../data/book.json";
import type { Book, Chapter, Section } from "../types/book";

export const book: Book = bookData as Book;

export function getChapterBySlug(slug: string): Chapter | undefined {
  return book.chapters.find((c) => c.slug === slug);
}

export function getChapterIndex(slug: string): number {
  return book.chapters.findIndex((c) => c.slug === slug);
}

export function getSectionBySlug(
  chapterSlug: string,
  sectionSlug: string
): Section | undefined {
  const chapter = getChapterBySlug(chapterSlug);
  return chapter?.sections.find((s) => s.slug === sectionSlug);
}

export function getAllSectionSlugs(): string[] {
  const slugs: string[] = [];
  for (const chapter of book.chapters) {
    slugs.push(chapter.slug);
    for (const section of chapter.sections) {
      if (section.title) {
        slugs.push(section.slug);
      }
    }
  }
  return slugs;
}
