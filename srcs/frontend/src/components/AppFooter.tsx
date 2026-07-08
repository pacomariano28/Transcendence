import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/10">
      <div className="container-page py-4">
        <div className="flex flex-col gap-3 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Songuess</span>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/privacy" className="link">
              Privacy Policy
            </Link>
            <Link to="/terms" className="link">
              Terms of Service
            </Link>
          </div>

          <span className="text-zinc-600">
            Minimal multiplayer game • Built with React
          </span>
        </div>
      </div>
    </footer>
  );
}
