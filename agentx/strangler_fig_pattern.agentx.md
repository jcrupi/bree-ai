# Strangler Fig Pattern

Below is the Strangler Fig pattern recast in a Core J2EE pattern–style template, followed by a concrete view of how you’d implement the façade/routing in an Elysia/Bun/React stack.

## Name
**Strangler Fig**

## Intent
Incrementally migrate a legacy system by routing requests through a façade that can direct each request either to the legacy application or to new refactored services, so that over time the new system completely supplants the legacy system with minimal disruption.

## Also Known As
Incremental Migration, Parallel Run with Routing, Strangler Application

## Motivation
Many organizations run large, business‑critical legacy systems that are:
- Hard to maintain or extend
- Built on obsolete technology
- Risky to replace in a big‑bang cutover

A full rewrite and switch‑over can be prohibitively risky. Instead, you can place a façade in front of the legacy system to own the public surface. That façade routes some features to the legacy implementation and others to new services. As more functionality is implemented in the new system, the façade gradually shifts traffic until the legacy system is no longer needed and can be decommissioned.

## Applicability
Use the Strangler Fig pattern when:
- You must keep the legacy system running during modernization.
- You can intercept requests at a stable boundary (URL, API gateway, message bus).
- The legacy system is large or complex, making big‑bang replacement risky.
- You want to prioritize high‑ROI features for early migration.

Avoid this pattern when:
- You can’t reliably intercept or reroute requests.
- The system is small or simple enough to rewrite and cut over quickly.
- You must decommission the old system on a very short timeline.

## Structure
Conceptual participants:
- **Client** – UI, API client, or other system sending requests.
- **Strangler Façade** – Proxy that fronts both legacy and new implementations. Implements routing logic.
- **Legacy System** – Existing monolith or legacy service.
- **New System** – Set of new services, endpoints, or modules that gradually replace legacy features.
- **Shared Resources (optional)** – Databases, queues, and other resources that may be used by both systems during transition.

**Flow:**
1. Client sends requests to the façade.
2. Façade routes each request to either:
   ▫ Legacy System, or
   ▫ New System (refactored feature).
3. Over iterations, more routes are served by the New System.
4. When all functionality is migrated, Legacy System is retired and the façade is removed or simplified.

## Participants
- **Strangler Façade**
  ▫ Central routing layer.
  ▫ Encapsulates legacy vs. new implementation decisions.
  ▫ Can enforce cross‑cutting concerns (auth, logging, rate limiting).
- **Legacy System**
  ▫ Existing implementation used for unmigrated features.
  ▫ May continue to own the primary data store initially.
- **New System**
  ▫ Target architecture: microservices, modular services, or modernized monolith.
  ▫ Gradually assumes ownership of functionality and, eventually, data.
- **Client**
  ▫ Ideally unchanged during migration (same base URL / API surface).
  ▫ Interacts only with the façade, not with the legacy system directly.

## Collaboration
1. **Initial phase:**
   ▫ All routes in the façade forward to the legacy system.
2. **Migration iteration:**
   ▫ A feature is reimplemented in the new system.
   ▫ Façade updates routing rules so relevant requests go to the new implementation.
   ▫ Data may be dual‑written or synchronized (ETL, shadow writes).
3. **Stabilization:**
   ▫ Monitor correctness, performance, and reliability.
   ▫ If needed, the façade can temporarily roll routing back to legacy.
4. **Completion:**
   ▫ All routes point to the new system.
   ▫ Legacy system is decommissioned.
   ▫ Façade is simplified or removed; clients may now talk directly to the new system.

## Consequences

### Benefits
- **Reduced risk** – Migrates functionality in small increments.
- **Continuous delivery** – Enables frequent, low‑risk releases.
- **Business continuity** – Legacy system remains operational throughout.
- **Cost optimization** – You can prioritize high‑value features first, and retire legacy infrastructure gradually.

### Liabilities
- **Complexity in routing** – Façade logic must remain consistent with application evolution.
- **Operational overhead** – Two systems must co‑exist, including monitoring and deployments.
- **Façade as bottleneck** – If not designed correctly, the façade can become a single point of failure or performance bottleneck.
- **Data migration complexity** – Dual‑writes or synchronization can be tricky for stateful systems.

## Implementation
Key steps:
1. **Establish a façade boundary**
   ▫ Choose a stable entry point: HTTP gateway, reverse proxy, or message broker.
   ▫ All clients must go through this boundary.
2. **Route everything to legacy**
   ▫ Initially, façade is a thin pass‑through.
3. **Design the new system**
   ▫ Extract coherent domains (e.g., “Matters”, “Claims”, “Auth”) for phased migration.
   ▫ Implement services with clear APIs.
4. **Incrementally change routing**
   ▫ For each domain:
     ⁃ Implement new endpoints/services.
     ⁃ Redirect matching routes from façade to new system.
     ⁃ Keep fallbacks to legacy when necessary.
5. **Manage shared data**
   ▫ Use ETL, shadow writes, or event‑sourcing where necessary.
   ▫ Promote the new database to system of record once validated.
6. **Decommission legacy**
   ▫ When all functionality is migrated and stable, retire legacy components.
   ▫ Simplify or remove the façade.

## Sample Code (Elysia/Bun/React)

Below is an example of how an Elysia (Bun) backend with a React client can implement the Strangler Façade and support legacy/refactored routing.

### 1. Elysia façade with legacy vs. new routes

Assume:
- Legacy system is reachable at https://legacy.example.com.
- New services are implemented within the Elysia app.
- Both are fronted by the same Elysia server (your “strangler façade”).

```typescript
// server.ts (Bun + Elysia façade)
import { Elysia } from 'elysia'

// Simple HTTP proxy helper to forward requests to legacy
async function proxyToLegacy(path: string, req: Request) {
  const url = new URL(path, 'https://legacy.example.com')
  const init: RequestInit = {
    method: req.method,
    headers: req.headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.clone().arrayBuffer(),
  }
  const res = await fetch(url, init)
  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  })
}

const app = new Elysia()
  // Example: feature still served by legacy
  .get('/api/legacy-matters', async ({ request }) => {
    return proxyToLegacy('/api/matters', request)
  })

  // Example: new, refactored "matters" API in the new system
  .get('/api/matters', async () => {
    // New implementation – e.g., querying a modern DB, using new domain model
    const matters = [
      { id: 'M-100', title: 'Example Matter', status: 'Open' },
      { id: 'M-101', title: 'Another Matter', status: 'Closed' },
    ]
    return new Response(JSON.stringify(matters), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })

  // Example: strangler routing with conditional behavior
  .get('/api/matter/:id', async ({ params, request }) => {
    const { id } = params
    // Routing rule: new system owns IDs starting with "M-1", else legacy
    const servedByNew = id.startsWith('M-1')

    if (servedByNew) {
      // New implementation
      const matter = { id, title: `Matter ${id}`, status: 'Open', source: 'new-system' }
      return new Response(JSON.stringify(matter), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      // Fallback to legacy
      return proxyToLegacy(`/api/matter/${id}`, request)
    }
  })

  // React SPA static hosting (optional)
  .get('*', async () => {
    // Serve built React index.html or appropriate static content
    // In practice you’d use Bun.file('dist/index.html') etc.
    return new Response('SPA placeholder', { status: 200 })
  })

app.listen(3000)
console.log('Strangler façade running on http://localhost:3000')
```

Points to note:
- `proxyToLegacy` represents the façade → legacy hop.
- Routes like `/api/matters` demonstrate the new implementation.
- `/api/matter/:id` shows incremental routing rules: some IDs are handled by the new system, others by legacy.
- Over time, routing rules change so that more cases are handled by the new implementation until the legacy path is no longer needed.

### 2. React client unchanged (talks only to façade)

Your React app only ever calls the façade; it doesn’t know which side is legacy vs. new. That’s the essence of the pattern.

```tsx
// MattersPage.tsx (React front end)
import React, { useEffect, useState } from 'react'

type Matter = {
  id: string
  title: string
  status: string
  source?: string
}

export function MattersPage() {
  const [matters, setMatters] = useState<Matter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/matters')
      const data = await res.json()
      setMatters(data)
      setLoading(false)
    })()
  }, [])

  if (loading) return <div>Loading…</div>

  return (
    <div>
      <h1>Matters</h1>
      <ul>
        {matters.map(m => (
          <li key={m.id}>
            {m.title} ({m.status}) {m.source && <small>– {m.source}</small>}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

From React’s point of view:
- It calls `/api/matters` and `/api/matter/:id` on the same origin.
- Whether that traffic is served by the legacy system or the new system is entirely the server’s concern.
- During migration, you can change routing rules and implementations in Elysia without changing the React code.

## Known Uses
- Cloud providers and large enterprises modernizing line‑of‑business systems behind an API gateway.
- Gradual decomposition of monoliths into microservices while preserving a stable external API.
- Database migrations where a new database is introduced and promoted to system of record using shadow writes and ETL, with a façade orchestrating read/write routing.

## Related Patterns
- **Gateway Routing / API Gateway** – The façade can be implemented as a gateway with routing rules.
- **Anti‑Corruption Layer** – When the new system needs to speak to the legacy domain model without leaking legacy concepts.
- **Messaging Bridge** – When the boundary between legacy and new systems is message‑based rather than HTTP.
- **Sidecar** – For decomposing cross‑cutting concerns while still fronted by the strangler façade.
