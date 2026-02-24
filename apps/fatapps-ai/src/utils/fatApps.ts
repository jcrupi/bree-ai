export interface FatApp {
  id: string
  slug: string
  name: string
  description: string
  domain: string
  cloneSources: string[]
  bizAgentxPath?: string
  status: 'draft' | 'biz-generated' | 'agents-generated' | 'ready'
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'fatapps-ai-fatapps'

export function getFatApps(): FatApp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveFatApp(app: FatApp): void {
  const apps = getFatApps()
  const idx = apps.findIndex((a) => a.id === app.id)
  if (idx >= 0) apps[idx] = app
  else apps.push(app)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
}

export function getFatAppBySlug(slug: string): FatApp | undefined {
  return getFatApps().find((a) => a.slug === slug)
}

export function getFatAppById(id: string): FatApp | undefined {
  return getFatApps().find((a) => a.id === id)
}

export function deleteFatApp(id: string): void {
  const apps = getFatApps().filter((a) => a.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps))
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
