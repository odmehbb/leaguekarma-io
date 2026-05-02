import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Google OAuth callback is handled server-side.
// This page handles any client-side redirect fallback.
export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/dashboard', { replace: true })
  }, [navigate])

  return <div className="text-gray-500">Signing in…</div>
}
