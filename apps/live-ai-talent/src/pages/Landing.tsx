import { Link } from 'react-router-dom'
import {
  Zap,
  MessageSquare,
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  Shield,
  Star,
  ArrowRight,
  CheckCircle2,
  Building2,
  UserCheck,
  Sparkles,
} from 'lucide-react'
import { Navbar, Footer } from '../components/layout'
import { Button, Card } from '@bree-ai/core/components'

export default function Landing() {
  const stats = [
    { value: '80%', label: 'of recruiter time spent on screening' },
    { value: '70%', label: 'of candidates never hear back' },
    { value: '42', label: 'days average time-to-fill', suffix: 'days' },
  ]

  const features = [
    {
      icon: Zap,
      title: 'Easy Setup',
      description:
        'Automatically setup your position for AI screening by using our AI agents to parse Job Description, culture, and website.',
    },
    {
      icon: MessageSquare,
      title: 'Interactive Screening',
      description:
        'Using our Genius Recruitment Model, candidates interact directly with the job in real time for immediate feedback.',
    },
    {
      icon: BarChart3,
      title: 'Quantified Talent Matching',
      description:
        'We score each candidate and rank them for fit based on technical, problem solving, culture, and other key factors.',
    },
    {
      icon: Users,
      title: 'Candidate Relationships',
      description:
        'Real-time candidate feedback helps candidates get an assessment of where they are and provides coaching opportunities.',
    },
    {
      icon: TrendingUp,
      title: 'Talent Network',
      description:
        'Our talent network allows for proactive matching of opportunities for roles that candidates are qualified for.',
    },
  ]

  const valueProps = [
    {
      icon: Building2,
      title: 'Staffing Companies',
      tagline: 'Save 50% of screening time',
      benefits: [
        'Reclaim 22 hours/week for high-value activities',
        'Increase placements by up to 50% per recruiter',
        'Pre-assessed candidates for faster placements',
      ],
    },
    {
      icon: UserCheck,
      title: 'High-Volume Enterprise',
      tagline: 'Screen 1000+ candidates in days',
      benefits: [
        'Screen candidates 24/7 with no recruiter fatigue',
        '3x faster screening for peak seasons',
        '100% of candidates receive personalized feedback',
      ],
    },
    {
      icon: Sparkles,
      title: 'Corporate TA Teams',
      tagline: '60% reduced time-to-hire',
      benefits: [
        'Hiring managers self-service simple roles',
        '3.6x faster to first interview',
        'Internal mobility engine reduces external hiring',
      ],
    },
  ]

  const innovations = [
    {
      title: '3-Minute Auto-Configuration',
      description: 'AI parses JD, scrapes culture, generates questions',
      metric: '15x faster',
    },
    {
      title: 'Quantified Scores',
      description: 'Technical (40%), Cultural (25%), Experience (20%), Market (15%)',
      metric: '100% feedback',
    },
    {
      title: 'Talent Network',
      description: 'Candidates opt-in once, discovered by multiple companies',
      metric: 'Network effects',
    },
    {
      title: 'Career Agents',
      description: 'AI works 24/7 for candidates: search, apply, coach, negotiate',
      metric: 'Coming Soon',
    },
  ]

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-6 relative overflow-hidden bg-dark-950">
        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left Content */}
            <div className="flex-1 text-left">
              <h1 className="text-5xl md:text-7xl font-extrabold text-[#FF6B00] mb-8 leading-[1.1] tracking-tight">
                Scale Your <br />
                Engineering Team <br />
                With Genius Talent
              </h1>
              <p className="text-lg md:text-xl text-dark-300 mb-12 max-w-xl leading-relaxed">
                Genius Talent connects you with exceptional developers who integrate
                seamlessly with your team - fast, reliable, and fully aligned with your
                tech and culture.
              </p>

              <ul className="space-y-6 mb-12">
                {[
                  'Quick access to vetted engineering talent',
                  'Flexible team extension-scale up or down as needed',
                  'Engineers aligned with your stack, timezone, and culture',
                  'High retention, low ramp-up time',
                ].map((item, i) => (
                  <li key={i} className="bullet-crosshair text-lg text-dark-100 font-medium">
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-6">
                <Link to="/dashboard">
                  <button className="bg-brand-orange text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-brand-orange/20 active:scale-95">
                    Get Matched
                    <ArrowRight size={18} strokeWidth={3} />
                  </button>
                </Link>
                <Link to="/assess/demo">
                  <button className="bg-dark-700 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-dark-600 transition-all active:scale-95">
                    See How It Works
                    <ArrowRight size={18} strokeWidth={3} />
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Side Illustration */}
            <div className="flex-1 relative">
              <div className="glow-orange absolute inset-0 rounded-full opacity-10 animate-pulse-glow" />
              <img
                src="/assets/hero-illustration.png"
                alt="Genius Talent Illustration"
                className="relative z-10 w-full max-w-2xl mx-auto drop-shadow-2xl animate-float"
                onError={(e) => {
                  // Fallback for demo if asset doesn't exist yet
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Fallback Inline SVG if image fails */}
              <div className="lg:block hidden">
                <svg viewBox="0 0 500 500" className="w-full h-auto text-brand-orange/20">
                    <circle cx="250" cy="250" r="150" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 10" className="animate-spin-slow" />
                    <circle cx="250" cy="250" r="100" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="250" cy="250" r="50" fill="currentColor" className="animate-pulse" />
                </svg>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 border-t border-white/5 pt-16">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col gap-2">
                <p className="text-5xl font-black text-brand-orange">
                  {stat.value}
                  {stat.suffix && <span className="text-2xl ml-1">{stat.suffix}</span>}
                </p>
                <p className="text-dark-400 font-bold uppercase tracking-widest text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-32 px-6 bg-[#080C14]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="flex-1">
                <h2 className="text-4xl md:text-5xl font-extrabold text-[#FF6B00] mb-8 leading-tight">
                We Help Our Clients Leverage AI to Join the Future of Hiring
                </h2>
                <div className="space-y-8">
                    {[
                        { 
                            title: 'The Hiring Crisis', 
                            desc: '80% of recruiter time is spent screening resumes. It takes too long to fill positions, is expensive, and doesn\'t scale.' 
                        },
                        { 
                            title: 'Avoid Candidate Black Hole', 
                            desc: '70% of resume submissions never result in feedback. Our AI ensures every candidate is engaged.' 
                        }
                    ].map((item, i) => (
                        <div key={i} className="flex gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center flex-shrink-0 text-brand-orange font-black text-lg">
                                0{i+1}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-dark-100 mb-2">{item.title}</h3>
                                <p className="text-dark-400 leading-relaxed text-lg">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 w-full">
                <div className="glass p-12 rounded-4xl border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-brand-orange/10 transition-all duration-700" />
                    <h3 className="text-2xl font-black uppercase tracking-tight text-dark-100 mb-8">Quantified Talent Matching</h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Technical Fit', value: 92, color: 'bg-[#FF6B00]' },
                            { label: 'Culture Alignment', value: 85, color: 'bg-emerald-500' },
                            { label: 'Experience Match', value: 78, color: 'bg-blue-500' }
                        ].map((score, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between text-xs font-black uppercase tracking-[0.2em] text-dark-400">
                                    <span>{score.label}</span>
                                    <span className="text-dark-100">{score.value}%</span>
                                </div>
                                <div className="h-2 bg-dark-800 rounded-full overflow-hidden p-[1px]">
                                    <div 
                                        className={`h-full ${score.color} rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,107,0,0.3)]`} 
                                        style={{ width: `${score.value}%` }} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-7xl font-extrabold text-white mb-6 tracking-tighter">
              Unleash the <span className="text-brand-orange">Genius</span>
            </h2>
            <p className="text-dark-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                Our innovative technology platform streamlines the entire recruitment lifecycle through intelligent automation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-12 rounded-[2.5rem] border border-white/5 hover:border-brand-orange/20 transition-all duration-500 bg-dark-900/40 relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 rounded-full blur-2xl group-hover:bg-brand-orange/10 transition-all" />
                <feature.icon className="text-brand-orange mb-10 group-hover:scale-110 transition-transform duration-500" size={56} strokeWidth={1} />
                <h3 className="text-2xl font-extrabold text-dark-100 mb-4 group-hover:text-brand-orange transition-colors tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-dark-400 leading-relaxed font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-4 bg-dark-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-100 mb-4">
              Genius Talent.ai:{' '}
              <span className="text-brand-orange">Value Proposition</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {valueProps.map((prop, index) => (
              <Card key={index} padding="lg" hover glow>
                <prop.icon className="text-brand-orange mb-4" size={40} />
                <h3 className="text-xl font-bold text-dark-100 mb-2">{prop.title}</h3>
                <p className="text-brand-orange font-medium mb-4">{prop.tagline}</p>
                <ul className="space-y-3">
                  {prop.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2
                        size={18}
                        className="text-success mt-0.5 flex-shrink-0"
                      />
                      <span className="text-dark-300 text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Innovations */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Four <span className="text-brand-orange">Breakthrough Innovations</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {innovations.map((innovation, index) => (
              <div key={index} className="group p-10 rounded-4xl border border-white/5 hover:border-brand-orange/30 transition-all duration-500 bg-dark-900/20 backdrop-blur-md flex items-start gap-8">
                <div className="w-16 h-16 bg-brand-orange/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand-orange group-hover:text-white transition-all duration-500">
                  <span className="text-brand-orange font-black text-2xl group-hover:text-white transition-colors">0{index + 1}</span>
                </div>
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-dark-100 tracking-tight">
                      {innovation.title}
                    </h3>
                    <span className="px-3 py-1 bg-brand-orange/10 text-brand-orange text-[10px] font-black uppercase tracking-widest rounded-full border border-brand-orange/20">
                      {innovation.metric}
                    </span>
                  </div>
                  <p className="text-dark-400 text-lg leading-relaxed">{innovation.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-48 px-6 bg-[#080C14] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full max-h-4xl bg-brand-orange/5 rounded-full blur-[120px]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-black uppercase tracking-[0.2em] mb-10 border border-brand-orange/20">
            <Clock size={16} />
            <span>Pilot Pricing: 50% off for first 10 customers</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-10 leading-[1.1] tracking-tighter">
            Ready to Transform Your <br />
            <span className="text-brand-orange">Talent Acquisition?</span>
          </h2>
          <p className="text-xl text-dark-400 mb-16 leading-relaxed font-medium">
            Let Our Genius Talent Solution Help You! Choose the way that works best
            for you to connect with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/dashboard">
                <button className="bg-brand-orange text-white px-12 py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-brand-orange/20 active:scale-95">
                Get Started
                <ArrowRight size={18} strokeWidth={3} />
                </button>
            </Link>
            <Link to="/assess/demo">
                <button className="border border-white/20 text-white px-12 py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:bg-white hover:text-dark-900 transition-all active:scale-95">
                Try as Candidate
                <ArrowRight size={18} strokeWidth={3} />
                </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
