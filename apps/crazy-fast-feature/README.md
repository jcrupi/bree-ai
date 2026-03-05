# Crazy Fast Feature - AI Task Tracker

A beautiful, modern task management UI for tracking AI feature development tasks across Wound AI, Performance AI, and Extraction AI products.

## Features

- **Task Management**: Add, edit, and delete tasks with full CRUD support
- **Status Tracking**: Track tasks through 4 statuses:
  - Pending - Not yet started
  - Investigating - Being researched
  - Active - Currently in development
  - Complete - Finished
- **Product Filtering**: Filter tasks by product (Wound AI, Performance AI, Extraction AI)
- **Search**: Full-text search across task IDs and descriptions
- **Comments**: Expandable comment section under each task for collaboration
- **Linear Integration**: API connector ready for syncing with Linear

## Getting Started

### Development

```bash
# From the monorepo root
bun run dev:crazy-fast-feature

# Or from this directory
bun dev
```

The app will be available at `http://localhost:5680`

### Build

```bash
# From the monorepo root
bun run build:crazy-fast-feature

# Or from this directory
bun build
```

## Linear API Integration

To connect to Linear for live task syncing:

1. Copy `.env.example` to `.env.local`
2. Get your Linear API key from Linear Settings > API > Personal API keys
3. Add your API key to the `.env.local` file:

```env
VITE_LINEAR_API_KEY=lin_api_xxxxxxxxxxxxx
VITE_LINEAR_TEAM_ID=your-team-id  # Optional
```

## Project Structure

```
src/
├── components/          # React components
│   ├── AddTaskModal.tsx
│   ├── CommentSection.tsx
│   ├── EditTaskModal.tsx
│   ├── FilterBar.tsx
│   ├── ProductBadge.tsx
│   ├── StatsBar.tsx
│   ├── StatusBadge.tsx
│   ├── StatusSelector.tsx
│   └── TaskCard.tsx
├── data/
│   └── mockTasks.ts     # Initial mock data
├── hooks/
│   └── useTasks.ts      # Task state management
├── services/
│   └── linearApi.ts     # Linear API connector
├── types/
│   └── task.ts          # TypeScript types
├── App.tsx              # Main app component
├── index.css            # Global styles
└── index.tsx            # Entry point
```

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Vite** - Build tool

## Design

Follows BREE design standards:
- Dark theme with slate color palette
- Glassmorphism effects (backdrop blur, transparency)
- Indigo/purple accent colors
- Smooth animations and transitions
- Responsive layout
