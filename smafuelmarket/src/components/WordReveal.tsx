"use client";

import type { ElementType } from "react";
import { useInView } from "@/lib/use-in-view";

/**
 * Reveals a headline one word at a time. Each word fades up from wide letter
 * spacing and a soft blur, then tightens into place, so the line appears to
 * resolve into focus rather than simply fade in.
 *
 * Newlines in `text` become hard line breaks, which keeps the carousel's
 * two-line headlines breaking where they were written.
 *
 * The words are plain text in the markup — the animation only styles what is
 * already there — so the heading is fully present for search engines and
 * screen readers, and stays legible if the animation never runs.
 */
export default function WordReveal({
  text,
  as: Tag = "span",
  className = "",
  delay = 0,
  stagger = 85,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  /** Delay before the first word, in milliseconds. */
  delay?: number;
  /** Gap between consecutive words, in milliseconds. */
  stagger?: number;
}) {
  const { ref, inView, armed } = useInView();

  const lines = text.split("\n").map((line) => line.split(/\s+/).filter(Boolean));
  let wordIndex = -1;

  return (
    <Tag ref={ref} className={className} data-shown={inView}>
      {lines.map((words, li) => (
        <span key={li} className="block">
          {words.map((word) => {
            wordIndex += 1;
            return (
              <span
                key={`${li}-${wordIndex}`}
                /* Before `armed`, no class at all — the word renders as plain
                   visible text, so a no-JS visitor still reads the headline. */
                className={!armed ? "" : inView ? "word-in" : "word-idle"}
                style={{ animationDelay: `${delay + wordIndex * stagger}ms` }}
              >
                {word}
                {/* A real space, so copy-paste and wrapping behave normally. */}
                {" "}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
