import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Layout() {
  const { user, isLoading, login, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-karma-border bg-karma-surface">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="text-karma-gold font-bold text-lg tracking-tight">
            leaguekarma<span className="text-white">.io</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">
              Search
            </Link>
            {user && (
              <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
                Dashboard
              </Link>
            )}
            {!isLoading && (
              user ? (
                <button
                  onClick={logout}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Sign out
                </button>
              ) : (
                <button
                  onClick={login}
                  className="bg-karma-gold text-karma-dark text-sm font-semibold px-4 py-1.5 rounded hover:opacity-90 transition-opacity"
                >
                  Sign in
                </button>
              )
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-karma-border py-4 text-center text-xs text-gray-600">
        leaguekarma.io is not affiliated with Riot Games
      </footer>
    </div>
  )
}
