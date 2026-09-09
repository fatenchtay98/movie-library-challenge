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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-slate-900">
          Movie Library
        </Link>

        <nav className="flex items-center gap-2 text-sm sm:gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/watchlist" className="font-medium text-slate-700 hover:text-slate-900">
                Watchlist
              </Link>
              <span className="hidden max-w-[10rem] truncate text-slate-500 sm:inline sm:max-w-none">
                {user?.email} <span className="text-slate-400">({user?.role})</span>
              </span>
              <span className="text-slate-500 sm:hidden">{user?.role}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-medium text-slate-700 hover:text-slate-900">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800"
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
