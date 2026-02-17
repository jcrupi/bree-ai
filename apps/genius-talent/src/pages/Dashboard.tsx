import { Link } from 'react-router-dom'
import {
  Users,
  Briefcase,
  Clock,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Plus,
  Eye,
} from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, Badge, Progress, Avatar, PageHeader } from '@bree-ai/core/components'

export default function Dashboard() {
  const stats = [
    {
      label: 'Total Assessed',
      value: '127',
      change: '+12',
      changeLabel: 'last 14 days',
      icon: Users,
      color: 'text-info',
    },
    {
      label: 'Qualified (85+)',
      value: '18',
      change: '14%',
      changeLabel: 'of total',
      icon: CheckCircle2,
      color: 'text-success',
    },
    {
      label: 'Time Saved',
      value: '13hrs',
      change: '65%',
      changeLabel: 'vs manual screening',
      icon: Clock,
      color: 'text-warning',
    },
    {
      label: 'Avg Score',
      value: '68',
      change: '+5',
      changeLabel: 'across all candidates',
      icon: BarChart3,
      color: 'text-brand-orange',
    },
  ]

  const recentJobs = [
    {
      id: 1,
      title: 'Senior DevOps Engineer',
      company: 'TechCorp',
      candidates: 45,
      qualified: 8,
      status: 'active',
      avgScore: 72,
    },
    {
      id: 2,
      title: 'Lead Full Stack Developer',
      company: 'StartupXYZ',
      candidates: 32,
      qualified: 5,
      status: 'active',
      avgScore: 68,
    },
    {
      id: 3,
      title: 'Frontend Engineer',
      company: 'Acme Corp',
      candidates: 50,
      qualified: 12,
      status: 'active',
      avgScore: 75,
    },
  ]

  const topCandidates = [
    {
      id: 1,
      name: 'Michael Chen',
      role: 'Senior DevOps Engineer',
      score: 92,
      technical: 95,
      problemSolving: 90,
      cultural: 88,
      status: 'new',
    },
    {
      id: 2,
      name: 'Sarah Rodriguez',
      role: 'Senior DevOps Engineer',
      score: 89,
      technical: 88,
      problemSolving: 92,
      cultural: 86,
      status: 'reviewed',
    },
    {
      id: 3,
      name: 'David Park',
      role: 'Lead Full Stack Developer',
      score: 87,
      technical: 90,
      problemSolving: 85,
      cultural: 84,
      status: 'new',
    },
  ]

  const scoreDistribution = [
    { range: '85-100 (Strong Match)', count: 18, percentage: 14 },
    { range: '75-84 (Qualified)', count: 32, percentage: 25 },
    { range: '60-69 (Close)', count: 45, percentage: 35 },
    { range: 'Below 60 (Not Qualified)', count: 32, percentage: 26 },
  ]

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's your hiring overview."
        actions={
          <Link to="/dashboard/jobs/new">
            <Button leftIcon={<Plus size={18} />}>Create New Job</Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat, index) => (
          <Card key={index} hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-dark-400 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-dark-100">{stat.value}</p>
                <p className="text-xs text-dark-500 mt-1">
                  <span className={stat.color}>{stat.change}</span> {stat.changeLabel}
                </p>
              </div>
              <div className={`p-2 rounded-lg bg-dark-700 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Jobs */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Jobs</CardTitle>
              <Link to="/dashboard/jobs">
                <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight size={16} />}>
                  View All
                </Button>
              </Link>
            </CardHeader>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 bg-dark-700/50 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-orange/20 rounded-lg flex items-center justify-center">
                      <Briefcase size={20} className="text-brand-orange" />
                    </div>
                    <div>
                      <h4 className="font-medium text-dark-100">{job.title}</h4>
                      <p className="text-sm text-dark-400">{job.company}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-dark-100">
                        {job.candidates}
                      </p>
                      <p className="text-xs text-dark-500">Assessed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-success">{job.qualified}</p>
                      <p className="text-xs text-dark-500">Qualified</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-brand-orange">
                        {job.avgScore}
                      </p>
                      <p className="text-xs text-dark-500">Avg Score</p>
                    </div>
                    <Link to={`/dashboard/jobs/${job.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye size={16} />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Score Distribution */}
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
                <Progress
                  value={item.percentage}
                  variant={
                    index === 0
                      ? 'success'
                      : index === 1
                      ? 'gradient'
                      : index === 2
                      ? 'warning'
                      : 'error'
                  }
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Candidates */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Candidates</CardTitle>
          <Link to="/dashboard/candidates">
            <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight size={16} />}>
              View All
            </Button>
          </Link>
        </CardHeader>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[800px] px-4 sm:px-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">
                  Candidate
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">
                  Applied For
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-400">
                  Overall
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-400">
                  Technical
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-400">
                  Problem Solving
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-400">
                  Cultural
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-dark-400">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-dark-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {topCandidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="border-b border-dark-700/50 hover:bg-dark-800/50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={candidate.name} size="sm" />
                      <span className="font-medium text-dark-100">{candidate.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-dark-300">{candidate.role}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-success/20 text-success font-bold">
                      {candidate.score}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-dark-200">
                    {candidate.technical}
                  </td>
                  <td className="py-3 px-4 text-center text-dark-200">
                    {candidate.problemSolving}
                  </td>
                  <td className="py-3 px-4 text-center text-dark-200">
                    {candidate.cultural}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={candidate.status === 'new' ? 'orange' : 'default'}>
                      {candidate.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to={`/dashboard/candidates/${candidate.id}`}>
                      <Button variant="secondary" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </Card>

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
        <Card className="text-center">
          <p className="text-4xl font-bold text-success mb-2">65%</p>
          <p className="text-dark-400">Time Savings vs Manual</p>
          <p className="text-xs text-dark-500 mt-1">13 hours saved this period</p>
        </Card>
        <Card className="text-center">
          <p className="text-4xl font-bold text-brand-orange mb-2">3.6x</p>
          <p className="text-dark-400">Faster to Interview</p>
          <p className="text-xs text-dark-500 mt-1">5 days vs 18 days average</p>
        </Card>
        <Card className="text-center">
          <p className="text-4xl font-bold text-info mb-2">100%</p>
          <p className="text-dark-400">Candidate Feedback Rate</p>
          <p className="text-xs text-dark-500 mt-1">vs 0% with traditional process</p>
        </Card>
      </div>
    </>
  )
}
