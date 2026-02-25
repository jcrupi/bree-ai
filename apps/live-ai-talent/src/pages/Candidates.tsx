import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Filter,
  Download,
  Eye,
  MessageSquare,
  Calendar,
  SortAsc,
} from 'lucide-react'
import {
  Button,
  Card,
  Input,
  Badge,
  Avatar,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  PageHeader,
} from '@bree-ai/core/components'

export default function Candidates() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'name'>('score')

  const candidates = [
    {
      id: 1,
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      job: 'Senior DevOps Engineer',
      score: 92,
      technical: 95,
      problemSolving: 90,
      cultural: 88,
      status: 'new',
      assessedAt: '2 hours ago',
      strengths: ['Kubernetes expert', 'Strong architecture'],
    },
    {
      id: 2,
      name: 'Sarah Rodriguez',
      email: 'sarah.r@email.com',
      job: 'Senior DevOps Engineer',
      score: 89,
      technical: 88,
      problemSolving: 92,
      cultural: 86,
      status: 'reviewed',
      assessedAt: '5 hours ago',
      strengths: ['AWS certified', 'Team leadership'],
    },
    {
      id: 3,
      name: 'David Park',
      email: 'david.park@email.com',
      job: 'Lead Full Stack Developer',
      score: 87,
      technical: 90,
      problemSolving: 85,
      cultural: 84,
      status: 'shortlisted',
      assessedAt: '1 day ago',
      strengths: ['CI/CD automation', 'Security focus'],
    },
    {
      id: 4,
      name: 'Jennifer Wilson',
      email: 'jwilson@email.com',
      job: 'Frontend Engineer',
      score: 82,
      technical: 80,
      problemSolving: 85,
      cultural: 82,
      status: 'interview_scheduled',
      assessedAt: '2 days ago',
      strengths: ['Strong Python', 'Documentation'],
    },
    {
      id: 5,
      name: 'Alex Thompson',
      email: 'alex.t@email.com',
      job: 'Backend Engineer',
      score: 78,
      technical: 75,
      problemSolving: 80,
      cultural: 78,
      status: 'new',
      assessedAt: '3 days ago',
      strengths: ['Eager to learn', 'Good communicator'],
    },
    {
      id: 6,
      name: 'Emily Johnson',
      email: 'emily.j@email.com',
      job: 'Senior DevOps Engineer',
      score: 75,
      technical: 72,
      problemSolving: 78,
      cultural: 75,
      status: 'rejected',
      assessedAt: '4 days ago',
      strengths: ['Basic cloud knowledge'],
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="orange">New</Badge>
      case 'reviewed':
        return <Badge variant="info">Reviewed</Badge>
      case 'shortlisted':
        return <Badge variant="success">Shortlisted</Badge>
      case 'interview_scheduled':
        return <Badge variant="warning">Interview Scheduled</Badge>
      case 'rejected':
        return <Badge variant="error">Not Moving Forward</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-success'
    if (score >= 75) return 'text-brand-orange'
    if (score >= 60) return 'text-warning'
    return 'text-error'
  }

  const filteredCandidates = candidates
    .filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.job.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  const newCandidates = filteredCandidates.filter((c) => c.status === 'new')
  const advancedCandidates = filteredCandidates.filter(
    (c) => c.status === 'shortlisted' || c.status === 'interview_scheduled'
  )

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Candidates"
        description="Review and manage candidates across all job positions"
        actions={
          <Button variant="secondary" leftIcon={<Download size={18} />}>
            Export All
          </Button>
        }
      />

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or job..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
        <Button
          variant="secondary"
          leftIcon={<SortAsc size={18} />}
          onClick={() =>
            setSortBy(sortBy === 'score' ? 'name' : sortBy === 'name' ? 'date' : 'score')
          }
        >
          Sort: {sortBy === 'score' ? 'Score' : sortBy === 'name' ? 'Name' : 'Date'}
        </Button>
        <Button variant="secondary" leftIcon={<Filter size={18} />}>
          Filters
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({filteredCandidates.length})</TabsTrigger>
          <TabsTrigger value="new">New ({newCandidates.length})</TabsTrigger>
          <TabsTrigger value="advanced">Advanced ({advancedCandidates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700 bg-dark-800/50">
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">
                      Candidate
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">
                      Applied For
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-dark-400">
                      Overall
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-dark-400">
                      Technical
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-dark-400">
                      Problem
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-dark-400">
                      Cultural
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-dark-400">
                      Status
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-dark-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="border-b border-dark-700/50 hover:bg-dark-800/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={candidate.name} />
                          <div>
                            <p className="font-medium text-dark-100">{candidate.name}</p>
                            <p className="text-xs text-dark-500">{candidate.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-dark-200">{candidate.job}</p>
                        <p className="text-xs text-dark-500">{candidate.assessedAt}</p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${getScoreColor(
                            candidate.score
                          )} bg-dark-700`}
                        >
                          {candidate.score}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-dark-200 font-medium">
                          {candidate.technical}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-dark-200 font-medium">
                          {candidate.problemSolving}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-dark-200 font-medium">
                          {candidate.cultural}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(candidate.status)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/dashboard/candidates/${candidate.id}`}>
                            <Button variant="ghost" size="sm" className="p-2">
                              <Eye size={16} />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" className="p-2">
                            <MessageSquare size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-2">
                            <Calendar size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700 bg-dark-800/50">
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">
                      Candidate
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">
                      Applied For
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-dark-400">
                      Overall
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">
                      Key Strengths
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-dark-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {newCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="border-b border-dark-700/50 hover:bg-dark-800/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={candidate.name} />
                          <div>
                            <p className="font-medium text-dark-100">{candidate.name}</p>
                            <p className="text-xs text-dark-500">{candidate.assessedAt}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-dark-200">{candidate.job}</td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${getScoreColor(
                            candidate.score
                          )} bg-dark-700`}
                        >
                          {candidate.score}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {candidate.strengths.map((s, i) => (
                            <Badge key={i} variant="default" size="sm">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="secondary" size="sm">
                            Review
                          </Button>
                          <Button size="sm">Schedule</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700 bg-dark-800/50">
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">
                      Candidate
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">
                      Applied For
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-dark-400">
                      Overall
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-dark-400">
                      Status
                    </th>
                    <th className="text-right py-4 px-4 text-sm font-medium text-dark-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {advancedCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="border-b border-dark-700/50 hover:bg-dark-800/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={candidate.name} />
                          <div>
                            <p className="font-medium text-dark-100">{candidate.name}</p>
                            <p className="text-xs text-dark-500">{candidate.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-dark-200">{candidate.job}</td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${getScoreColor(
                            candidate.score
                          )} bg-dark-700`}
                        >
                          {candidate.score}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(candidate.status)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="secondary" size="sm">
                            View Details
                          </Button>
                          <Button size="sm">Next Step</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
