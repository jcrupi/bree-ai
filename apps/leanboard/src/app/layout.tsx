import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LeanBoard - Lean Project Management',
  description: 'One UI for Linear, Jira, ClickUp, and GitHub. 21x smaller, 16x faster.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
