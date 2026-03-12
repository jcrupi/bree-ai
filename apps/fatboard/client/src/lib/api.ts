import { treaty } from '@elysiajs/eden'
import type { App } from '../../../server/src/index'

// Create Eden Treaty client for type-safe API calls
export const api = treaty<App>('localhost:8001')

// Helper functions for API calls
export const issuesApi = {
  async getAll() {
    const { data, error } = await api.api.issues.get()
    if (error) throw new Error('Failed to fetch issues')
    return data.issues
  },

  async getOne(id: string) {
    const { data, error } = await api.api.issues({ id }).get()
    if (error) throw new Error(`Failed to fetch issue ${id}`)
    return data
  },

  async create(input: {
    title: string
    description: string
    status?: string
    assigneeId?: string
    priority?: string
    labels?: string[]
  }) {
    const { data, error } = await api.api.issues.post(input)
    if (error) throw new Error('Failed to create issue')
    return data
  },

  async update(id: string, input: {
    title?: string
    description?: string
    status?: string
    assigneeId?: string
    priority?: string
    labels?: string[]
  }) {
    const { data, error } = await api.api.issues({ id }).patch(input)
    if (error) throw new Error(`Failed to update issue ${id}`)
    return data
  },

  async delete(id: string) {
    const { data, error } = await api.api.issues({ id }).delete()
    if (error) throw new Error(`Failed to delete issue ${id}`)
    return data
  },

  async addComment(id: string, content: string) {
    const { data, error } = await api.api.issues({ id }).comments.post({ content })
    if (error) throw new Error('Failed to add comment')
    return data
  }
}

export const usersApi = {
  async getAll() {
    const { data, error } = await api.api.users.get()
    if (error) throw new Error('Failed to fetch users')
    return data.users
  }
}
