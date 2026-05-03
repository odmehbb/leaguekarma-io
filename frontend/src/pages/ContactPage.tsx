import { Card, CardContent } from '../components/ui/Card'
import { Link } from 'react-router-dom'

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Contact</h1>
        <p className="text-muted">Get in touch with the leaguekarma.io team.</p>
      </div>

      <Card>
        <CardContent className="pt-6 pb-6 space-y-4">
          <p className="text-gray-300 leading-relaxed">
            For general inquiries, bug reports, or abuse reports, reach out via email:
          </p>
          <a
            href="mailto:odmehb@gmail.com"
            className="inline-block text-gold hover:underline font-medium"
          >
            odmehb@gmail.com
          </a>

          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-sm text-white font-medium">Reporting abuse or false reviews</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              If you believe a review violates our{' '}
              <Link to="/terms" className="text-gold hover:underline">Terms of Service</Link>
              , please email us with the player's Riot ID and a brief description. We review all
              reports and will take appropriate action.
            </p>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-sm text-white font-medium">Data & privacy requests</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              To request deletion of your account or data, email us with the subject line
              "Data Deletion Request" and include your registered email address. We will
              process your request within 30 days. See our{' '}
              <Link to="/privacy" className="text-gold hover:underline">Privacy Policy</Link>
              {' '}for full details.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
