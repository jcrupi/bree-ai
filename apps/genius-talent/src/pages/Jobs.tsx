import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Button, Card, Input, Badge, Tabs, TabsList, TabsTrigger, TabsContent, PageHeader } from '@bree-ai/core/components'

export default function Jobs() {
  const [searchQuery, setSearchQuery] = useState('')

  const jobs = [
    {
      id: 1,
      title: 'Senior DevOps Engineer',
      company: 'TechCorp',
      location: 'Remote',
      salary: '$150-180K',
      candidates: 45,
      qualified: 8,
      status: 'active',
      avgScore: 72,
      configTime: '45 min',
      createdAt: '2 days ago',
    },
    {
      id: 2,
      title: 'Lead Full Stack Developer',
      company: 'StartupXYZ',
      location: 'San Francisco, CA',
      salary: '$140-170K',
      candidates: 32,
      qualified: 5,
      status: 'active',
      avgScore: 68,
      configTime: '3 min',
      createdAt: '5 days ago',
    },
    {
      id: 3,
      title: 'Frontend Engineer',
      company: 'Acme Corp',
      location: 'New York, NY',
      salary: '$120-150K',
      candidates: 50,
      qualified: 12,
      status: 'active',
      avgScore: 75,
      configTime: '3 min',
      createdAt: '1 week ago',
    },
    {
      id: 4,
      title: 'Backend Engineer',
      company: 'DataFlow Inc',
      location: 'Austin, TX',
      salary: '$130-160K',
      candidates: 28,
      qualified: 4,
      status: 'paused',
      avgScore: 65,
      configTime: '3 min',
      createdAt: '2 weeks ago',
    },
    {
      id: 5,
      title: 'Cloud Architect',
      company: 'CloudNine',
      location: 'Remote',
      salary: '$180-220K',
      candidates: 15,
      qualified: 3,
      status: 'draft',
      avgScore: 70,
      configTime: '3 min',
      createdAt: '3 weeks ago',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'paused':
        return <Badge variant="warning">Paused</Badge>
      case 'draft':
        return <Badge variant="default">Draft</Badge>
      case 'closed':
        return <Badge variant="error">Closed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeJobs = filteredJobs.filter((job) => job.status === 'active')
  const pausedJobs = filteredJobs.filter((job) => job.status === 'paused')
  const draftJobs = filteredJobs.filter((job) => job.status === 'draft')

  const JobCard = ({ job }: { job: typeof jobs[0] }) => (
    <Card hover glow className="relative group">
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="p-2">
            <Eye size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <Copy size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="p-2 text-error hover:text-error">
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-dark-100 mb-1">{job.title}</h3>
          <p className="text-sm text-dark-400">
            {job.company} • {job.location}
          </p>
        </div>
        {getStatusBadge(job.status)}
      </div>

      <div className="flex items-center gap-6 text-sm mb-4">
        <span className="text-dark-400">{job.salary}</span>
        <span className="text-dark-500">•</span>
        <span className="text-dark-400">Created {job.createdAt}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 p-4 bg-dark-700/50 rounded-lg mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users size={14} className="text-dark-500" />
            <span className="text-lg font-semibold text-dark-100">{job.candidates}</span>
          </div>
          <p className="text-xs text-dark-500">Candidates</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 size={14} className="text-success" />
            <span className="text-lg font-semibold text-success">{job.qualified}</span>
          </div>
          <p className="text-xs text-dark-500">Qualified</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-lg font-semibold text-brand-orange">{job.avgScore}</span>
          </div>
          <p className="text-xs text-dark-500">Avg Score</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-dark-500">
          <Clock size={12} />
          <span>Config time: {job.configTime}</span>
        </div>
        <Link to={`/dashboard/jobs/${job.id}`}>
          <Button size="sm">View Candidates</Button>
        </Link>
      </div>
    </Card>
  )

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Jobs"
        description="Manage your job listings and AI screening agents"
        actions={
          <Link to="/dashboard/jobs/new">
            <Button leftIcon={<Plus size={18} />}>Create New Job</Button>
          </Link>
        }
      />

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
        <Button variant="secondary" leftIcon={<Filter size={18} />}>
          Filters
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Jobs ({filteredJobs.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeJobs.length})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({pausedJobs.length})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({draftJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="paused">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pausedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="draft">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {draftJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
