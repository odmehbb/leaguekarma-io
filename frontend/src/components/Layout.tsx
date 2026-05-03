import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from './ui/Button'
import { cn } from '../lib/utils'

export default function Layout() {
  const { user, isLoading, login, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl tracking-tight transition-colors">
            <span className="text-white">leaguekarma</span><span className="text-gold">.io</span>
          </Link>

          <nav className="flex items-center gap-3">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'text-sm transition-colors',
                  isActive ? 'text-gold' : 'text-muted hover:text-gray-100'
                )
              }
            >
              Search
            </NavLink>

            {user && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  cn(
                    'text-sm transition-colors',
                    isActive ? 'text-gold' : 'text-muted hover:text-gray-100'
                  )
                }
              >
                Dashboard
              </NavLink>
            )}

            {!isLoading && (
              <div className="ml-1">
                {user ? (
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Sign out
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={login}>
                    Sign in
                  </Button>
                )}
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border py-6 mt-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <span>leaguekarma.io — not affiliated with Riot Games</span>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
