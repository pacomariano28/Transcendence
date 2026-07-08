import { Link } from "react-router-dom";
import TypingText from "../components/TypingText";

type NotFoundPageProps = {
  title?: string;
  message?: string;
};

export default function NotFoundPage({
  title = "404 NOT FOUND",
  message = "The page you're looking for doesn't exist.",
}: NotFoundPageProps) {
  return (
    <div className="container-page py-10 fade-in mt-5">
      <div className="mx-auto max-w-3xl text-center">
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
          <TypingText text={title} size="lg" />
        </div>

        <div className="mt-6 text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
          <TypingText text={message} size="md" />
        </div>

        <div className="mt-8">
          <Link
            className="btn-ghost inline-flex items-center justify-center px-6 py-3"
            to="/"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
