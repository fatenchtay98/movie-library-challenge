export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800 px-4 py-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 text-xs text-zinc-500">
        <img src="/tmdb-logo.svg" alt="The Movie Database logo" className="h-3.5 opacity-70" />
        <span>
          This product uses the TMDB API but is not endorsed, certified, or otherwise approved by TMDB.
        </span>
      </div>
    </footer>
  );
}
