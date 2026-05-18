import { useEffect, useMemo, useState } from "react";

type TypingTextProps = {
  text: string;
  className?: string;
  typingDelays?: number[];
  typoChance?: number;
  typoMap?: Record<string, string>;
  pauseAfterCompleteMs?: number;
  pauseAfterDeleteMs?: number;
  cursorBlinkMs?: number;
};

const DEFAULT_TYPING_DELAYS = [180, 260, 140, 220, 190, 300, 160, 240];
const DEFAULT_TYPO_MAP: Record<string, string> = {
  G: "H",
  E: "R",
  S: "A",
  U: "Y",
  N: "M",
};

export default function TypingText({
  text,
  className = "",
  typingDelays = DEFAULT_TYPING_DELAYS,
  typoChance = 0.18,
  typoMap = DEFAULT_TYPO_MAP,
  pauseAfterCompleteMs = 1800,
  pauseAfterDeleteMs = 500,
  cursorBlinkMs = 700,
}: TypingTextProps) {
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting" | "typo">(
    "typing",
  );
  const [displayText, setDisplayText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [typoChar, setTypoChar] = useState<string | null>(null);

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
            setTypoChar(wrongChar);
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
        setTypoChar(null);
        setPhase("typing");
      }, 220);
    }

    if (phase === "pause") {
      timeoutId = window.setTimeout(() => {
        setPhase("deleting");
      }, 200);
    }

    if (phase === "deleting") {
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
  ]);

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap ${className}`}
      aria-label={text}
    >
      <span>{displayText}</span>
      <span
        className={`ml-0.5 inline-block w-[0.6ch] ${
          cursorVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        |
      </span>
    </span>
  );
}
