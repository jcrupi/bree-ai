import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

describe('App', () => {
  it('renders landing page at /', () => {
    window.history.pushState({}, '', '/')
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    expect(screen.getByRole('heading', { level: 1, name: /Genius Talent/i })).toBeInTheDocument()
  })

  it('has link to dashboard', () => {
    window.history.pushState({}, '', '/')
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    const dashboardLinks = screen.getAllByRole('link', { name: /get matched|get started/i })
    expect(dashboardLinks.length).toBeGreaterThan(0)
    expect(dashboardLinks[0]).toHaveAttribute('href', '/dashboard')
  })

  it('has link to try as candidate', () => {
    window.history.pushState({}, '', '/')
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    const tryCandidateLinks = screen.getAllByRole('link', { name: /try as candidate/i })
    expect(tryCandidateLinks.length).toBeGreaterThan(0)
    expect(tryCandidateLinks[0]).toHaveAttribute('href', '/assess/demo')
  })
})
