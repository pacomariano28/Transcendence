import TypingText from "../components/TypingText";

export default function NotFoundPage({ title = "404 NOT FOUND!" }: { title?: string }) {
  return (
    <div className="container-page flex min-h-[calc(100dvh-9rem)] flex-col items-center justify-center text-center fade-in">
      <div className="mx-auto max-w-3xl">
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
          <TypingText text={title} size="lg" />
        </div>
      </div>
    </div>
  );
}
