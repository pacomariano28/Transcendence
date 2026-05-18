export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/10">
      <div className="container-page py-4">
        <div className="flex flex-col gap-2 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Songguess</span>

          <span className="text-zinc-600">
            Minimal multiplayer game • Built with React
          </span>
        </div>
      </div>
    </footer>
  );
}
