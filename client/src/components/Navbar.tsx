import { Link, useNavigate } from 'react-router-dom';

import { useAuth, useLogout } from '../api/auth';

export function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout.mutateAsync();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight text-zinc-100">
          Movie Library
        </Link>

        <nav className="flex items-center gap-2 text-sm sm:gap-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/watchlist"
                className="font-medium text-zinc-300 transition-colors hover:text-emerald-400"
              >
                Watchlist
              </Link>
              <span className="hidden max-w-[10rem] truncate text-zinc-400 sm:inline sm:max-w-none">
                {user?.email} <span className="text-zinc-500">({user?.role})</span>
              </span>
              <span className="text-zinc-400 sm:hidden">{user?.role}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-zinc-700 px-3 py-1.5 font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-medium text-zinc-300 transition-colors hover:text-emerald-400">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-emerald-500"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
