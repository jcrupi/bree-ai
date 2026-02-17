import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'
import { Button } from '@bree-ai/core/components'
import ClaudeGrape from './ClaudeGrape'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/for-recruiters', label: 'For Recruiters' },
    { href: '/for-candidates', label: 'For Candidates' },
    { href: '/pricing', label: 'Pricing' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <div className="w-full max-w-7xl bg-white rounded-[2rem] shadow-xl px-6 sm:px-10 h-20 flex items-center justify-between border border-slate-200/50">
        <Link to="/">
          <Logo />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-[15px] font-bold transition-all hover:text-brand-orange ${
                isActive(link.href)
                  ? 'text-brand-orange underline underline-offset-8'
                  : 'text-dark-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <Link to="/login">
            <button className="text-[15px] font-bold text-dark-900 px-6 py-3 hover:text-brand-orange transition-colors">
              Log in
            </button>
          </Link>
          <Link to="/demo">
            <button className="bg-slate-50 text-dark-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-slate-200 hover:bg-slate-100 transition-all shadow-sm">
              Services
              <div className="grid grid-cols-2 gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-dark-900 rounded-full" />
                ))}
              </div>
            </button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden p-3 text-dark-900 hover:text-brand-orange transition-colors"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="absolute top-24 left-4 right-4 bg-white rounded-[2rem] shadow-2xl p-6 lg:hidden border border-slate-200 animate-slide-up">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 text-[16px] font-bold rounded-xl transition-all ${
                    isActive(link.href)
                      ? 'text-brand-orange bg-brand-orange/5'
                      : 'text-dark-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <button className="w-full text-[16px] font-bold text-dark-900 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                    Log in
                  </button>
                </Link>
                <Link to="/demo" onClick={() => setIsOpen(false)}>
                  <button className="w-full text-[16px] font-bold bg-brand-orange text-white py-3 rounded-xl shadow-lg shadow-brand-orange/20 transition-all">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
    </nav>
  )
}
