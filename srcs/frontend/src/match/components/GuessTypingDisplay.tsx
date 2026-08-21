/**
 * Spectator view of the guesser's live query with per-character enter/exit motion.
 * Text-only — no search metadata.
 */
import { useEffect, useRef, useState } from "react";

const CHAR_EXIT_MS = 160;
const CHAR_ENTER_MS = 220;
const CHAR_ENTER_STAGGER_MS = 16;

type CharPhase = "enter" | "visible" | "exit";

type CharItem = {
  id: number;
  char: string;
  phase: CharPhase;
};

type GuessTypingDisplayProps = {
  text: string;
};

function buildNextChars(prev: CharItem[], nextText: string, nextId: () => number): CharItem[] {
  const active = prev.filter((item) => item.phase !== "exit");
  const activeText = active.map((item) => item.char).join("");

  let prefixLength = 0;
  const sharedLength = Math.min(activeText.length, nextText.length);
  while (
    prefixLength < sharedLength &&
    activeText[prefixLength] === nextText[prefixLength]
  ) {
    prefixLength += 1;
  }

  const kept = active.slice(0, prefixLength).map((item) => ({
    ...item,
    phase: "visible" as const,
  }));
  const exiting = active.slice(prefixLength).map((item) => ({
    ...item,
    phase: "exit" as const,
  }));
  const entering = nextText.slice(prefixLength).split("").map((char) => ({
    id: nextId(),
    char,
    phase: "enter" as const,
  }));

  return [...kept, ...entering, ...exiting];
}

function renderChar(char: string) {
  if (char === " ") {
    return "\u00a0";
  }
  return char;
}

export default function GuessTypingDisplay({ text }: GuessTypingDisplayProps) {
  const [chars, setChars] = useState<CharItem[]>([]);
  const idRef = useRef(0);
  const prevTextRef = useRef(text);

  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  useEffect(() => {
    if (prevTextRef.current === text) return;

    setChars((prev) => buildNextChars(prev, text, nextId));
    prevTextRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!chars.some((item) => item.phase === "exit")) return;

    const timerId = window.setTimeout(() => {
      setChars((prev) => prev.filter((item) => item.phase !== "exit"));
    }, CHAR_EXIT_MS);

    return () => window.clearTimeout(timerId);
  }, [chars]);

  useEffect(() => {
    if (!chars.some((item) => item.phase === "enter")) return;

    const timerId = window.setTimeout(() => {
      setChars((prev) =>
        prev.map((item) =>
          item.phase === "enter" ? { ...item, phase: "visible" } : item,
        ),
      );
    }, CHAR_ENTER_MS + CHAR_ENTER_STAGGER_MS * 3);

    return () => window.clearTimeout(timerId);
  }, [chars]);

  useEffect(() => {
    if (text !== "") return;
    idRef.current = 0;
  }, [text]);

  let enteringIndex = 0;

  return (
    <span className="inline-flex max-w-full flex-wrap items-baseline justify-center whitespace-pre-wrap break-all">
      {chars.map((item) => {
        const phaseClass =
          item.phase === "enter"
            ? "animate-guess-typing-char-enter"
            : item.phase === "exit"
              ? "animate-guess-typing-char-exit"
              : "";

        const staggerDelay =
          item.phase === "enter"
            ? `${enteringIndex++ * CHAR_ENTER_STAGGER_MS}ms`
            : undefined;

        return (
          <span
            key={item.id}
            className={`inline-block will-change-transform ${phaseClass}`}
            style={
              staggerDelay ? { animationDelay: staggerDelay } : undefined
            }
            aria-hidden="true"
          >
            {renderChar(item.char)}
          </span>
        );
      })}
      <span
        className="ml-0.5 inline-block w-[0.6ch] shrink-0 animate-pulse text-[#f7d046]"
        aria-hidden="true"
      >
        |
      </span>
    </span>
  );
}
