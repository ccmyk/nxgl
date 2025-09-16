// src/components/Write.tsx
"use client";

import React, { ReactNode, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Utility to split text into lines, words, chars
function splitText(text: string) {
  const lines = text.split(/\r?\n/).map((line) => {
    const words = line.split(/(\s+)/).map((word) => {
      const chars = word.split("").map((char) => ({ char }));
      return { word, chars };
    });
    return { line, words };
  });
  return lines;
}

type Variant = "write" | "text" | "line";

type Props = {
  as?: keyof JSX.IntrinsicElements;
  variant?: Variant;
  children: ReactNode;
  className?: string;
  inverse?: boolean;
  loop?: boolean;
  delay?: number;
  mode?: number;
  msTighter?: boolean;
  renderChar?: (char: string, i: number) => ReactNode;
  renderWord?: (word: string, i: number) => ReactNode;
  renderLine?: (line: string, i: number) => ReactNode;
};

const FAKE_CHARS = "##·$%&/=€|()@+09*+]}{[";
const TIMES_BASE = [0.3, 0.05, 0.16, 0.05, 0.016] as const;
const TIMES_MS = [0.22, 0.05, 0.16, 0.05, 0.016] as const;

export default function Write({
  as: Tag = "span",
  variant = "write",
  children,
  className,
  inverse,
  loop,
  delay = 0,
  mode = 3,
  msTighter = false,
  renderChar,
  renderWord,
  renderLine,
}: Props) {
  // Only support string children for splitting
  const text = typeof children === "string" ? children : "";
  const lines = splitText(text);

  // Special handling for Atext: recursively render Write for each line
  if (variant === "text") {
    return (
      <Tag
        className={["Atext", inverse ? "Atext-inv" : undefined, className].filter(Boolean).join(" ")}
        aria-label={text}
      >
        {lines.map((line, lIdx) => (
          <Write
            key={lIdx}
            as="div"
            variant="line"
            className="line"
            inverse={inverse}
            delay={delay + lIdx * 0.15} // Stagger the line animations
            msTighter={msTighter}
            renderLine={renderLine}
          >
            {line.line}
          </Write>
        ))}
      </Tag>
    );
  }

  // Refs for animation
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const lineRefs = useRef<Array<HTMLDivElement | null>>([]);
  const containerRef = useRef<HTMLElement>(null);

  // Animation effect
  useEffect(() => {
    if (!text || typeof window === "undefined" || !containerRef.current) return;

    const times = msTighter ? TIMES_MS : TIMES_BASE;

    // Use a single timeline with a ScrollTrigger
    const tl = gsap.timeline({
      paused: true,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%", // When the top of the trigger hits 85% of the viewport
        toggleActions: "play none none none", // Play once on enter
      },
      onComplete: () => {
        if (loop) {
          tl.restart();
        }
      },
    });

    if (variant === "line") {
      const lines = lineRefs.current.filter(Boolean);
      if (lines.length > 0) {
        tl.fromTo(
          lines,
          { opacity: 0, yPercent: 50 },
          {
            opacity: 1,
            yPercent: 0,
            duration: 0.8,
            ease: "power4.out",
            stagger: 0.1,
            delay: delay,
          }
        );
      }
    } else {
      const chars = charRefs.current.filter(Boolean);
      if (chars.length > 0) {
        tl.fromTo(
          chars,
          { opacity: 0 },
          {
            opacity: 1,
            duration: times[0],
            ease: "power4.inOut",
            stagger: times[1],
            delay: delay,
          }
        );
      }
    }

    return () => {
      // Kill the timeline and its ScrollTrigger instance
      if (tl.scrollTrigger) {
        tl.scrollTrigger.kill();
      }
      tl.kill();
    };
  }, [text, variant, msTighter, delay, loop]);

  // Class names for legacy CSS
  const variantClass =
    variant === "line" ? "Aline" : variant === "text" ? "Atext" : "Awrite";
  const invClass = inverse ? `${variantClass}-inv` : undefined;

  // Render helpers
  let charIndex = 0;

  return (
    <Tag
      className={[variantClass, invClass, className].filter(Boolean).join(" ")}
      aria-label={text}
      ref={containerRef}
    >
      {lines.map((line, lIdx) => {
        // When variant is "line", we just want to render the line content for the parent to animate.
        // The splitting into words/chars is for the "write" variant.
        if (variant === "line") {
          return (
            <div
              key={lIdx}
              className="line"
              ref={(el) => (lineRefs.current[lIdx] = el)}
            >
              {renderLine ? renderLine(line.line, lIdx) : line.line}
            </div>
          );
        }

        // Otherwise, for "write" variant, split into words and chars
        return (
          <div key={lIdx} className="line">
            {line.words.map((word, wIdx) => (
              <span key={wIdx} className="word">
                {word.chars.map((c, cIdx) => {
                  const refIdx = charIndex++;
                  return (
                    <span
                      key={cIdx}
                      className="char"
                      ref={(el) => (charRefs.current[refIdx] = el)}
                    >
                      {renderChar ? renderChar(c.char, refIdx) : c.char}
                    </span>
                  );
                })}
              </span>
            ))}
          </div>
        );
      })}
    </Tag>
  );
}
