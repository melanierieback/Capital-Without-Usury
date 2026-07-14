#!/usr/bin/env python3
"""Build the reader's book.json from the Capital Without Usury draft chapters.

Usage:
    python3 tools/build_book_json.py /path/to/drafts

Reads the per-unit markdown drafts (ch00.md, ch01..ch45.md, int1.md, int2.md,
conc.md, appA..appF.md), strips each draft's provenance header (everything
through the second lone '---' line), and emits
artifacts/book-reader/src/data/book.json in the reader's schema:

    Book    { title, subtitle, chapters[] }
    Chapter { slug, title, label, badge, part?, sections[] }
    Section { slug, title|null, paragraphs[] }

Paragraphs are HTML strings (the reader renders them with
dangerouslySetInnerHTML): text is HTML-escaped, then markdown emphasis
(**bold**, *italic*), hyperlinks [text](url), and numbered lists are
converted to tags. Hyperlinks open in a new tab.

Slugs follow the same scheme as the Moral Economy reader
(chapter slug = slugified "label title"; section slug = chapter slug +
slugified section title; the unheaded opening of each unit gets "-intro").
Slugs are a stable contract for deep links: once published, do not rename.
"""
import json
import pathlib
import re
import sys
import unicodedata

# Reading order and Part divisions, mirroring the book's assemble.py exactly.
# ('part', title) entries start a new Part; ('unit', code) entries are drafts.
STRUCT = [
    ('unit', 'ch00'),
    ('part', 'Part I — The First Question: What Is Money Allowed to Do?'),
    ('unit', 'ch01'), ('unit', 'ch02'), ('unit', 'ch03'),
    ('part', 'Part II — Scriptural Fire: The Prohibition Before the Systems'),
    ('unit', 'ch04'), ('unit', 'ch05'), ('unit', 'ch06'),
    ('part', 'Part III — The Legal Grammar of Anti-Usury Finance'),
    ('unit', 'ch07'), ('unit', 'ch08'), ('unit', 'ch09'), ('unit', 'ch10'), ('unit', 'int1'),
    ('part', 'Part IV — Partnership as the Great Escape from Usury'),
    ('unit', 'ch11'), ('unit', 'ch12'), ('unit', 'ch13'), ('unit', 'ch14'),
    ('part', 'Part V — Cost Recovery, Mercy, and the Institutions of Non-Extractive Credit'),
    ('unit', 'ch15'), ('unit', 'ch16'), ('unit', 'ch17'), ('unit', 'ch18'), ('unit', 'int2'),
    ('part', 'Part VI — The Great Technical Debates'),
    ('unit', 'ch19'), ('unit', 'ch20'), ('unit', 'ch21'), ('unit', 'ch22'), ('unit', 'ch23'),
    ('part', 'Part VII — Instruments: How Contracts and Institutions Try to Escape Usury'),
    ('unit', 'ch24'), ('unit', 'ch25'), ('unit', 'ch26'), ('unit', 'ch27'), ('unit', 'ch28'), ('unit', 'ch29'),
    ('part', 'Part VIII — Modernity, Evasion, and the Return of Form Over Substance'),
    ('unit', 'ch30'), ('unit', 'ch31'), ('unit', 'ch32'), ('unit', 'ch33'), ('unit', 'ch34'),
    ('part', 'Part IX — Moral Mathematics: Making the Traditions Computable'),
    ('unit', 'ch35'), ('unit', 'ch36'), ('unit', 'ch37'), ('unit', 'ch38'), ('unit', 'ch39'), ('unit', 'ch40'),
    ('part', 'Part X — Institutions for the Future'),
    ('unit', 'ch41'), ('unit', 'ch42'), ('unit', 'ch43'), ('unit', 'ch44'), ('unit', 'ch45'),
    ('part', None),           # Conclusion stands outside the Parts
    ('unit', 'conc'),
    ('part', 'Appendices'),   # navigational grouping for the reader TOC
    ('unit', 'appA'), ('unit', 'appB'), ('unit', 'appC'), ('unit', 'appD'),
    ('unit', 'appE'), ('unit', 'appF'),
]

TITLE = "Capital Without Usury"
SUBTITLE = "Jewish, Christian, and Islamic Finance from Scripture to Non-Extractive Capital"

FENCE = re.compile(r'^---[ \t]*$')
ROMAN = {'int1': 'I', 'int2': 'II'}


def strip_header(text: str, name: str) -> str:
    """Drop lines 1..(2nd lone '---') inclusive; return the body."""
    lines = text.split('\n')
    seen = 0
    for i, ln in enumerate(lines):
        if FENCE.match(ln):
            seen += 1
            if seen == 2:
                return '\n'.join(lines[i + 1:])
    raise ValueError(f"{name}: closing provenance-header fence not found")


def slugify(text: str) -> str:
    t = unicodedata.normalize('NFKD', text)
    t = ''.join(c for c in t if not unicodedata.combining(c))
    t = t.lower()
    t = t.replace("’", "").replace("'", "")  # drop apostrophes: qur'an -> quran
    t = re.sub(r'[^a-z0-9]+', '-', t)
    return t.strip('-')


def esc(text: str) -> str:
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def inline_html(text: str) -> str:
    """Escape, then convert markdown links / bold / italics to HTML."""
    t = esc(text)
    # links first (URLs may contain * ); open external links in a new tab
    t = re.sub(
        r'\[([^\]]+)\]\((https?://[^)\s]+)\)',
        r'<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>',
        t,
    )
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t, flags=re.S)
    t = re.sub(r'\*(.+?)\*', r'<em>\1</em>', t, flags=re.S)
    return t


OL_ITEM = re.compile(r'^\s*(\d+)[.)]\s+(.*)$')


def block_to_paragraphs(block_lines):
    """Turn one blank-line-separated block into a list of HTML paragraph strings."""
    if all(OL_ITEM.match(ln) for ln in block_lines):
        items = []
        start = OL_ITEM.match(block_lines[0]).group(1)
        for ln in block_lines:
            items.append('<li>' + inline_html(OL_ITEM.match(ln).group(2)) + '</li>')
        start_attr = f' start="{start}"' if start != '1' else ''
        return [f'<ol{start_attr}>' + ''.join(items) + '</ol>']
    # ordinary prose: each source line is one paragraph
    return [inline_html(ln) for ln in block_lines]


def parse_unit(code: str, body: str, part_title):
    lines = body.strip('\n').split('\n')
    first = next(ln for ln in lines if ln.strip())
    if not (first.startswith('# ') and not first.startswith('## ')):
        raise ValueError(f"{code}: body does not start with an H1: {first!r}")
    h1 = first[2:].strip()

    # Split "Label — Short Title"
    if ' — ' in h1:
        label, short_title = h1.split(' — ', 1)
    else:
        label, short_title = h1, h1
    label = label.strip()
    short_title = short_title.strip()

    m = re.match(r'^Chapter (\d+)$', label)
    if m:
        badge = m.group(1)
    elif label == 'Preface':
        badge = 'PRE'
    elif label == 'Conclusion':
        badge = 'END'
    elif label.startswith('Comparative Interlude'):
        badge = ROMAN.get(code, label.split()[-1])
    elif label.startswith('Appendix'):
        badge = label.split()[-1]
    else:
        badge = '·'

    chapter_slug = slugify(f"{label} {short_title}")

    # Walk lines after the H1, splitting into sections at H2s
    sections = []
    cur_title = None
    cur_blocks = []
    cur_block = []

    def flush_block():
        nonlocal cur_block
        if cur_block:
            cur_blocks.append(cur_block)
            cur_block = []

    def flush_section():
        nonlocal cur_blocks, cur_title
        flush_block()
        paragraphs = []
        for b in cur_blocks:
            paragraphs.extend(block_to_paragraphs(b))
        if paragraphs or cur_title is not None:
            if cur_title is None:
                slug = f"{chapter_slug}-intro"
            else:
                slug = f"{chapter_slug}-{slugify(cur_title)}"
            sections.append({"slug": slug, "title": cur_title, "paragraphs": paragraphs})
        cur_blocks = []

    started = False
    for ln in lines:
        if not started:
            if ln.strip() == first.strip():
                started = True
            continue
        if ln.startswith('## '):
            flush_section()
            cur_title = ln[3:].strip()
            continue
        if ln.startswith('# '):
            raise ValueError(f"{code}: unexpected extra H1: {ln!r}")
        if not ln.strip():
            flush_block()
            continue
        cur_block.append(ln)
    flush_section()

    # de-duplicate section slugs within the chapter, if any repeat
    seen = {}
    for s in sections:
        base = s["slug"]
        if base in seen:
            seen[base] += 1
            s["slug"] = f"{base}-{seen[base]}"
        else:
            seen[base] = 1

    chapter = {
        "slug": chapter_slug,
        "title": short_title,
        "label": label,
        "badge": badge,
        "sections": sections,
    }
    if part_title:
        chapter["part"] = part_title
    return chapter


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: build_book_json.py /path/to/drafts")
    src = pathlib.Path(sys.argv[1])
    out = pathlib.Path(__file__).resolve().parent.parent / "artifacts/book-reader/src/data/book.json"

    chapters = []
    current_part = None
    for kind, val in STRUCT:
        if kind == 'part':
            current_part = val
            continue
        raw = (src / f"{val}.md").read_text(encoding='utf-8')
        n_fences = sum(1 for ln in raw.split('\n') if FENCE.match(ln))
        if n_fences != 2:
            raise ValueError(f"{val}: expected exactly 2 '---' fences, found {n_fences}")
        body = strip_header(raw, val)
        chapters.append(parse_unit(val, body, current_part))

    # global slug uniqueness check
    all_slugs = [c["slug"] for c in chapters] + [s["slug"] for c in chapters for s in c["sections"]]
    dupes = {s for s in all_slugs if all_slugs.count(s) > 1}
    if dupes:
        raise ValueError(f"duplicate slugs: {sorted(dupes)}")

    book = {"title": TITLE, "subtitle": SUBTITLE, "chapters": chapters}
    out.write_text(json.dumps(book, ensure_ascii=False, indent=2) + "\n", encoding='utf-8')

    n_sections = sum(len(c['sections']) for c in chapters)
    n_paras = sum(len(s['paragraphs']) for c in chapters for s in c['sections'])
    n_links = sum(s['paragraphs'].count('<a href=') if isinstance(s['paragraphs'], str)
                  else sum(p.count('<a href=') for p in s['paragraphs'])
                  for c in chapters for s in c['sections'])
    print(f"chapters: {len(chapters)}  sections: {n_sections}  paragraphs: {n_paras}  links: {n_links}")
    print(f"wrote {out} ({out.stat().st_size:,} bytes)")
    for c in chapters[:3] + chapters[-2:]:
        print(f"  {c['badge']:>3}  {c['label']} - {c['title']}  [{c['slug']}]  ({len(c['sections'])} sections)")


if __name__ == '__main__':
    main()
