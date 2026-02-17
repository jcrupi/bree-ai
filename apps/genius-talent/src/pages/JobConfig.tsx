import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  Users,
  Play,
  Settings,
} from 'lucide-react'
import { Button, Card, Input, Badge, Progress, PageHeader } from '@bree-ai/core/components'

type ConfigStep = 1 | 2 | 3 | 4

export default function JobConfig() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState<ConfigStep>(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [configComplete, setConfigComplete] = useState(false)

  const [formData, setFormData] = useState({
    jobDescription: `Senior DevOps Engineer

TechCorp is seeking an experienced DevOps Engineer to lead our infrastructure automation initiatives.

Responsibilities:
- Design and implement scalable Kubernetes infrastructure
- Manage AWS cloud environments and optimize costs
- Build CI/CD pipelines using modern tools
- Lead incident response and on-call rotation
- Mentor junior engineers

Requirements:
- 5+ years DevOps experience
- Expert-level Kubernetes and containerization
- Strong AWS experience (EC2, S3, RDS, Lambda)
- Infrastructure as Code (Terraform, CloudFormation)
- Python or Go for automation
- Experience with monitoring tools (Datadog, Prometheus, Grafana)`,
    companyWebsite: 'https://techcorp.com',
    skills: [
      { name: 'Kubernetes', level: 'Expert', weight: 'High', method: 'Design questions' },
      { name: 'AWS', level: 'Proficient', weight: 'High', method: 'Design questions' },
      { name: 'Terraform', level: 'Intermediate', weight: 'Medium', method: 'Code review' },
      { name: 'Python', level: 'Working knowledge', weight: 'Medium', method: 'Code review' },
    ],
    niceToHave: ['Go programming', 'GitOps practices', 'Security best practices'],
  })

  const configSummary = {
    technicalRequirements: [
      { skill: 'Kubernetes', level: 'Expert (4/5)', priority: 'High' },
      { skill: 'AWS', level: 'Advanced (3/5)', priority: 'High' },
      { skill: 'Terraform', level: 'Intermediate (2/5)', priority: 'Medium' },
      { skill: 'Python', level: 'Intermediate (2/5)', priority: 'Medium' },
    ],
    culturalExpectations: {
      environment: 'Fast-paced startup, autonomous workers, highly collaborative',
      criticalTraits: 'Initiative, comfort with ambiguity, clear communication',
      dealBreakers: 'Needs constant direction, can\'t handle on-call',
    },
    scoringConfig: {
      technical: 50,
      problemSolving: 25,
      cultural: 15,
      communication: 10,
    },
    sampleQuestions: [
      "Can you walk me through how you'd design a highly available Kubernetes cluster for a financial services application?",
      "Tell me about a time when you had to troubleshoot a production incident. How did you approach it?",
      "Describe your experience working in remote teams. How do you handle asynchronous communication?",
      "What's your philosophy on infrastructure as code? How have you implemented it with Terraform?",
    ],
    timeInvestment: {
      configTime: '45 min',
      assessmentTime: '12 min',
      capacity: '500+',
    },
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setCurrentStep(2)
    }, 2000)
  }

  const handleComplete = () => {
    setConfigComplete(true)
    setTimeout(() => {
      setCurrentStep(4)
    }, 1500)
  }

  const steps = [
    { number: 1, label: 'General Skills', icon: Settings },
    { number: 2, label: 'Lookback Q\'s', icon: Sparkles },
    { number: 3, label: 'Scoring & Thresholds', icon: CheckCircle2 },
    { number: 4, 'Device Assistant': '', icon: Zap },
  ]

  return (
    <>
      {/* Header */}
      <button
        onClick={() => navigate('/dashboard/jobs')}
        className="inline-flex items-center gap-2 text-dark-400 hover:text-dark-200 mb-4"
      >
        <ArrowLeft size={16} />
        Back to Jobs
      </button>

      <PageHeader
        title="Auto-Configure AI Job Screening Agent"
        description="Paste your job description below or upload a file, and we'll set up your screening agent in seconds."
      />

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 max-w-3xl">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold
                ${
                  currentStep >= step
                    ? 'bg-brand-orange text-white'
                    : 'bg-dark-700 text-dark-400'
                }
              `}
            >
              {currentStep > step ? <CheckCircle2 size={20} /> : step}
            </div>
            {step < 4 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  currentStep > step ? 'bg-brand-orange' : 'bg-dark-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Job Description */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Card>
              <h3 className="text-lg font-semibold text-dark-100 mb-4">Job Description</h3>
              <textarea
                value={formData.jobDescription}
                onChange={(e) =>
                  setFormData({ ...formData, jobDescription: e.target.value })
                }
                className="w-full h-64 bg-dark-700 border border-dark-600 rounded-lg p-4 text-dark-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-orange"
                placeholder="Paste your job description here..."
              />
              <div className="flex items-center gap-2 mt-4">
                <Button variant="secondary" size="sm" leftIcon={<Upload size={16} />}>
                  Upload File
                </Button>
                <span className="text-dark-500 text-sm">or paste above</span>
              </div>
            </Card>

            <Card className="mt-4">
              <h3 className="text-lg font-semibold text-dark-100 mb-4">
                Company Website (Optional)
              </h3>
              <Input
                value={formData.companyWebsite}
                onChange={(e) =>
                  setFormData({ ...formData, companyWebsite: e.target.value })
                }
                placeholder="https://yourcompany.com"
                leftIcon={<LinkIcon size={18} />}
              />
              <p className="text-sm text-dark-500 mt-2">
                We'll review your company and culture page to understand fit criteria.
              </p>
            </Card>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={handleGenerate}
                isLoading={isGenerating}
                leftIcon={!isGenerating ? <Sparkles size={18} /> : undefined}
                className="flex-1"
              >
                {isGenerating ? 'Analyzing...' : 'Generate Configuration'}
              </Button>
              <Button variant="ghost">Use manual config</Button>
            </div>
          </div>

          <div>
            <Card className="bg-dark-800/50 border-brand-orange/30">
              <div className="flex items-center gap-2 text-brand-orange mb-4">
                <Zap size={20} />
                <h3 className="font-semibold">3-Minute Auto-Configuration</h3>
              </div>
              <p className="text-dark-400 mb-4">
                Our AI will analyze your job description to extract:
              </p>
              <ul className="space-y-3">
                {[
                  'Required technical skills and proficiency levels',
                  'Cultural and behavioral requirements',
                  'Must-have vs nice-to-have qualifications',
                  'Custom screening questions',
                  'Scoring weights and thresholds',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-dark-300">
                    <CheckCircle2 size={16} className="text-success mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-6 p-4 bg-dark-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-dark-400">Traditional Setup Time</span>
                  <span className="text-dark-500 line-through">45 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">With Genius Talent.ai</span>
                  <span className="text-brand-orange font-semibold">~3 minutes</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Skills Configuration */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-dark-100">Senior DevOps Engineer</h3>
                <div className="flex items-center gap-2 text-sm text-dark-400">
                  <Clock size={14} />
                  Configuration Time: 45 min
                </div>
              </div>

              {/* Progress Steps */}
              <div className="flex gap-4 mb-6">
                {['General Skills', 'Lookback Q\'s', 'Scoring & Thresholds', 'Device Assistant'].map(
                  (step, i) => (
                    <div
                      key={step}
                      className={`flex-1 text-center pb-2 border-b-2 ${
                        i === 0 ? 'border-brand-orange text-brand-orange' : 'border-dark-700 text-dark-500'
                      }`}
                    >
                      <span className="text-sm font-medium">{i + 1}</span>
                      <p className="text-xs mt-1">{step}</p>
                    </div>
                  )
                )}
              </div>

              <div className="p-4 bg-brand-orange/10 border border-brand-orange/30 rounded-lg mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className="text-brand-orange mt-0.5" />
                  <div>
                    <p className="font-medium text-brand-orange">Configuration Tip</p>
                    <p className="text-sm text-dark-300">
                      Define the MUST-HAVE technical skills first. Be specific about proficiency
                      levels - the AI will test at the level you specify.
                    </p>
                  </div>
                </div>
              </div>

              <h4 className="font-medium text-dark-100 mb-4">Required Technical Skills</h4>
              <p className="text-sm text-dark-400 mb-4">
                What technical skills MUST candidates have? Specify proficiency levels and how
                important it is.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left py-2 px-3 text-sm font-medium text-dark-400">
                        Skill
                      </th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-dark-400">
                        Required Level
                      </th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-dark-400">
                        Weight
                      </th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-dark-400">
                        Test Method
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.skills.map((skill, i) => (
                      <tr key={i} className="border-b border-dark-700/50">
                        <td className="py-3 px-3">
                          <span className="font-medium text-dark-100">{skill.name}</span>
                        </td>
                        <td className="py-3 px-3">
                          <select className="bg-dark-700 border border-dark-600 rounded px-3 py-1.5 text-sm text-dark-200">
                            <option>{skill.level}</option>
                            <option>Expert</option>
                            <option>Proficient</option>
                            <option>Intermediate</option>
                            <option>Working knowledge</option>
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <select className="bg-dark-700 border border-dark-600 rounded px-3 py-1.5 text-sm text-dark-200">
                            <option>{skill.weight}</option>
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <select className="bg-dark-700 border border-dark-600 rounded px-3 py-1.5 text-sm text-dark-200">
                            <option>{skill.method}</option>
                            <option>Design questions</option>
                            <option>Code review</option>
                            <option>Scenario</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button variant="ghost" size="sm" className="mt-4">
                + Add Another Skill
              </Button>

              <div className="mt-8">
                <h4 className="font-medium text-dark-100 mb-4">Nice-to-Have Skills (Optional)</h4>
                <p className="text-sm text-dark-400 mb-4">
                  These won't disqualify candidates but will boost scores if present
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.niceToHave.map((skill, i) => (
                    <Badge key={i} variant="default" className="cursor-pointer">
                      {skill} ×
                    </Badge>
                  ))}
                  <button className="text-sm text-brand-orange hover:underline">Add</button>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft size={16} className="mr-2" />
                  Back
                </Button>
                <Button onClick={() => setCurrentStep(3)}>
                  Continue
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          <div>
            <Card className="sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-success" />
                </div>
                <h3 className="font-semibold text-dark-100">AI Agent Configuration Complete!</h3>
              </div>
              <p className="text-sm text-dark-400 mb-4">
                Review your configuration and test the agent.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-dark-200 mb-2">
                    Configuration Summary
                  </h4>
                  <div className="text-xs text-dark-400 space-y-1">
                    <p>
                      <span className="text-dark-300">Technical Requirements:</span>
                    </p>
                    {configSummary.technicalRequirements.map((req, i) => (
                      <p key={i} className="ml-2">
                        • {req.skill}: {req.level} - {req.priority} priority
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-dark-200 mb-2">Cultural Expectations</h4>
                  <div className="text-xs text-dark-400 space-y-1">
                    <p>
                      <span className="text-dark-300">Environment:</span>{' '}
                      {configSummary.culturalExpectations.environment}
                    </p>
                    <p>
                      <span className="text-dark-300">Critical Traits:</span>{' '}
                      {configSummary.culturalExpectations.criticalTraits}
                    </p>
                    <p>
                      <span className="text-dark-300">Deal Breakers:</span>{' '}
                      {configSummary.culturalExpectations.dealBreakers}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-dark-200 mb-2">Scoring Configuration</h4>
                  <div className="space-y-2">
                    {Object.entries(configSummary.scoringConfig).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-dark-400 capitalize w-24">{key}</span>
                        <Progress value={value} size="sm" variant="gradient" />
                        <span className="text-xs text-dark-300">{value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-dark-700/50 rounded-lg mb-4">
                <h4 className="text-sm font-medium text-dark-200 mb-2">
                  Sample AI Questions Generated
                </h4>
                <ul className="text-xs text-dark-400 space-y-2">
                  {configSummary.sampleQuestions.slice(0, 2).map((q, i) => (
                    <li key={i}>• "{q.substring(0, 80)}..."</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-dark-700/50 rounded">
                  <p className="text-lg font-bold text-brand-orange">
                    {configSummary.timeInvestment.configTime}
                  </p>
                  <p className="text-xs text-dark-500">Config time</p>
                </div>
                <div className="text-center p-2 bg-dark-700/50 rounded">
                  <p className="text-lg font-bold text-brand-orange">
                    {configSummary.timeInvestment.assessmentTime}
                  </p>
                  <p className="text-xs text-dark-500">Per assessment</p>
                </div>
                <div className="text-center p-2 bg-dark-700/50 rounded">
                  <p className="text-lg font-bold text-brand-orange">
                    {configSummary.timeInvestment.capacity}
                  </p>
                  <p className="text-xs text-dark-500">Candidates</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1">
                  <Play size={14} className="mr-1" />
                  Test Agent
                </Button>
                <Button className="flex-1" onClick={handleComplete}>
                  <Zap size={14} className="mr-1" />
                  Activate
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <div className="max-w-3xl mx-auto">
          <Card>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-success" />
              </div>
              <h2 className="text-2xl font-bold text-dark-100 mb-2">
                Configuration Ready!
              </h2>
              <p className="text-dark-400">
                Your AI screening agent is configured and ready to assess candidates.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-dark-700/50 rounded-lg">
                <p className="text-3xl font-bold text-brand-orange">45 min</p>
                <p className="text-sm text-dark-400">Configuration time saved</p>
              </div>
              <div className="text-center p-4 bg-dark-700/50 rounded-lg">
                <p className="text-3xl font-bold text-brand-orange">12 min</p>
                <p className="text-sm text-dark-400">Per candidate assessment</p>
              </div>
              <div className="text-center p-4 bg-dark-700/50 rounded-lg">
                <p className="text-3xl font-bold text-brand-orange">500+</p>
                <p className="text-sm text-dark-400">Candidates this agent can assess</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="secondary"
                className="flex-1"
                leftIcon={<Play size={18} />}
              >
                Test Agent with Sample Candidate
              </Button>
              <Button
                className="flex-1"
                onClick={handleComplete}
                leftIcon={<Zap size={18} />}
              >
                Activate & Go Live
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Step 4: Success */}
      {currentStep === 4 && (
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <CheckCircle2 size={40} className="text-success" />
          </div>
          <h1 className="text-3xl font-bold text-dark-100 mb-4">
            Your AI Agent is Live!
          </h1>
          <p className="text-lg text-dark-400 mb-8">
            Candidates can now interact with your job and receive instant feedback.
            You'll be notified as assessments come in.
          </p>

          <Card className="mb-8">
            <h3 className="font-semibold text-dark-100 mb-4">Share this link with candidates:</h3>
            <div className="flex gap-2">
              <Input
                value="https://app.geniusmatch.com/jobs/senior-devops-techcorp"
                readOnly
                className="flex-1"
              />
              <Button>Copy Link</Button>
            </div>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button
              variant="secondary"
              onClick={() => navigate('/dashboard/jobs')}
            >
              View All Jobs
            </Button>
            <Button onClick={() => navigate('/dashboard/jobs/1')}>
              View This Job
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
