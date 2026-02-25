import { describe, it, expect } from 'vitest'
import { agentXSpecialities } from './specialities'

describe('agentXSpecialities', () => {
  it('has at least one speciality', () => {
    expect(agentXSpecialities.length).toBeGreaterThan(0)
  })

  it('each speciality has id, name, description and questions', () => {
    for (const s of agentXSpecialities) {
      expect(s.id).toBeTruthy()
      expect(s.name).toBeTruthy()
      expect(s.description).toBeTruthy()
      expect(Array.isArray(s.questions)).toBe(true)
      for (const q of s.questions) {
        expect(q.id).toBeTruthy()
        expect(q.text).toBeTruthy()
      }
    }
  })
})
