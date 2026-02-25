import { Link } from 'react-router-dom'
import { Linkedin, Mail, Calendar } from 'lucide-react'
import Logo from './Logo'

export default function Footer() {
  const footerLinks = {
    Product: [
      { label: 'For Recruiters', href: '/for-recruiters' },
      { label: 'For Candidates', href: '/for-candidates' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Features', href: '/features' },
    ],
    Company: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
    Resources: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Help Center', href: '/help' },
      { label: 'API', href: '/api' },
      { label: 'Status', href: '/status' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  }

  return (
    <footer className="bg-#080C14 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Logo and Description */}
          <div className="col-span-2">
            <Logo variant="light" />
            <p className="mt-4 text-sm text-dark-400 max-w-xs">
              Better Hiring for Recruiters, Better Experience for Candidates.
              AI-powered talent acquisition that saves 50% of screening time.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="mailto:support@geniusmatch.com"
                className="p-2 text-dark-400 hover:text-brand-orange rounded-lg hover:bg-dark-800 transition-colors"
              >
                <Mail size={20} />
              </a>
              <a
                href="https://www.linkedin.com/company/genius-match"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-dark-400 hover:text-brand-orange rounded-lg hover:bg-dark-800 transition-colors"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://meetings.hubspot.com/genius-match/intro-call-with-genius-match"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-dark-400 hover:text-brand-orange rounded-lg hover:bg-dark-800 transition-colors"
              >
                <Calendar size={20} />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/50 mb-6">{category}</h4>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-dark-400 hover:text-dark-200 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-dark-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-dark-500">
            &copy; {new Date().getFullYear()} Genius Talent.ai. All rights reserved.
          </p>
          <p className="text-sm text-dark-500">
            20+ Years of Talent Acquisition Experience
          </p>
        </div>
      </div>
    </footer>
  )
}
