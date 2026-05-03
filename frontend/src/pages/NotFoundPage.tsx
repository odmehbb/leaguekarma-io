import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="text-center py-24">
      <p className="text-6xl font-bold text-gold">404</p>
      <p className="text-gray-400 mt-4">This page doesn't exist.</p>
      <Link to="/" className="mt-6 inline-block text-gold hover:underline text-sm">
        Back to search →
      </Link>
    </div>
  )
}
