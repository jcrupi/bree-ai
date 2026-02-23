import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Send,
  Bot,
  User,
  Clock,
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  Star,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Check,
  Edit3,
  Eye,
  X,
  Save,
  Circle,
  Pause,
  Play,
  Square,
} from 'lucide-react'
import { Logo } from '../components/layout'
import { Button, Card, Badge, Progress, Avatar } from '@bree-ai/core/components'
import { api } from '@bree-ai/core/utils'
import { currentBrand } from '@bree-ai/core/config'
import { agentXSpecialities } from '../data/specialities'

type AssessmentPhase = 'intro' | 'config' | 'assessment' | 'complete' | 'results'
type RecordingStatus = 'idle' | 'recording' | 'paused'
type StartMode = 'enter' | 'autopilot'

interface Message {
  id: number
  type: 'bot' | 'user'
  content: string
  timestamp: string
}

const MAX_AI_CLARIFICATIONS = 2
const DEFAULT_QUESTION_COUNT = 6

export default function CandidateAssessment() {
  const [searchParams] = useSearchParams()
  const isLeadView = searchParams.get('view') === 'lead'

  const [phase, setPhase] = useState<AssessmentPhase>('intro')
  const [startMode, setStartMode] = useState<StartMode>('autopilot')
  const [customQuestionsText, setCustomQuestionsText] = useState('')
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(['devops'])
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTION_COUNT)
  const [strictMode, setStrictMode] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [aiClarificationCount, setAiClarificationCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [inputValue, setInputValue] = useState('')
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content:
        "Hi! I'm Genie, the AI Talent.ai for this Senior DevOps Engineer role at TechCorp. I'll be conducting your interactive assessment today. This should take about 12-15 minutes, and you'll receive instant feedback on your fit for this role. Ready to begin?",
      timestamp: '2:30 PM',
    },
  ])

  const job = {
    title: 'Lead Developer',
    subtitle: 'Software Engineering',
    company: 'GMTA',
    type: 'Contract',
    publishedDate: 'Jan 8, 2026',
    location: 'Remote',
    salary: '$150-180K',
    description: `LEAD FULL STACK DEVELOPER

Our client is an innovative software product company building a state-of-the-art platform that delivers authoritative bid intelligence to government contracting (GovCon) clients. We are seeking an exceptional Full Stack Lead Developer who combines strategic thinking with hands-on technical excellence. This role is perfect for someone who wants to shape the technical direction of a growing platform while remaining deeply involved in writing code. You'll work directly with our team to architect, build, and scale the platform from beta to production.

Key Responsibilities
• Lead the technical architecture and development of our platform from beta to production deployment
• Write high-quality, maintainable code across our full technology stack daily
• Design and implement scalable cloud infrastructure with AWS services
• Make strategic technical decisions that balance innovation, scalability, and time-to-market
• Manage project timelines, set realistic deliverable expectations, and communicate technical challenges proactively
• Collaborate with stakeholders to translate business requirements into technical solutions
• Establish development best practices, code standards, and quality assurance processes
• Integrate third-party APIs and services to enhance platform functionality

Required Qualifications
• 8+ years of experience in professional software engineering using Node.js and TypeScript, Python and Go, CSS, Cursor IDE`,
  }

  /* REPLACE STATIC WITH DYNAMIC */
  const [assessmentQuestions, setAssessmentQuestions] = useState<string[]>([
    "Let's start with your technical background. Can you tell me about your experience with Kubernetes? What's the most complex cluster you've designed or managed?",
    "Great! Now tell me about a challenging production incident you've handled. Walk me through how you diagnosed and resolved it.",
    "I'd like to understand your infrastructure as code experience. How have you used Terraform or similar tools in your previous roles?",
    "Let's talk about your AWS experience. Which services have you worked with most extensively, and how have you optimized costs?",
    'I use Jest for unit tests and have worked with Enzyme, though I know React Testing Library is the newer standard. I focus on testing user interactions rather than implementation details.',
    "Good philosophy. Final question: tell me about your experience working in remote teams and how you handle collaboration.",
  ])

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data: config } = await (api.api.config as any)[currentBrand.name].get()
        if (config?.specialities?.length) {
          const selected = agentXSpecialities.filter(s => config.specialities.includes(s.id))
          if (selected.length > 0) {
             // Gather all questions from selected specialities
             const dynamicQuestions = selected.flatMap(s => s.questions.map(q => q.text))
             // Shuffle and pick 6
             const shuffled = dynamicQuestions.sort(() => 0.5 - Math.random()).slice(0, 6)
             if (shuffled.length > 0) {
                setAssessmentQuestions(shuffled)
                const specNames = selected.map(s => s.name).join(' and ')
                setMessages(prev => prev.map(m => m.id === 1 ? {
                  ...m, 
                  content: `Hi! I'm Genie, the AI Talent.ai for this Senior DevOps Engineer role. I'll be assessing your **${specNames}** skills today. Ready to begin?`
                } : m))
             }
          }
        }
      } catch (err) {
        console.error("Failed to load assessment config", err)
      }
    }
    loadConfig()
  }, [])

  const results = {
    overallScore: 76,
    competitiveness: "You're competitive for this role",
    scores: {
      technical: 92,
      problemSolving: 85,
      cultural: 84,
      experience: 68,
    },
    strengths: [
      'React fundamentals are excellent (92/100) - your explanation of hooks and state management was spot-on',
      'Problem-solving approach is solid - you broke down the performance optimization challenge methodically',
      'Communication is clear and you ask good clarifying questions',
    ],
    gaps: [
      'TypeScript experience is limited (58/100) - you mentioned using it but struggled with advanced type creation',
      'Testing approach needs development (64/100) - familiar with Jest but haven\'t done much with React Testing Library',
      'The role requires 5+ years - your 4 years of experience puts you slightly below their threshold',
    ],
    marketIntelligence: {
      percentile: '78th',
      salaryRange: '$105-125K',
      targetRange: '$140-165K',
    },
    nextSteps: [
      { title: 'Similar roles you\'re qualified for right now', description: 'We found 3 positions that match your current skill level' },
      { title: 'Close the gap for senior roles', description: 'Add 6-12 months of TypeScript + testing experience, then you\'d be a fit for roles like this' },
      { title: 'Talk to our coaching agent', description: 'Get a personalized learning path to reach senior level faster' },
    ],
    alternativePositions: [
      {
        title: 'Mid-Level React Developer',
        company: 'StartupABC',
        salary: '$100-120K',
        score: 89,
      },
      {
        title: 'Frontend Engineer',
        company: 'TechFlow Inc',
        salary: '$95-115K',
        score: 86,
      },
    ],
  }

  const buildQuestionsFromConfig = (): string[] => {
    if (startMode === 'enter') {
      const lines = customQuestionsText.trim().split(/\n/).map((s) => s.trim()).filter(Boolean)
      return lines.length > 0 ? lines : assessmentQuestions
    }
    const agents = agentXSpecialities.filter((s) => selectedAgentIds.includes(s.id))
    const all = agents.flatMap((s) => s.questions.map((q) => q.text))
    const shuffled = [...all].sort(() => 0.5 - Math.random())
    const count = Math.min(Math.max(1, questionCount), 10)
    return shuffled.slice(0, count)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isPaused || isSubmitting) return

    const answer = inputValue.trim()
    const newMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: answer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, newMessage])
    setInputValue('')

    if (strictMode) {
      if (currentQuestion < assessmentQuestions.length) {
        const nextQ = assessmentQuestions[currentQuestion]
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 2,
            type: 'bot',
            content: nextQ,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ])
        setCurrentQuestion((prev) => prev + 1)
      } else {
        setPhase('complete')
      }
      return
    }

    setIsSubmitting(true)
    const currentQ = assessmentQuestions[currentQuestion - 1]
    const recent = messages.slice(-6).map((m) => `${m.type}: ${m.content}`).join('\n')
    const clarificationBudget = MAX_AI_CLARIFICATIONS - aiClarificationCount
    try {
      const systemPrompt = `You are an assessment interviewer. Given the current question and the candidate's answer, respond with exactly one of:
1. NEXT_QUESTION: if the answer is sufficient or you have no follow-up. On the next line, write the next interview question (one line).
2. CLARIFY: if the candidate asked a question or you need to clarify (max ${clarificationBudget} clarifications left). On the next line, write your brief clarification/response.
If clarification budget is 0, you must respond with NEXT_QUESTION only. Output format: first line is NEXT_QUESTION or CLARIFY, second line is the message.`
      const userPrompt = `Current question: ${currentQ}\nCandidate answer: ${answer}\n\nRecent messages:\n${recent}\n\nRespond with NEXT_QUESTION or CLARIFY and then your message.`
      const result = await (api.api.openai as any).chat({
        query: userPrompt,
        context: '',
        options: { systemPrompt, temperature: 0.3, max_tokens: 500 },
      })
      const response = (result?.response ?? result?.message ?? '').trim()
      const firstLine = response.split('\n')[0]?.toUpperCase() ?? ''
      const messageContent = response.split('\n').slice(1).join('\n').trim() || response

      if (firstLine.includes('CLARIFY') && aiClarificationCount < MAX_AI_CLARIFICATIONS) {
        setAiClarificationCount((c) => c + 1)
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 2,
            type: 'bot',
            content: messageContent,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ])
      } else {
        const nextQuestionText =
          firstLine.includes('NEXT_QUESTION') && messageContent
            ? messageContent
            : currentQuestion < assessmentQuestions.length
              ? assessmentQuestions[currentQuestion]
              : null
        if (nextQuestionText) {
          setMessages((prev) => [
            ...prev,
            {
              id: prev.length + 2,
              type: 'bot',
              content: nextQuestionText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ])
          setCurrentQuestion((prev) => prev + 1)
        } else {
          setPhase('complete')
        }
      }
    } catch (err) {
      console.error('Assessment AI error', err)
      if (currentQuestion < assessmentQuestions.length) {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 2,
            type: 'bot',
            content: assessmentQuestions[currentQuestion],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ])
        setCurrentQuestion((prev) => prev + 1)
      } else {
        setPhase('complete')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const goToConfig = () => setPhase('config')

  const startAssessment = () => {
    const questions = buildQuestionsFromConfig()
    setAssessmentQuestions(questions)
    setPhase('assessment')
    setAiClarificationCount(0)
    const botMessage: Message = {
      id: 2,
      type: 'bot',
      content: questions[0],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, botMessage])
  }

  // Job View (Intro)
  if (phase === 'intro') {
    return (
      <div className="relative min-h-screen bg-dark-950 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-orange/10 blur-[130px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 blur-[110px] rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <header className="relative z-10 border-b border-white/5 bg-dark-950/50 backdrop-blur-xl sticky top-0">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Logo />
            <div className="hidden md:flex items-center gap-6">
               <a href="#" className="text-sm font-medium text-dark-400 hover:text-white transition-colors">Our Process</a>
               <a href="#" className="text-sm font-medium text-dark-400 hover:text-white transition-colors">Career Advice</a>
               <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5">
                 Sign In
               </Button>
            </div>
          </div>
        </header>

        <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Job Details */}
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-dark-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                      Featured Role
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">
                      {job.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-dark-400 font-medium">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                        <MapPin size={16} className="text-brand-orange/70" /> {job.location}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                        <DollarSign size={16} className="text-green-500/70" /> {job.salary}
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                        <Clock size={16} className="text-blue-500/70" /> {job.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-black text-white">
                      GT
                    </div>
                    <Badge variant="orange" className="font-bold">GMTA AI</Badge>
                  </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

                <div className="prose prose-invert prose-lg max-w-none">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Target size={20} className="text-brand-orange" />
                    Role Overview
                  </h3>
                  <div className="text-dark-300 leading-relaxed space-y-4">
                    {job.description.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment CTA */}
            <div className="lg:col-span-4">
              <div className="sticky top-28 space-y-6">
                <div className="bg-gradient-to-br from-brand-orange to-[#ff914d] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-brand-orange/20 group">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/20 blur-[50px] rounded-full pointer-events-none transition-transform group-hover:scale-150 duration-700" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-inner">
                      <Sparkles size={32} className="text-white" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black tracking-tight">Chat with this Job</h3>
                      <p className="text-orange-50/80 font-medium leading-relaxed">
                        Get instant feedback on your fit. Our AI assesses your expertise in real-time.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
                        <CheckCircle2 size={18} className="text-white" />
                        <span className="text-sm font-bold uppercase tracking-wider">No Resume Required</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
                        <Target size={18} className="text-white" />
                        <span className="text-sm font-bold uppercase tracking-wider">Instant Feedback</span>
                      </div>
                    </div>

                    <Button 
                      onClick={goToConfig} 
                      className="w-full h-14 bg-white text-brand-orange hover:bg-orange-50 font-black text-lg rounded-2xl transition-all active:scale-95 shadow-xl"
                    >
                      Start Assessment
                      <ArrowRight size={20} className="ml-2" />
                    </Button>

                    <p className="text-center text-[10px] font-bold text-white/60 uppercase tracking-widest pt-2">
                      Trusted by 500+ Hiring Teams
                    </p>
                  </div>
                </div>

                <div className="bg-dark-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-dark-500 uppercase tracking-wider">Avg. Completion Time</div>
                    <div className="text-lg font-black text-white">12 Minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Assessment config: enter questions or autopilot, strict vs AI-interactive
  if (phase === 'config') {
    return (
      <div className="relative min-h-screen bg-dark-950 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-orange/10 blur-[130px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <header className="relative z-10 border-b border-white/5 bg-dark-950/50 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <Logo size="sm" />
            <span className="text-xs font-bold text-dark-400 uppercase tracking-widest">Set up assessment</span>
          </div>
        </header>
        <main className="relative z-10 max-w-3xl mx-auto px-6 py-10 space-y-8">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">How do you want to run the assessment?</h2>
            <p className="text-dark-400 text-sm">Enter your own questions or use autopilot with question agents.</p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStartMode('enter')}
              className={`flex-1 p-5 rounded-2xl border-2 text-left transition-all ${
                startMode === 'enter' ? 'border-brand-orange bg-brand-orange/10 text-white' : 'border-white/10 bg-dark-900/40 text-dark-300 hover:border-white/20'
              }`}
            >
              <span className="font-bold block mb-1">Enter questions</span>
              <span className="text-xs opacity-80">Paste or type one question per line</span>
            </button>
            <button
              type="button"
              onClick={() => setStartMode('autopilot')}
              className={`flex-1 p-5 rounded-2xl border-2 text-left transition-all ${
                startMode === 'autopilot' ? 'border-brand-orange bg-brand-orange/10 text-white' : 'border-white/10 bg-dark-900/40 text-dark-300 hover:border-white/20'
              }`}
            >
              <span className="font-bold block mb-1">Autopilot</span>
              <span className="text-xs opacity-80">Select question agents, pick how many (1–10)</span>
            </button>
          </div>

          {startMode === 'enter' && (
            <div>
              <label className="block text-sm font-bold text-dark-300 mb-2">Questions (one per line)</label>
              <textarea
                value={customQuestionsText}
                onChange={(e) => setCustomQuestionsText(e.target.value)}
                placeholder="Paste or type questions here...&#10;e.g. Tell me about your experience with React.&#10;How do you handle state management?"
                rows={8}
                className="w-full bg-dark-900/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-dark-500 focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange/50 resize-y"
              />
              <p className="text-xs text-dark-500 mt-1">Leave empty to use default questions.</p>
            </div>
          )}

          {startMode === 'autopilot' && (
            <>
              <div>
                <label className="block text-sm font-bold text-dark-300 mb-2">Question agents</label>
                <div className="flex flex-wrap gap-2">
                  {agentXSpecialities.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-900/60 border border-white/10 cursor-pointer hover:border-brand-orange/30">
                      <input
                        type="checkbox"
                        checked={selectedAgentIds.includes(s.id)}
                        onChange={(e) =>
                          setSelectedAgentIds((prev) =>
                            e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                          )
                        }
                        className="rounded border-white/20 text-brand-orange focus:ring-brand-orange"
                      />
                      <span className="text-sm font-medium text-white">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-dark-300 mb-2">Number of questions (1–10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                  className="w-24 bg-dark-900/60 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-brand-orange/50"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-dark-300 mb-2">Response mode</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStrictMode(true)}
                className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                  strictMode ? 'border-brand-orange bg-brand-orange/10 text-white' : 'border-white/10 bg-dark-900/40 text-dark-300'
                }`}
              >
                <span className="font-bold block">Strict</span>
                <span className="text-xs opacity-80">Next question right after each answer</span>
              </button>
              <button
                type="button"
                onClick={() => setStrictMode(false)}
                className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                  !strictMode ? 'border-brand-orange bg-brand-orange/10 text-white' : 'border-white/10 bg-dark-900/40 text-dark-300'
                }`}
              >
                <span className="font-bold block">AI-interactive</span>
                <span className="text-xs opacity-80">AI may clarify (max 2) or go to next question</span>
              </button>
            </div>
          </div>

          <Button onClick={startAssessment} className="w-full h-14 bg-brand-orange text-white font-black text-lg rounded-2xl">
            Start assessment
            <ArrowRight size={20} className="ml-2" />
          </Button>
        </main>
      </div>
    )
  }

  // Assessment Chat
  if (phase === 'assessment') {
    return (
      <div className="relative min-h-screen bg-dark-950 flex flex-col overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-orange/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <header className="relative z-10 border-b border-white/5 bg-dark-950/50 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="sm" />
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                <span className="text-xs font-bold text-dark-300 uppercase tracking-widest">Active Assessment</span>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-dark-400">
                <Clock size={14} className="text-brand-orange" />
                {currentQuestion}/{assessmentQuestions.length}
              </div>
              <div className="w-32 h-1.5 bg-dark-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-orange transition-all duration-500" 
                  style={{ width: `${(currentQuestion / assessmentQuestions.length) * 100}%` }} 
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${strictMode ? 'bg-dark-700 text-dark-300' : 'bg-blue-500/20 text-blue-400'}`}>
                {strictMode ? 'Strict' : `AI (${MAX_AI_CLARIFICATIONS - aiClarificationCount} clarifications left)`}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-dark-400 hover:bg-white/5"
                onClick={() => setIsPaused((p) => !p)}
              >
                {isPaused ? <Play size={14} className="mr-1.5" /> : <Pause size={14} className="mr-1.5" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            </div>
          </div>
          {isPaused && (
            <div className="max-w-5xl mx-auto px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-center gap-2 text-amber-400 text-sm font-medium">
              <Pause size={16} />
              Assessment paused. Click Resume to continue.
            </div>
          )}
          {/* Lead-only recording controls: pause when answering candidate questions, then resume */}
          {isLeadView && (
            <div className="max-w-5xl mx-auto px-6 pb-4 flex items-center justify-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-900/80 border border-white/10">
                {recordingStatus === 'idle' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => setRecordingStatus('recording')}
                  >
                    <Circle size={14} className="mr-1.5 fill-current" />
                    Record
                  </Button>
                )}
                {recordingStatus === 'recording' && (
                  <>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Recording
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-dark-300 hover:bg-white/5"
                      onClick={() => setRecordingStatus('paused')}
                    >
                      <Pause size={14} className="mr-1.5" />
                      Pause
                    </Button>
                  </>
                )}
                {recordingStatus === 'paused' && (
                  <>
                    <span className="text-xs font-bold text-amber-400">Paused</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-brand-orange/50 text-brand-orange hover:bg-brand-orange/10"
                      onClick={() => setRecordingStatus('recording')}
                    >
                      <Play size={14} className="mr-1.5" />
                      Continue
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-dark-400 hover:bg-white/5"
                      onClick={() => setRecordingStatus('idle')}
                    >
                      <Square size={14} className="mr-1.5" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
              <span className="text-[10px] font-medium text-dark-500 uppercase tracking-wider">
                Lead controls • Pause to answer candidate questions, then Continue
              </span>
            </div>
          )}
        </header>

        <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-6 py-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 animate-in slide-in-from-bottom-4 duration-500 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-lg ${
                    message.type === 'bot'
                      ? 'bg-dark-800 border-white/10 text-brand-orange'
                      : 'bg-brand-orange border-brand-orange/50 text-white'
                  }`}
                >
                  {message.type === 'bot' ? (
                    <Bot size={20} />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div
                  className={`max-w-[80%] p-5 rounded-3xl shadow-xl ${
                    message.type === 'bot'
                      ? 'bg-dark-900/60 backdrop-blur-md border border-white/5 text-dark-100 rounded-tl-none'
                      : 'bg-gradient-to-br from-brand-orange to-[#ff914d] text-white rounded-tr-none'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed font-medium">{message.content}</p>
                  <div
                    className={`text-[10px] mt-3 font-bold uppercase tracking-wider ${
                      message.type === 'bot' ? 'text-dark-500' : 'text-white/60'
                    }`}
                  >
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        <footer className="relative z-10 border-t border-white/5 bg-dark-950/50 backdrop-blur-xl p-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative group">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isPaused && !isSubmitting && handleSendMessage()}
                placeholder={isPaused ? 'Paused — click Resume to continue' : isSubmitting ? 'Sending...' : 'Type your answer...'}
                disabled={isPaused || isSubmitting}
                className="w-full h-16 bg-dark-900/50 border border-white/10 rounded-2xl px-6 pr-20 text-white placeholder:text-dark-600 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:border-brand-orange/50 transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button 
                onClick={() => !isPaused && !isSubmitting && handleSendMessage()}
                disabled={isPaused || isSubmitting}
                className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-brand-orange text-white hover:bg-brand-orange/90 active:scale-95 transition-all shadow-lg shadow-brand-orange/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
               <div className="flex items-center gap-2 text-[10px] font-bold text-dark-500 uppercase tracking-widest">
                  <Star size={12} className="text-brand-orange" />
                  Evaluating Technical Depth
               </div>
               <div className="w-1 h-1 rounded-full bg-dark-700" />
               <div className="flex items-center gap-2 text-[10px] font-bold text-dark-500 uppercase tracking-widest">
                  <MessageSquare size={12} className="text-blue-500" />
                  Analyzing Logic
               </div>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // Loading/Complete Transition
  if (phase === 'complete') {
    setTimeout(() => setPhase('results'), 2000)

    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-dark-100 mb-2">
            Generating Your Feedback
          </h2>
          <p className="text-dark-400">Analyzing your responses...</p>
        </div>
      </div>
    )
  }

  // Results View
  return (
    <div className="relative min-h-screen bg-dark-950 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brand-orange/5 blur-[150px] rounded-full -translate-y-1/2 -translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[130px] rounded-full translate-y-1/3 translate-x-1/4 pointer-events-none" />

      <header className="relative z-10 border-b border-white/5 bg-dark-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
               <CheckCircle2 size={24} />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-white">Assessment Complete</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Results Dashboard */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-dark-900/40 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
              <div className="space-y-2 mb-10">
                <h2 className="text-4xl font-black text-white tracking-tight">Your Expertise <span className="text-brand-orange">Insights</span></h2>
                <p className="text-dark-400 text-lg font-medium">A comprehensive breakdown of your technical fit and market positioning.</p>
              </div>

              {/* Score Overview Board */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-8 rounded-[2rem] bg-white/5 border border-white/5 mb-10 shadow-inner">
                <div className="flex flex-col items-center justify-center gap-6">
                  <div className="relative">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="85"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="85"
                        stroke="url(#scoreGradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(results.overallScore / 100) * 534} 534`}
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#F97316" />
                          <stop offset="100%" stopColor="#FB923C" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-6xl font-black text-white tracking-tighter">
                        {results.overallScore}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-orange/60">Talent Score</span>
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-xl font-bold text-white">{results.competitiveness}</div>
                    <p className="text-xs text-dark-500 font-medium">Top 22% of all candidates in this category</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black uppercase tracking-widest text-dark-400">Technical Mastery</span>
                      <span className="text-xl font-black text-white">{results.scores.technical}%</span>
                    </div>
                    <div className="h-3 w-full bg-dark-800 rounded-full border border-white/5 overflow-hidden">
                       <div className="h-full bg-brand-orange shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-[1s]" style={{ width: `${results.scores.technical}%` }} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black uppercase tracking-widest text-dark-400">Problem Solving</span>
                      <span className="text-xl font-black text-white">{results.scores.problemSolving}%</span>
                    </div>
                    <div className="h-3 w-64 bg-dark-800 rounded-full border border-white/5 overflow-hidden">
                       <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-[1.2s]" style={{ width: `${results.scores.problemSolving}%` }} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black uppercase tracking-widest text-dark-400">Cultural Alignment</span>
                      <span className="text-xl font-black text-white">{results.scores.cultural}%</span>
                    </div>
                    <div className="h-3 w-48 bg-dark-800 rounded-full border border-white/5 overflow-hidden">
                       <div className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-[1.4s]" style={{ width: `${results.scores.cultural}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-[2rem] bg-green-500/5 border border-green-500/10 space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-widest text-green-500 flex items-center gap-2">
                    <Star size={20} /> Competitive Edge
                  </h3>
                  <div className="space-y-4">
                    {results.strengths.map((str, i) => (
                      <div key={i} className="flex gap-3">
                        <CheckCircle2 size={18} className="text-green-500/70 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-dark-200 leading-relaxed">{str}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 rounded-[2rem] bg-orange-500/5 border border-orange-500/10 space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-widest text-brand-orange flex items-center gap-2">
                    <AlertCircle size={20} /> Optimization areas
                  </h3>
                  <div className="space-y-4">
                    {results.gaps.map((gap, i) => (
                      <div key={i} className="flex gap-3">
                        <ArrowRight size={18} className="text-brand-orange/70 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-dark-200 leading-relaxed">{gap}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Market Positioning Section */}
            <div className="bg-dark-900/40 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
               <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                  <TrendingUp size={28} className="text-blue-500" />
                  Market Value & Intelligence
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center space-y-2">
                     <div className="text-4xl font-black text-blue-500">{results.marketIntelligence.percentile}</div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-dark-400">Skill Percentile</div>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center space-y-2">
                     <div className="text-4xl font-black text-white">{results.marketIntelligence.salaryRange}</div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-dark-400">Market Rate Est.</div>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center space-y-2">
                     <div className="text-4xl font-black text-green-500">{results.marketIntelligence.targetRange}</div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-dark-400">Potential Level-Up</div>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar - Actions & Path */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-dark-800 to-dark-950 border border-white/10 rounded-[2rem] p-8 shadow-2xl">
              <h3 className="text-xl font-black text-white mb-6">Immediate Actions</h3>
              <div className="space-y-4">
                 {results.nextSteps.map((step, i) => (
                    <div key={i} className="group p-4 bg-white/5 border border-white/5 hover:border-brand-orange/30 rounded-2xl transition-all cursor-pointer">
                       <div className="flex items-center justify-between mb-2">
                          <span className="w-6 h-6 rounded-full bg-brand-orange text-white text-[10px] font-black flex items-center justify-center">0{i+1}</span>
                          <ArrowRight size={14} className="text-dark-600 group-hover:text-brand-orange transition-colors" />
                       </div>
                       <h4 className="font-bold text-white text-sm mb-1">{step.title}</h4>
                       <p className="text-xs text-dark-400 leading-tight">{step.description}</p>
                    </div>
                 ))}
                 <Button className="w-full h-14 bg-brand-orange hover:bg-brand-orange/90 rounded-2xl font-black uppercase tracking-widest mt-4">
                    See 12+ More Matches
                 </Button>
              </div>
            </div>

            <div className="bg-dark-900 border border-white/5 rounded-[2rem] p-8 space-y-6">
               <h3 className="text-xl font-black text-white">Your Career Roadmap</h3>
               <div className="space-y-8 relative">
                  <div className="absolute left-3.5 top-2 bottom-2 w-px bg-white/5" />
                  <div className="relative pl-10">
                     <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-brand-orange/20 border-2 border-brand-orange flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-brand-orange" />
                     </div>
                     <h4 className="font-bold text-sm text-white">Month 1-3</h4>
                     <p className="text-xs text-dark-400">Deep dive into TypeScript Generics & advanced patterns</p>
                  </div>
                  <div className="relative pl-10">
                     <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-dark-800 border-2 border-white/10 flex items-center justify-center" />
                     <h4 className="font-bold text-sm text-white">Month 4-8</h4>
                     <p className="text-xs text-dark-400">Master AWS Architecture & IaC with Terraform</p>
                  </div>
                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-dark-800 border-2 border-white/10 flex items-center justify-center" />
                     <h4 className="font-bold text-sm text-white">Month 9-12</h4>
                     <p className="text-xs text-dark-400">Lead small pod & own end-to-end feature delivery</p>
                  </div>
               </div>
               <Button variant="secondary" className="w-full h-12 border-white/10 hover:bg-white/5 font-bold">
                  Download full PDF
               </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
