import { Link } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/Card'

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">About leaguekarma.io</h1>
        <p className="text-muted">Community-driven reputation for League of Legends players.</p>
      </div>

      <Card>
        <CardContent className="pt-6 pb-6 space-y-4">
          <p className="text-gray-300 leading-relaxed">
            leaguekarma.io is a community platform where League of Legends players can build and
            discover reputations for the people they queue with. After a match, you can leave
            anonymous feedback for your teammates — praising the carry or calling out the flamer.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Reputation is aggregated from tags left by real players who actually shared games
            together. Reviewer identity is never exposed — only the collective score and tags are
            visible on a player's public profile.
          </p>
          <p className="text-gray-300 leading-relaxed">
            The site is independent and community-run. Match data is fetched from the official
            Riot Games API. leaguekarma.io is not endorsed by or affiliated with Riot Games.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 pb-6 space-y-3">
          <h2 className="text-white font-semibold">How it works</h2>
          <ol className="space-y-2 text-gray-300 text-sm list-decimal list-inside">
            <li>Sign in with Google and link your Riot account (your Riot ID, e.g. PlayerName#EUW).</li>
            <li>Your recent ranked matches are automatically synced.</li>
            <li>Expand any match to leave anonymous reviews for your teammates.</li>
            <li>Search any player to see their aggregated reputation and what people say.</li>
          </ol>
        </CardContent>
      </Card>

      <p className="text-xs text-muted">
        Questions or issues?{' '}
        <Link to="/contact" className="text-gold hover:underline">Contact us</Link>
        {' '}·{' '}
        <Link to="/privacy" className="text-gold hover:underline">Privacy Policy</Link>
        {' '}·{' '}
        <Link to="/terms" className="text-gold hover:underline">Terms of Service</Link>
      </p>
    </div>
  )
}
