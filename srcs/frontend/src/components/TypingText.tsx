import { useEffect, useMemo, useState } from "react";

type TypingTextProps = {
  text: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  typingDelays?: number[];
  typoChance?: number;
  typoMap?: Record<string, string>;
  pauseAfterCompleteMs?: number;
  pauseAfterDeleteMs?: number;
  cursorBlinkMs?: number;
  loop?: boolean;
};

const DEFAULT_TYPING_DELAYS = [180, 260, 140, 220, 190, 300, 160, 240];
const DEFAULT_TYPO_MAP: Record<string, string> = {
  G: "H",
  E: "R",
  S: "A",
  U: "Y",
  N: "M",
};

const SIZE_CLASSES: Record<NonNullable<TypingTextProps["size"]>, string> = {
  sm: "text-xs tracking-[0.28em]",
  md: "text-xs sm:text-sm tracking-[0.35em]",
  lg: "text-sm sm:text-base tracking-[0.4em]",
};

const BASE_CLASSNAME =
  "font-mono text-[#f7d046] pb-1 drop-shadow-[0_0_14px_rgba(247,208,70,0.16)]";

export default function TypingText({
  text,
  size = "md",
  className = "",
  typingDelays = DEFAULT_TYPING_DELAYS,
  typoChance = 0.18,
  typoMap = DEFAULT_TYPO_MAP,
  pauseAfterCompleteMs = 1800,
  pauseAfterDeleteMs = 500,
  cursorBlinkMs = 700,
  loop = true,
}: TypingTextProps) {
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting" | "typo">(
    "typing",
  );
  const [displayText, setDisplayText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const currentTypingDelay = useMemo(() => {
    if (!text.length) return 180;
    return typingDelays[charIndex % typingDelays.length] ?? 180;
  }, [charIndex, text.length, typingDelays]);

  useEffect(() => {
    const blink = window.setInterval(() => {
      setCursorVisible((visible) => !visible);
    }, cursorBlinkMs);

    return () => window.clearInterval(blink);
  }, [cursorBlinkMs]);

  useEffect(() => {
    if (!text) return;

    let timeoutId: number;

    if (phase === "typing") {
      if (charIndex < text.length) {
        timeoutId = window.setTimeout(() => {
          const nextChar = text[charIndex];
          const shouldMakeTypo =
            charIndex > 0 &&
            charIndex < text.length - 1 &&
            Math.random() < typoChance &&
            typoMap[nextChar] &&
            typoMap[nextChar] !== nextChar;

          if (shouldMakeTypo) {
            const wrongChar = typoMap[nextChar];
            setDisplayText(text.slice(0, charIndex) + wrongChar);
            setPhase("typo");
          } else {
            const nextCharIndex = charIndex + 1;
            setDisplayText(text.slice(0, nextCharIndex));
            setCharIndex(nextCharIndex);
          }
        }, currentTypingDelay);
      } else {
        timeoutId = window.setTimeout(() => {
          setPhase("pause");
        }, pauseAfterCompleteMs);
      }
    }

    if (phase === "typo") {
      timeoutId = window.setTimeout(() => {
        setDisplayText(text.slice(0, charIndex));
        setPhase("typing");
      }, 220);
    }

    if (phase === "pause") {
      timeoutId = window.setTimeout(() => {
        if (!loop) return;
        setPhase("deleting");
      }, 200);
    }

    if (loop && phase === "deleting") {
      if (charIndex > 0) {
        timeoutId = window.setTimeout(() => {
          const nextCharIndex = charIndex - 1;
          setDisplayText(text.slice(0, nextCharIndex));
          setCharIndex(nextCharIndex);
        }, 110);
      } else {
        timeoutId = window.setTimeout(() => {
          setPhase("typing");
        }, pauseAfterDeleteMs);
      }
    }

    return () => window.clearTimeout(timeoutId);
  }, [
    charIndex,
    currentTypingDelay,
    pauseAfterCompleteMs,
    pauseAfterDeleteMs,
    phase,
    text,
    typoChance,
    typoMap,
    loop,
  ]);

  return (
    <span
      className={[
        "inline-flex items-center whitespace-nowrap align-middle",
        BASE_CLASSNAME,
        SIZE_CLASSES[size],
        className,
        isVisible ? "fade-in-visible" : "fade-in-initial", // Clases para la transición
      ].join(" ")}
      aria-label={text}
      style={{ transition: "opacity 0.2s ease-in" }}
    >
      <span className="inline-block">{displayText}</span>
      <span
        className={`ml-0.5 inline-block w-[0.6ch] shrink-0 ${
          cursorVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        |
      </span>
    </span>
  );
}
