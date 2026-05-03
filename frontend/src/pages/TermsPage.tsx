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

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-muted text-sm">Last updated: May 2025</p>
      </div>

      <Card>
        <CardContent className="pt-6 pb-6 space-y-6">
          <Section title="1. Acceptance">
            <p>
              By accessing or using leaguekarma.io ("the Service"), you agree to be bound by
              these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </Section>

          <Section title="2. Description of the Service">
            <p>
              leaguekarma.io is a community reputation platform for League of Legends players.
              It allows registered users to leave anonymous reviews for players they have shared
              matches with, and allows anyone to view aggregated reputation profiles. The Service
              is not affiliated with or endorsed by Riot Games, Inc.
            </p>
          </Section>

          <Section title="3. Eligibility">
            <p>
              You must be at least 13 years old to use this Service. By using it, you represent
              that you meet this requirement. If you are under 18, you confirm you have parental
              consent.
            </p>
          </Section>

          <Section title="4. User conduct">
            <p>By using the Service, you agree not to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Submit false, misleading, or defamatory reviews</li>
              <li>Harass, target, or coordinate mass negative reviews against specific players</li>
              <li>Use the Service to discriminate against others based on race, gender, religion, nationality, or other protected characteristics</li>
              <li>Attempt to manipulate the reputation system (e.g. creating multiple accounts to leave reviews)</li>
              <li>Scrape, crawl, or otherwise extract data from the Service in bulk without permission</li>
              <li>Use the Service in any way that violates applicable law or Riot Games' Terms of Service</li>
            </ul>
          </Section>

          <Section title="5. Reviews and content">
            <p>
              Reviews are anonymous — reviewer identity is never shown publicly. However, we
              maintain internal records linking reviews to accounts to enforce our conduct rules
              and prevent abuse.
            </p>
            <p>
              We reserve the right to remove any review that violates these Terms or that we
              determine, in our sole discretion, to be harmful, false, or abusive. We do not
              guarantee review accuracy and are not liable for the content of user-submitted
              reviews.
            </p>
            <p>
              By submitting a review, you grant leaguekarma.io a non-exclusive, royalty-free
              license to display that content as part of the Service.
            </p>
          </Section>

          <Section title="6. Riot Games data">
            <p>
              Match and account data is sourced from the Riot Games API. This data is subject
              to Riot Games'{' '}
              <a href="https://www.riotgames.com/en/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                Terms of Service
              </a>. leaguekarma.io is not endorsed by Riot Games and does not reflect the views
              or opinions of Riot Games or anyone officially involved in producing or managing
              League of Legends.
            </p>
          </Section>

          <Section title="7. Account termination">
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms,
              without prior notice. You may request deletion of your account at any time by
              contacting us at{' '}
              <a href="mailto:odmehb@gmail.com" className="text-gold hover:underline">
                odmehb@gmail.com
              </a>.
            </p>
          </Section>

          <Section title="8. Disclaimers">
            <p>
              The Service is provided "as is" without warranties of any kind. We do not
              guarantee uptime, accuracy of reputation data, or that the Service will meet your
              requirements. Player reputations are based on anonymous community feedback and
              should not be taken as definitive or factual assessments of any individual.
            </p>
          </Section>

          <Section title="9. Limitation of liability">
            <p>
              To the fullest extent permitted by law, leaguekarma.io shall not be liable for
              any indirect, incidental, special, or consequential damages arising from your use
              of the Service, including but not limited to reputational harm resulting from
              reviews posted by other users.
            </p>
          </Section>

          <Section title="10. Changes to these Terms">
            <p>
              We may update these Terms at any time. The "last updated" date will reflect
              changes. Continued use of the Service after changes constitutes acceptance of
              the revised Terms.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For questions about these Terms, contact us at{' '}
              <a href="mailto:odmehb@gmail.com" className="text-gold hover:underline">
                odmehb@gmail.com
              </a>.
            </p>
          </Section>
        </CardContent>
      </Card>

      <p className="text-xs text-muted">
        <Link to="/privacy" className="text-gold hover:underline">Privacy Policy</Link>
        {' '}·{' '}
        <Link to="/contact" className="text-gold hover:underline">Contact</Link>
        {' '}·{' '}
        <Link to="/about" className="text-gold hover:underline">About</Link>
      </p>
    </div>
  )
}
