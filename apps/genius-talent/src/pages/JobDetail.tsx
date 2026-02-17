import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Calendar,
  DollarSign,
  MapPin,
  Eye,
  MessageSquare,
  Settings,
  Play,
} from 'lucide-react'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
  Avatar,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  PageHeader,
} from '@bree-ai/core/components'

export default function JobDetail() {
  const { id } = useParams()
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null)

  // Mock job data
  const job = {
    id: 1,
    title: 'Senior DevOps Engineer',
    company: 'TechCorp',
    location: 'Remote',
    salary: '$155-180K',
    description: `TechCorp is seeking an experienced DevOps Engineer to lead our infrastructure automation initiatives. We are looking for someone who combines strategic thinking with hands-on technical excellence.`,
    requirements: [
      '5+ years DevOps experience',
      'Expert-level Kubernetes and containerization',
      'Strong AWS experience (EC2, S3, RDS, Lambda)',
      'Infrastructure as Code (Terraform, CloudFormation)',
      'Python or Go for automation',
    ],
    status: 'active',
    configTime: '45 min',
    createdAt: '2 days ago',
    totalCandidates: 127,
    qualified: 18,
    timeSaved: '13hrs',
    avgScore: 68,
  }

  const candidates = [
    {
      id: 1,
      name: 'Michael Chen',
      score: 92,
      technical: 95,
      problemSolving: 90,
      cultural: 88,
      experience: 91,
      status: 'new',
      strengths: ['Kubernetes expert', 'Strong architecture skills', 'Excellent communication'],
      concerns: ['Limited Go experience'],
      recommendation: 'Strongly recommend phone screen',
    },
    {
      id: 2,
      name: 'Sarah Rodriguez',
      score: 89,
      technical: 88,
      problemSolving: 92,
      cultural: 86,
      experience: 89,
      status: 'reviewed',
      strengths: ['AWS certified', 'Terraform proficiency', 'Team leadership'],
      concerns: ['Salary expectations high'],
      recommendation: 'Recommend for technical interview',
    },
    {
      id: 3,
      name: 'David Park',
      score: 87,
      technical: 90,
      problemSolving: 85,
      cultural: 84,
      experience: 88,
      status: 'new',
      strengths: ['CI/CD automation', 'Security focus', 'Fast learner'],
      concerns: ['No on-call experience'],
      recommendation: 'Consider for team fit assessment',
    },
    {
      id: 4,
      name: 'Jennifer Wilson',
      score: 82,
      technical: 80,
      problemSolving: 85,
      cultural: 82,
      experience: 80,
      status: 'shortlisted',
      strengths: ['Strong Python skills', 'Documentation quality'],
      concerns: ['Kubernetes basics only'],
      recommendation: 'Good potential with training',
    },
    {
      id: 5,
      name: 'Alex Thompson',
      score: 78,
      technical: 75,
      problemSolving: 80,
      cultural: 78,
      experience: 79,
      status: 'new',
      strengths: ['Eager to learn', 'Strong communication'],
      concerns: ['Limited cloud experience'],
      recommendation: 'May need more experience',
    },
  ]

  const skillsGapAnalysis = [
    { skill: 'Kubernetes (Expert)', met: 14, requirement: '94% meet requirement' },
    { skill: 'AWS (Advanced)', met: 67, requirement: '67% meet requirement' },
    { skill: 'Terraform (Intermediate)', met: 62, requirement: '62% meet requirement' },
    { skill: 'Python (Intermediate)', met: 45, requirement: '45% meet requirement' },
  ]

  const marketIntelligence = {
    scarcity: 'High',
    timeToFill: '45-60 days',
    salaryRange: '$155-180K',
  }

  const scoreDistribution = [
    { range: '85-100 (Strong Match)', count: 18, color: 'bg-success' },
    { range: '75-84 (Qualified)', count: 32, color: 'bg-brand-orange' },
    { range: '60-69 (Close)', count: 45, color: 'bg-warning' },
    { range: 'Below 60 (Not Qualified)', count: 32, color: 'bg-error' },
  ]

  const selectedCandidateData = candidates.find((c) => c.id === selectedCandidate)

  return (
    <>
      <Link
        to="/dashboard/jobs"
        className="inline-flex items-center gap-2 text-dark-400 hover:text-dark-200 mb-4"
      >
        <ArrowLeft size={16} />
        Back to Jobs
      </Link>

      <PageHeader
        title={job.title}
        subtitle={job.company}
        description={`${job.location} • ${job.salary} • Created ${job.createdAt}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" leftIcon={<Settings size={18} />}>Edit Job</Button>
            <Button leftIcon={<Play size={18} />}>Share Link</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info/20 rounded-lg">
              <Users size={20} className="text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-dark-100">{job.totalCandidates}</p>
              <p className="text-xs text-dark-400">Total Assessed</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/20 rounded-lg">
              <CheckCircle2 size={20} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{job.qualified}</p>
              <p className="text-xs text-dark-400">Qualified (85+)</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/20 rounded-lg">
              <Clock size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">{job.timeSaved}</p>
              <p className="text-xs text-dark-400">Time Saved</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-orange/20 rounded-lg">
              <BarChart3 size={20} className="text-brand-orange" />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-orange">{job.avgScore}</p>
              <p className="text-xs text-dark-400">Avg Score</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="candidates">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="candidates">Candidates ({job.totalCandidates})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <p className="text-dark-300 mb-4">{job.description}</p>
              <h4 className="font-medium text-dark-100 mb-2">Requirements:</h4>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-dark-400">
                    <CheckCircle2 size={16} className="text-success mt-0.5 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                {scoreDistribution.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-dark-400">{item.range}</span>
                      <span className="text-dark-200 font-medium">{item.count}</span>
                    </div>
                    <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${(item.count / job.totalCandidates) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="candidates">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Candidates List */}
            <div className="lg:col-span-2">
              <Card padding="none">
                <div className="p-4 border-b border-dark-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-dark-100">All Candidates</h3>
                    <div className="flex gap-2">
                      <Badge>All (127)</Badge>
                      <Badge variant="orange">Advance (18)</Badge>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-dark-700/50">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedCandidate(candidate.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedCandidate === candidate.id
                          ? 'bg-brand-orange/10'
                          : 'hover:bg-dark-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar name={candidate.name} />
                          <div>
                            <p className="font-medium text-dark-100">{candidate.name}</p>
                            <Badge
                              size="sm"
                              variant={
                                candidate.status === 'new'
                                  ? 'orange'
                                  : candidate.status === 'shortlisted'
                                  ? 'success'
                                  : 'default'
                              }
                            >
                              {candidate.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p
                              className={`text-xl font-bold ${
                                candidate.score >= 85
                                  ? 'text-success'
                                  : candidate.score >= 75
                                  ? 'text-brand-orange'
                                  : 'text-warning'
                              }`}
                            >
                              {candidate.score}
                            </p>
                            <p className="text-xs text-dark-500">Overall</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-dark-200">
                              {candidate.technical}
                            </p>
                            <p className="text-xs text-dark-500">Technical</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-dark-200">
                              {candidate.problemSolving}
                            </p>
                            <p className="text-xs text-dark-500">Problem</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-dark-200">
                              {candidate.cultural}
                            </p>
                            <p className="text-xs text-dark-500">Cultural</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Candidate Detail */}
            <div>
              {selectedCandidateData ? (
                <Card>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name={selectedCandidateData.name} size="lg" />
                    <div>
                      <h3 className="font-semibold text-dark-100">
                        {selectedCandidateData.name}
                      </h3>
                      <Badge
                        variant={
                          selectedCandidateData.status === 'new'
                            ? 'orange'
                            : selectedCandidateData.status === 'shortlisted'
                            ? 'success'
                            : 'default'
                        }
                      >
                        {selectedCandidateData.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 bg-dark-700/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-success">
                        {selectedCandidateData.score}
                      </p>
                      <p className="text-xs text-dark-500">Overall</p>
                    </div>
                    <div className="p-3 bg-dark-700/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-dark-200">
                        {selectedCandidateData.technical}
                      </p>
                      <p className="text-xs text-dark-500">Technical</p>
                    </div>
                    <div className="p-3 bg-dark-700/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-dark-200">
                        {selectedCandidateData.problemSolving}
                      </p>
                      <p className="text-xs text-dark-500">Problem Solving</p>
                    </div>
                    <div className="p-3 bg-dark-700/50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-dark-200">
                        {selectedCandidateData.cultural}
                      </p>
                      <p className="text-xs text-dark-500">Cultural Fit</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-success mb-2 flex items-center gap-1">
                      <CheckCircle2 size={14} />
                      Key Strengths
                    </h4>
                    <ul className="space-y-1">
                      {selectedCandidateData.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-dark-300">
                          • {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-warning mb-2 flex items-center gap-1">
                      <AlertCircle size={14} />
                      Points to Explore
                    </h4>
                    <ul className="space-y-1">
                      {selectedCandidateData.concerns.map((c, i) => (
                        <li key={i} className="text-sm text-dark-300">
                          • {c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-brand-orange/10 rounded-lg mb-4">
                    <h4 className="text-sm font-medium text-brand-orange mb-1 flex items-center gap-1">
                      <Lightbulb size={14} />
                      AI Recommendation
                    </h4>
                    <p className="text-sm text-dark-300">
                      {selectedCandidateData.recommendation}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1">Schedule Interview</Button>
                    <Button variant="secondary" className="flex-1">
                      <MessageSquare size={16} />
                    </Button>
                    <Button variant="secondary" className="flex-1">
                      <Eye size={16} />
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="text-center py-12">
                  <Users size={48} className="text-dark-600 mx-auto mb-4" />
                  <p className="text-dark-400">Select a candidate to view details</p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills Gap Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Gap Analysis</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                {skillsGapAnalysis.map((skill, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-dark-300">{skill.skill}</span>
                      <span className="text-dark-400">{skill.requirement}</span>
                    </div>
                    <Progress
                      value={skill.met}
                      variant={skill.met > 80 ? 'success' : skill.met > 50 ? 'warning' : 'error'}
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Market Intelligence */}
            <Card>
              <CardHeader>
                <CardTitle>Market Intelligence</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                <div className="p-4 bg-dark-700/50 rounded-lg">
                  <p className="text-sm text-dark-400 mb-1">Talent Scarcity Index</p>
                  <p className="text-2xl font-bold text-error">{marketIntelligence.scarcity}</p>
                  <p className="text-xs text-dark-500">Few candidates meeting all requirements</p>
                </div>
                <div className="p-4 bg-dark-700/50 rounded-lg">
                  <p className="text-sm text-dark-400 mb-1">Avg Time to Fill Estimate</p>
                  <p className="text-2xl font-bold text-warning">
                    {marketIntelligence.timeToFill}
                  </p>
                  <p className="text-xs text-dark-500">For candidates scoring 85+ on all criteria</p>
                </div>
                <div className="p-4 bg-dark-700/50 rounded-lg">
                  <p className="text-sm text-dark-400 mb-1">Competitive Salary Range</p>
                  <p className="text-2xl font-bold text-success">
                    {marketIntelligence.salaryRange}
                  </p>
                  <p className="text-xs text-dark-500">For candidates scoring 85+ on all criteria</p>
                </div>
              </div>
            </Card>

            {/* AI Insights */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="text-brand-orange" size={20} />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-dark-700/50 rounded-lg border-l-4 border-brand-orange">
                  <h4 className="font-medium text-dark-100 mb-2">
                    Consider Adjusting Kubernetes Requirement
                  </h4>
                  <p className="text-sm text-dark-400">
                    Only 14% of candidates scored 85+ on Kubernetes vs. 67% on AWS. Relaxing
                    to "Advanced" level would 3x your qualified pipeline while maintaining
                    quality.
                  </p>
                </div>
                <div className="p-4 bg-dark-700/50 rounded-lg border-l-4 border-warning">
                  <h4 className="font-medium text-dark-100 mb-2">Hiring Timeline Adjustment</h4>
                  <p className="text-sm text-dark-400">
                    Current requirements suggest 45-60 day fill time. If faster hiring needed,
                    consider training opportunities for near-qualified candidates.
                  </p>
                </div>
                <div className="p-4 bg-dark-700/50 rounded-lg border-l-4 border-success">
                  <h4 className="font-medium text-dark-100 mb-2">Compensation Benchmarking</h4>
                  <p className="text-sm text-dark-400">
                    Top candidates (90+ score) are commanding $165K+. Your budget of $155-180K
                    is competitive for this role.
                  </p>
                </div>
                <div className="p-4 bg-dark-700/50 rounded-lg border-l-4 border-info">
                  <h4 className="font-medium text-dark-100 mb-2">Top Performer Pattern</h4>
                  <p className="text-sm text-dark-400">
                    All 18 strong matches mentioned specific production incident they resolved.
                    Consider adding "on-call experience" as explicit criterion.
                  </p>
                </div>
              </div>
            </Card>

            {/* Efficiency Metrics */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Efficiency Metrics</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-dark-700/50 rounded-lg">
                  <p className="text-3xl font-bold text-success mb-1">65%</p>
                  <p className="text-dark-400">Time Savings vs Manual</p>
                  <p className="text-xs text-dark-500">13 hours saved this period</p>
                </div>
                <div className="text-center p-4 bg-dark-700/50 rounded-lg">
                  <p className="text-3xl font-bold text-brand-orange mb-1">3.6x</p>
                  <p className="text-dark-400">Faster to Interview</p>
                  <p className="text-xs text-dark-500">5 days vs 18 days average</p>
                </div>
                <div className="text-center p-4 bg-dark-700/50 rounded-lg">
                  <p className="text-3xl font-bold text-info mb-1">100%</p>
                  <p className="text-dark-400">Candidate Feedback Rate</p>
                  <p className="text-xs text-dark-500">vs 0% with traditional process</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
