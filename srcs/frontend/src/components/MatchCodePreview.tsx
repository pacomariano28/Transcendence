import { useEffect, useRef } from "react";

const MATCH_CODE_LENGTH = 6;
const PLACEHOLDER = "—";
const STAGGER_MS = 80;

type MatchCodePreviewProps = {
  code: string;
  className?: string;
};

export default function MatchCodePreview({
  code,
  className = "",
}: MatchCodePreviewProps) {
  const prevLengthRef = useRef(code.length);
  const addedCount = Math.max(0, code.length - prevLengthRef.current);
  const stagger = addedCount > 1;
  const staggerStart = code.length - addedCount;

  useEffect(() => {
    prevLengthRef.current = code.length;
  }, [code]);

  return (
    <div
      className={[
        "mt-3 font-mono text-4xl font-semibold tracking-[0.35em] sm:text-5xl uppercase",
        className,
      ].join(" ")}
      aria-label={code || undefined}
    >
      {Array.from({ length: MATCH_CODE_LENGTH }, (_, index) => {
        const char = code[index];

        if (!char) {
          return (
            <span key={`placeholder-${index}`} className="text-zinc-500">
              {PLACEHOLDER}
            </span>
          );
        }

        const delayMs = stagger
          ? Math.max(0, index - staggerStart) * STAGGER_MS
          : 0;

        return (
          <span
            key={`char-${index}-${char}`}
            className="inline-block text-white pop-in"
            style={delayMs > 0 ? { animationDelay: `${delayMs}ms` } : undefined}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
}
