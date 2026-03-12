# Agile Project Tracker 2.0

**BREE Stack** Agile project management with AI-powered insights via AgentX.

## 🏗️ Architecture

**BREE Stack:**
- **B**un - Fast JavaScript runtime & package manager
- **R**eact - Frontend framework with TypeScript
- **E**lysia - High-performance backend framework
- **E**den Treaty - Type-safe API client (Elysia's companion)

**Powered by AgentX:** AI agent system for intelligent project analysis and insights.

## ✨ Key Features

### 🎯 AILens System
Drag-and-drop AI analysis with 6 specialized lenses:
- 🚨 **Urgent Lens** - Find immediate blockers and time-sensitive items
- 🔍 **Risk Scanner** - Identify bottlenecks and high-risk items
- 📊 **Progress Analyst** - Track velocity and completion trends
- 💡 **Idea Generator** - Suggest features based on context
- 🛡️ **Security Auditor** - Security checks and vulnerability scanning
- ⚡ **Priority Optimizer** - Recommend optimal task prioritization

### 🌿 Vines (Collaborative Discussions)
Specialty-tagged conversations for team collaboration across projects.

### 🍇 Grapes (Knowledge Clusters)
Living documentation system that evolves with your project (Growing → Ripe → Harvested).

### 🎨 Modern UI/UX
- Framer Motion animations
- Tailwind CSS styling
- Responsive design
- Dark mode support

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) v1.0+ installed
- Node.js 18+ (for compatibility)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Agile-Project-Tracker2

# Install dependencies with Bun (faster)
bun install

# Or use npm
npm install
```

### Development

```bash
# Start development server
bun run dev

# The app will be available at:
# http://localhost:5173 (or next available port)
```

### Build

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

### Linting

```bash
# Run ESLint
bun run lint
```

## 📁 Project Structure

```
src/
├── api/              # API client & type definitions
│   ├── client.ts     # Eden Treaty client for Elysia backend
│   └── types.ts      # API type definitions
├── components/       # React components
│   ├── AILensMenu.tsx
│   ├── AILensOverlay.tsx
│   ├── Sidebar.tsx
│   ├── TaskList.tsx
│   └── ...
├── data/             # Mock data & configurations
│   ├── aiLenses.ts   # AILens definitions
│   ├── grapes.ts     # Grape data
│   └── ...
├── hooks/            # Custom React hooks
│   ├── useAILens.tsx # AILens context & logic
│   └── ...
├── pages/            # Page components
│   ├── Dashboard.tsx
│   ├── TaskBoardPage.tsx
│   └── ...
├── types/            # TypeScript type definitions
│   └── index.ts
└── App.tsx           # Root application component
```

## 🤖 AgentX Integration

The AILens system communicates with AgentX (AI agent system) via the Elysia backend:

```tsx
// Type-safe API call with Eden Treaty
const { data, error } = await client.api.agentx.analyze({
  lensId: 'urgent-lens',
  targetType: 'tasks',
  targetId: 'dashboard-main',
  contextSummary: '20 tasks across 5 projects',
  priority: 'urgent'
});
```

**Features:**
- Full type safety between frontend and backend
- Automatic request/response serialization
- Graceful fallback to mock data
- Real-time analysis status tracking

## 🎨 AILens Usage

### 1. The AILens menu appears as a floating, draggable panel
### 2. Drag any lens onto a drop zone (tasks, vines, grapes, etc.)
### 3. View instant AI-powered analysis with visualizations
### 4. Ask follow-up questions in the chat interface

### Implementing Drop Zones

```tsx
import { useLensDropZone } from '../hooks/useAILens';

const myDropZone = useLensDropZone({
  id: 'my-zone-id',
  label: 'My Zone',
  pageId: 'my-page',
  dataType: 'tasks',
  getData: () => ({ tasks, vines, grapes, project }),
  getSummary: () => `${tasks.length} tasks`
});

// Apply to component
<div {...myDropZone.dropProps} className={myDropZone.dropClassName}>
  {/* Your content */}
</div>
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Router** - Navigation

### Backend (Elysia)
- **Eden Treaty** - Type-safe client
- **AgentX** - AI agent system

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Bun** - Fast package manager & runtime

## 🌐 Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:3000

# AgentX Configuration
VITE_AGENTX_ENABLED=true
```

## 📝 Development Notes

### BREE Stack Benefits
- ⚡ **Fast:** Bun is 3x faster than Node.js
- 🔒 **Type-Safe:** Eden Treaty ensures end-to-end type safety
- 🚀 **Modern:** Latest React, TypeScript, and tooling
- 🎯 **Focused:** Minimal dependencies, maximum performance

### AILens Architecture
- Context-based state management
- Drag-and-drop interactions
- Real-time AgentX communication
- Graceful degradation with mock data
- Extensible lens system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Initial UI generated with [Magic Patterns](https://magicpatterns.com)
- Built on the BREE stack philosophy
- Powered by AgentX AI system

---

**Built with ❤️ using BREE Stack**
