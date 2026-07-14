import { useRef, useState } from "react";
import { Link2 } from "lucide-react";
import type { Section, Subsection } from "../types/book";

interface ParagraphProps {
  html: string;
}

function Paragraph({ html }: ParagraphProps) {
  if (html.startsWith("<blockquote>")) {
    const inner = html.replace(/<\/?blockquote>/g, "");
    return (
      <blockquote
        className="border-l-[3px] border-primary/30 pl-5 my-7 text-muted-foreground italic font-serif leading-relaxed"
        dangerouslySetInnerHTML={{ __html: inner }}
      />
    );
  }
  if (html.startsWith("<ol") || html.startsWith("<ul")) {
    return (
      <div
        className="book-list font-serif text-[1.05rem] leading-[1.85] text-foreground my-5"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <p
      className="font-serif text-[1.05rem] leading-[1.85] text-foreground mb-0 [text-align:justify] [hyphens:auto]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

interface HeadingProps {
  id: string;
  title: string;
  level?: "section" | "subsection";
}

function SectionHeading({ id, title, level = "section" }: HeadingProps) {
  const [copied, setCopied] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (level === "subsection") {
    return (
      <h4
        id={id}
        ref={headingRef}
        className="group flex items-center gap-2 font-serif font-semibold text-lg text-foreground mt-10 mb-4 scroll-mt-24"
        data-testid={`heading-subsection-${id}`}
      >
        <span>{title}</span>
        <button
          onClick={copyLink}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
          title={copied ? "Copied!" : "Copy link"}
          data-testid={`copy-link-${id}`}
        >
          <Link2 size={14} />
        </button>
      </h4>
    );
  }

  return (
    <h3
      id={id}
      ref={headingRef}
      className="group flex items-center gap-2 font-serif font-semibold text-xl md:text-2xl text-foreground mt-14 mb-6 scroll-mt-24 tracking-tight"
      data-testid={`heading-section-${id}`}
    >
      <span>{title}</span>
      <button
        onClick={copyLink}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
        title={copied ? "Copied!" : "Copy link"}
        data-testid={`copy-link-${id}`}
      >
        <Link2 size={15} />
      </button>
    </h3>
  );
}

function SubsectionContent({ sub }: { sub: Subsection }) {
  return (
    <div className="mt-2">
      <SectionHeading id={sub.slug} title={sub.title} level="subsection" />
      <div className="book-content space-y-0">
        {sub.paragraphs.map((para, i) => (
          <Paragraph key={i} html={para} />
        ))}
      </div>
    </div>
  );
}

interface SectionContentProps {
  section: Section;
}

export function SectionContent({ section }: SectionContentProps) {
  return (
    <div className="section-block">
      {section.title && (
        <SectionHeading id={section.slug} title={section.title} />
      )}
      <div className="book-content space-y-0">
        {section.paragraphs.map((para, i) => (
          <Paragraph key={i} html={para} />
        ))}
      </div>
      {section.subsections && section.subsections.length > 0 && (
        <div>
          {section.subsections.map((sub) => (
            <SubsectionContent key={sub.slug} sub={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
