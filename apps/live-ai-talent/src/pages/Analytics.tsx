import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle2,
  BarChart3,
  Target,
  Zap,
  DollarSign,
  Calendar,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, Progress, Badge, PageHeader } from '@bree-ai/core/components'

export default function Analytics() {
  const overviewStats = [
    {
      label: 'Total Assessments',
      value: '1,247',
      change: '+18%',
      trend: 'up',
      icon: Users,
      color: 'text-info',
    },
    {
      label: 'Qualified Rate',
      value: '24%',
      change: '+3%',
      trend: 'up',
      icon: CheckCircle2,
      color: 'text-success',
    },
    {
      label: 'Avg Time to Fill',
      value: '18 days',
      change: '-40%',
      trend: 'up',
      icon: Clock,
      color: 'text-warning',
    },
    {
      label: 'Time Saved',
      value: '156 hrs',
      change: '+22%',
      trend: 'up',
      icon: Zap,
      color: 'text-brand-orange',
    },
  ]

  const monthlyData = [
    { month: 'Jan', assessments: 89, qualified: 18, hired: 5 },
    { month: 'Feb', assessments: 124, qualified: 28, hired: 8 },
    { month: 'Mar', assessments: 156, qualified: 35, hired: 11 },
    { month: 'Apr', assessments: 198, qualified: 48, hired: 14 },
    { month: 'May', assessments: 234, qualified: 58, hired: 18 },
    { month: 'Jun', assessments: 278, qualified: 72, hired: 22 },
  ]

  const jobPerformance = [
    { title: 'Senior DevOps Engineer', assessments: 127, qualified: 18, avgScore: 72, fillRate: 85 },
    { title: 'Lead Full Stack Developer', assessments: 98, qualified: 14, avgScore: 68, fillRate: 78 },
    { title: 'Frontend Engineer', assessments: 156, qualified: 28, avgScore: 71, fillRate: 92 },
    { title: 'Backend Engineer', assessments: 89, qualified: 12, avgScore: 65, fillRate: 70 },
    { title: 'Cloud Architect', assessments: 45, qualified: 6, avgScore: 74, fillRate: 65 },
  ]

  const efficiencyMetrics = [
    {
      metric: 'Time Savings vs Manual Screening',
      value: 65,
      detail: '156 hours saved this quarter',
      benchmark: 'Industry avg: 40%',
    },
    {
      metric: 'Faster to First Interview',
      value: 78,
      detail: '5 days vs 18 days traditional',
      benchmark: '3.6x improvement',
    },
    {
      metric: 'Candidate Feedback Rate',
      value: 100,
      detail: 'All candidates receive feedback',
      benchmark: 'Industry avg: 30%',
    },
    {
      metric: 'Hiring Manager Satisfaction',
      value: 92,
      detail: 'Based on post-hire surveys',
      benchmark: 'Target: 85%',
    },
  ]

  const skillsGapTrends = [
    { skill: 'Kubernetes', demand: 85, supply: 42, gap: 43 },
    { skill: 'AWS', demand: 78, supply: 65, gap: 13 },
    { skill: 'TypeScript', demand: 72, supply: 58, gap: 14 },
    { skill: 'Python', demand: 68, supply: 72, gap: -4 },
    { skill: 'React', demand: 65, supply: 78, gap: -13 },
  ]

  const costAnalysis = {
    costPerHire: { current: '$2,840', previous: '$4,650', savings: '39%' },
    costPerAssessment: { current: '$4.20', previous: '$28.50', savings: '85%' },
    totalSavings: { quarterly: '$45,200', projected: '$180,800' },
  }

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Analytics & Insights"
        description="Track your hiring performance and AI-driven insights"
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overviewStats.map((stat, index) => (
          <Card key={index}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-dark-400 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-dark-100">{stat.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stat.trend === 'up' ? (
                    <TrendingUp size={14} className="text-success" />
                  ) : (
                    <TrendingDown size={14} className="text-error" />
                  )}
                  <span
                    className={`text-sm ${
                      stat.trend === 'up' ? 'text-success' : 'text-error'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-xs text-dark-500">vs last quarter</span>
                </div>
              </div>
              <div className={`p-2 rounded-lg bg-dark-700 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Assessment Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Funnel (Q2 2026)</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {[
              { stage: 'Total Assessments', count: 1247, percentage: 100, color: 'bg-dark-600' },
              { stage: 'Completed Full Assessment', count: 1089, percentage: 87, color: 'bg-info' },
              { stage: 'Qualified (75+ Score)', count: 298, percentage: 24, color: 'bg-brand-orange' },
              { stage: 'Advanced to Interview', count: 156, percentage: 13, color: 'bg-warning' },
              { stage: 'Offers Extended', count: 68, percentage: 5, color: 'bg-success' },
              { stage: 'Hired', count: 52, percentage: 4, color: 'bg-success' },
            ].map((stage, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-dark-300">{stage.stage}</span>
                  <span className="text-dark-200 font-medium">
                    {stage.count.toLocaleString()} ({stage.percentage}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {monthlyData.map((month, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="text-sm text-dark-400 w-12">{month.month}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-4 bg-dark-700 rounded overflow-hidden flex">
                    <div
                      className="h-full bg-info"
                      style={{ width: `${(month.assessments / 300) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-dark-400 w-10">{month.assessments}</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-4 bg-dark-700 rounded overflow-hidden flex">
                    <div
                      className="h-full bg-success"
                      style={{ width: `${(month.qualified / 80) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-dark-400 w-10">{month.qualified}</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-4 bg-dark-700 rounded overflow-hidden flex">
                    <div
                      className="h-full bg-brand-orange"
                      style={{ width: `${(month.hired / 25) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-dark-400 w-10">{month.hired}</span>
                </div>
              </div>
            ))}
            <div className="flex gap-6 pt-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-info rounded" />
                <span className="text-dark-400">Assessments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded" />
                <span className="text-dark-400">Qualified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-brand-orange rounded" />
                <span className="text-dark-400">Hired</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Efficiency Metrics */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="text-brand-orange" size={20} />
            Efficiency Metrics
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {efficiencyMetrics.map((metric, index) => (
            <div key={index} className="p-4 bg-dark-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-dark-300">{metric.metric}</span>
                <Badge variant={metric.value >= 90 ? 'success' : metric.value >= 70 ? 'orange' : 'warning'}>
                  {metric.value}%
                </Badge>
              </div>
              <Progress value={metric.value} variant="gradient" className="mb-2" />
              <p className="text-xs text-dark-400 mb-1">{metric.detail}</p>
              <p className="text-xs text-dark-500">{metric.benchmark}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Job Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Job Performance</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-2 text-sm font-medium text-dark-400">Position</th>
                  <th className="text-center py-2 text-sm font-medium text-dark-400">Assessed</th>
                  <th className="text-center py-2 text-sm font-medium text-dark-400">Qualified</th>
                  <th className="text-center py-2 text-sm font-medium text-dark-400">Avg Score</th>
                  <th className="text-center py-2 text-sm font-medium text-dark-400">Fill Rate</th>
                </tr>
              </thead>
              <tbody>
                {jobPerformance.map((job, index) => (
                  <tr key={index} className="border-b border-dark-700/50">
                    <td className="py-3 text-sm text-dark-200">{job.title}</td>
                    <td className="py-3 text-center text-sm text-dark-300">{job.assessments}</td>
                    <td className="py-3 text-center text-sm text-success">{job.qualified}</td>
                    <td className="py-3 text-center text-sm text-brand-orange">{job.avgScore}</td>
                    <td className="py-3 text-center">
                      <Progress value={job.fillRate} size="sm" variant="gradient" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Skills Gap Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Market Skills Gap Analysis</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {skillsGapTrends.map((skill, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-dark-200">{skill.skill}</span>
                  <span
                    className={`font-medium ${
                      skill.gap > 20
                        ? 'text-error'
                        : skill.gap > 0
                        ? 'text-warning'
                        : 'text-success'
                    }`}
                  >
                    {skill.gap > 0 ? `${skill.gap}% shortage` : `${Math.abs(skill.gap)}% surplus`}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <div className="text-xs text-dark-500 mb-1">Demand: {skill.demand}%</div>
                    <div className="w-full h-2 bg-dark-700 rounded-full">
                      <div
                        className="h-full bg-error rounded-full"
                        style={{ width: `${skill.demand}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-dark-500 mb-1">Supply: {skill.supply}%</div>
                    <div className="w-full h-2 bg-dark-700 rounded-full">
                      <div
                        className="h-full bg-success rounded-full"
                        style={{ width: `${skill.supply}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="text-success" size={20} />
            Cost Analysis & ROI
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-dark-700/50 rounded-xl text-center">
            <p className="text-sm text-dark-400 mb-2">Cost per Hire</p>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-2xl font-bold text-dark-500 line-through">
                {costAnalysis.costPerHire.previous}
              </span>
              <span className="text-3xl font-bold text-success">
                {costAnalysis.costPerHire.current}
              </span>
            </div>
            <Badge variant="success">{costAnalysis.costPerHire.savings} savings</Badge>
          </div>
          <div className="p-6 bg-dark-700/50 rounded-xl text-center">
            <p className="text-sm text-dark-400 mb-2">Cost per Assessment</p>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-2xl font-bold text-dark-500 line-through">
                {costAnalysis.costPerAssessment.previous}
              </span>
              <span className="text-3xl font-bold text-success">
                {costAnalysis.costPerAssessment.current}
              </span>
            </div>
            <Badge variant="success">{costAnalysis.costPerAssessment.savings} savings</Badge>
          </div>
          <div className="p-6 bg-gradient-to-br from-success/20 to-success/5 rounded-xl text-center border border-success/30">
            <p className="text-sm text-dark-400 mb-2">Total Savings</p>
            <p className="text-3xl font-bold text-success mb-1">
              {costAnalysis.totalSavings.quarterly}
            </p>
            <p className="text-sm text-dark-400">This quarter</p>
            <p className="text-lg font-semibold text-success/80 mt-2">
              {costAnalysis.totalSavings.projected} projected annually
            </p>
          </div>
        </div>
      </Card>
    </>
  )
}
