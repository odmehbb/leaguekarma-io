import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import SearchPage from './pages/SearchPage'
import PlayerPage from './pages/PlayerPage'
import DashboardPage from './pages/DashboardPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import NotFoundPage from './pages/NotFoundPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SearchPage />} />
          <Route path="/player/:gameName/:tagLine" element={<PlayerPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
