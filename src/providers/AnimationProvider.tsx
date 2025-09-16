// src/providers/AnimationProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// -----------------------------
// Animation Context / Provider
// -----------------------------
type AnimationContextType = {
  register: (id: string, restart: () => void) => void;
  unregister: (id: string) => void;
  trigger: (id: string) => void;
};

const AnimationContext = createContext<AnimationContextType | null>(null);

export function AnimationProvider({ children }: { children: ReactNode }) {
  const registry = useRef<Map<string, () => void>>(new Map());

  const register = (id: string, restart: () => void) => {
    registry.current.set(id, restart);
  };

  const unregister = (id: string) => {
    registry.current.delete(id);
  };

  const trigger = (id: string) => {
    const fn = registry.current.get(id);
    if (fn) fn();
  };

  return (
    <AnimationContext.Provider value={{ register, unregister, trigger }}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimationBus() {
  const ctx = useContext(AnimationContext);
  if (!ctx) throw new Error("useAnimationBus must be used inside AnimationProvider");
  return ctx;
}

// -----------------------------
// Utility: split text
// -----------------------------
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

// -----------------------------
// Hook: GSAP animation
// -----------------------------
const FAKE_CHARS = "##·$%&/=€|()@+09*+]}{[";
const TIMES_BASE = [0.3, 0.05, 0.16, 0.05, 0.016] as const;
const TIMES_MS = [0.22, 0.05, 0.16, 0.05, 0.016] as const;

function useWriteAnimation(
  variant: "write" | "text" | "line",
  opts: {
    id?: string;
    loop?: boolean;
    delay?: number;
    msTighter?: boolean;
    containerRef: React.RefObject<HTMLElement>;
    charRefs: React.RefObject<HTMLSpanElement[]>;
    lineRefs: React.RefObject<HTMLDivElement[]>;
  }
) {
  const { trigger, register, unregister } = useAnimationBus();

  useEffect(() => {
    if (!opts.containerRef.current) return;

    const times = opts.msTighter ? TIMES_MS : TIMES_BASE;

    const tl = gsap.timeline({
      paused: true,
      scrollTrigger: {
        trigger: opts.containerRef.current,
        start: "top 85%",
        toggleActions: "play none none none",
      },
      onComplete: () => {
        opts.containerRef.current?.classList.add("ivi");
        if (opts.loop) {
          tl.restart();
        }
        if (opts.id) {
          trigger(opts.id);
        }
      },
    });

    if (variant === "line") {
      const lines = opts.lineRefs.current.filter(Boolean);
      if (lines.length > 0) {
        tl.set(lines, { opacity: 0 });
        tl.fromTo(
          lines,
          { opacity: 0, yPercent: 50 },
          {
            opacity: 1,
            yPercent: 0,
            duration: 0.6,
            ease: "power4.inOut",
            stagger: 0.1,
            delay: opts.delay ?? 0,
          }
        );
      }
    } else {
      const chars = opts.charRefs.current.filter(Boolean);
      if (chars.length > 0) {
        tl.set(chars, { opacity: 1 });

        chars.forEach((c, i) => {
          const n = c.querySelector(".n");
          const fakes = c.querySelectorAll(".f");

          if (n) {
            tl.to(
              n,
              {
                opacity: 1,
                duration: times[0],
                ease: "power4.inOut",
              },
              (i * times[1]) + (opts.delay ?? 0)
            );
          }

          fakes.forEach((f, u) => {
            tl.fromTo(
              f,
              { scaleX: 1, opacity: 1, display: "block" },
              {
                scaleX: 0,
                opacity: 0,
                duration: times[2],
                ease: "power4.inOut",
                onComplete: () => (f as HTMLElement).style.display = "none",
              },
              (opts.delay ?? 0) + (i * times[3]) + ((u + 1) * times[4])
            );
          });
        });
      }
    }

    tl.play();

    if (opts.id) {
      register(opts.id, () => tl.restart());
      return () => unregister(opts.id!);
    }
  }, [variant, opts.id, opts.msTighter, opts.delay, opts.loop]);
}

// -----------------------------
// Component: Write
// -----------------------------
type Variant = "write" | "text" | "line";

type Props = {
  as?: keyof JSX.IntrinsicElements;
  variant?: Variant;
  children: ReactNode;
  className?: string;
  loop?: boolean;
  delay?: number;
  msTighter?: boolean;
  id?: string;
  inverse?: boolean;
};

export function Write({
                        as: Tag = "span",
                        variant = "write",
                        children,
                        className,
                        loop,
                        delay = 0,
                        msTighter = false,
                        id,
                        inverse,
                      }: Props) {
  const text = typeof children === "string" ? children : "";
  const lines = splitText(text);

  const charRefs = useRef<HTMLSpanElement[]>([]);
  const lineRefs = useRef<HTMLDivElement[]>([]);
  const containerRef = useRef<HTMLElement>(null);

  useWriteAnimation(variant, {
    id,
    loop,
    delay,
    msTighter,
    containerRef,
    charRefs,
    lineRefs,
  });

  const variantClass =
    variant === "line" ? "Aline" : variant === "text" ? "Atext" : "Awrite";
  const invClass = inverse ? `${variantClass}-inv` : undefined;

  let charIndex = 0;

  return (
    <Tag
      className={[variantClass, invClass, className].filter(Boolean).join(" ")}
      aria-label={text}
      ref={containerRef}
    >
      {lines.map((line, lIdx) => {
        if (variant === "text") {
          return (
            <Write
              key={lIdx}
              as="div"
              variant="line"
              className="line"
              delay={delay + lIdx * 0.15}
              msTighter={msTighter}
            >
              {line.line}
            </Write>
          );
        }

        if (variant === "line") {
          return (
            <div
              key={lIdx}
              className="line"
              ref={(el) => (lineRefs.current[lIdx] = el!)}
            >
              {line.line}
            </div>
          );
        }

        return (
          <div key={lIdx} className="line">
            {line.words.map((word, wIdx) => (
              <span key={wIdx} className="word">
                {word.chars.map((c, cIdx) => {
                  const refIdx = charIndex++;
                  const fakeCount = 2;
                  return (
                    <span
                      key={cIdx}
                      className="char"
                      ref={(el) => (charRefs.current[refIdx] = el!)}
                    >
                      <span className="n">{c.char}</span>
                      {Array.from({ length: fakeCount }).map((_, fIdx) => (
                        <span key={fIdx} className="f" aria-hidden="true">
                          {FAKE_CHARS[
                            Math.floor(Math.random() * FAKE_CHARS.length)
                            ]}
                        </span>
                      ))}
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