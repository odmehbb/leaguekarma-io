import { Link } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/Card'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-white font-semibold text-base">{title}</h2>
      <div className="text-gray-400 text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-muted text-sm">Last updated: May 2025</p>
      </div>

      <Card>
        <CardContent className="pt-6 pb-6 space-y-6">
          <Section title="1. Who we are">
            <p>
              leaguekarma.io ("we", "us", "our") is a community platform for League of Legends
              player reputation. We are an independent service and are not affiliated with Riot
              Games, Inc.
            </p>
            <p>
              For privacy questions or data requests, contact us at{' '}
              <a href="mailto:contact@leaguekarma.io" className="text-gold hover:underline">
                contact@leaguekarma.io
              </a>.
            </p>
          </Section>

          <Section title="2. What data we collect">
            <p><strong className="text-white">Account data (Google Sign-In):</strong> When you sign in with Google, we receive your Google account ID, email address, and display name. We use this only to identify your account.</p>
            <p><strong className="text-white">Riot account data:</strong> When you link your Riot account, we store your Riot ID (game name and tag), PUUID (a unique identifier from Riot's API), summoner level, profile icon, and current ranked tier. This data is fetched from the official Riot Games API.</p>
            <p><strong className="text-white">Match data:</strong> We fetch and store your recent match history from the Riot Games API, including match results, champion played, KDA, and the same data for all participants in those matches.</p>
            <p><strong className="text-white">Reviews:</strong> When you leave a review, we store the selected tags, optional note (up to 280 characters), and the match it relates to. Reviews are permanently linked to your Riot account internally, but reviewer identity is never shown publicly.</p>
            <p><strong className="text-white">Votes:</strong> We store which reviews you have upvoted, linked to your user account.</p>
            <p><strong className="text-white">Usage data:</strong> We may collect standard server logs including IP addresses, browser type, and pages visited for security and operational purposes.</p>
          </Section>

          <Section title="3. How we use your data">
            <ul className="list-disc list-inside space-y-1">
              <li>To provide the core reputation service (matching players to reviews)</li>
              <li>To display your public profile (rank, champion stats, reputation score)</li>
              <li>To prevent abuse (e.g. reviewing the same player twice for the same match)</li>
              <li>To display advertising (via Google AdSense/Ads) — see section 5</li>
              <li>To improve the service and diagnose technical issues</li>
            </ul>
          </Section>

          <Section title="4. How we share your data">
            <p>We do not sell your personal data. We share data only in these circumstances:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-white">Publicly:</strong> Your Riot ID, rank, champion stats, and aggregated review tags are visible to anyone who visits your profile. Review notes are shown anonymously (not linked to you as the reviewer).</li>
              <li><strong className="text-white">Riot Games API:</strong> We fetch data from Riot's API subject to their{' '}
                <a href="https://www.riotgames.com/en/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Terms of Service</a>.
              </li>
              <li><strong className="text-white">Google:</strong> We use Google Sign-In (subject to Google's Privacy Policy) and may use Google Ads services (see section 5).</li>
              <li><strong className="text-white">Hosting:</strong> Our infrastructure runs on Railway.app. Data is stored in PostgreSQL databases hosted by Railway.</li>
            </ul>
          </Section>

          <Section title="5. Advertising">
            <p>
              We use or intend to use Google AdSense to display advertisements. Google and its
              partners may use cookies to serve ads based on your prior visits to this website
              or other websites. Google's use of advertising cookies enables it and its partners
              to serve ads based on your visit to our site and/or other sites on the Internet.
            </p>
            <p>
              You may opt out of personalized advertising by visiting{' '}
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                Google Ads Settings
              </a>.
            </p>
          </Section>

          <Section title="6. Cookies">
            <p>We use the following cookies:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-white">Authentication cookie ("token"):</strong> A JWT stored as an HTTP-only cookie to keep you signed in. This is essential for the service to function.</li>
              <li><strong className="text-white">Google advertising cookies:</strong> Set by Google AdSense for ad personalisation. These can be controlled via Google's opt-out tools.</li>
            </ul>
          </Section>

          <Section title="7. Data retention">
            <p>
              We retain your account and match data for as long as your account is active or as
              needed to provide the service. Match participant data (for players who haven't
              registered) is retained to enable the reputation system to work for unregistered
              players.
            </p>
            <p>
              To request deletion of your data, email us at{' '}
              <a href="mailto:contact@leaguekarma.io" className="text-gold hover:underline">
                contact@leaguekarma.io
              </a>{' '}
              with subject "Data Deletion Request". We will process requests within 30 days.
            </p>
          </Section>

          <Section title="8. Your rights (GDPR)">
            <p>If you are in the European Economic Area, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data ("right to be forgotten")</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
            </ul>
            <p>To exercise any of these rights, contact us at contact@leaguekarma.io.</p>
          </Section>

          <Section title="9. Children's privacy">
            <p>
              This service is not directed at children under 13. We do not knowingly collect
              personal information from children under 13. If you believe a child has provided
              us personal information, please contact us for removal.
            </p>
          </Section>

          <Section title="10. Changes to this policy">
            <p>
              We may update this policy from time to time. The "last updated" date at the top
              of this page will reflect any changes. Continued use of the service after changes
              constitutes acceptance of the updated policy.
            </p>
          </Section>
        </CardContent>
      </Card>

      <p className="text-xs text-muted">
        <Link to="/terms" className="text-gold hover:underline">Terms of Service</Link>
        {' '}·{' '}
        <Link to="/contact" className="text-gold hover:underline">Contact</Link>
        {' '}·{' '}
        <Link to="/about" className="text-gold hover:underline">About</Link>
      </p>
    </div>
  )
}
