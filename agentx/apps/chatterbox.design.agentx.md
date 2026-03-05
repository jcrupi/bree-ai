---
title: chatterbox — Cipher-dark Design System
type: design_spec
app: chatterbox-ui
aesthetic: Cipher-dark
colors: Void (#080b10), Cipher Blue (#3b82f6)
typography: Inter, JetBrains Mono
last_updated: 2026-03-03
---

# chatterbox — Cipher-dark Design System

The visual language of **chatterbox** is designed to reinforce its core mission: **proven privacy**. The "Cipher-dark" aesthetic uses deep obsidian tones, high-contrast typography, and ethereal glows to create a secure, high-integrity dashboard for conversational metadata.

---

## 🎨 Design Philosophy

1.  **Privacy as Visibility**: Instead of hiding everything, the UI visualizes the _shape_ and _security_ of data (hashes, context chains) to prove that no plaintext exists.
2.  **Obsidian Depth**: Using a multi-layered dark palette (`--bg-void` to `--bg-overlay`) to create professional hierarchy without relying on traditional borders.
3.  **The "0" Sentinel**: A primary UI tenet is the prominent display of "0 Private Data Stored," serving as a constant verification of the system's architecture.

---

## 💎 Design Tokens

### Color Palette

| Token          | Hex       | Usage                                           |
| :------------- | :-------- | :---------------------------------------------- |
| `--bg-void`    | `#080b10` | Main application background (absolute dark)     |
| `--bg-deep`    | `#0d1117` | Sidebar and inactive pane backgrounds           |
| `--bg-surface` | `#111820` | Primary card and container background           |
| `--accent`     | `#3b82f6` | **Cipher Blue** — primary interaction and focus |
| `--green`      | `#10b981` | Success, "Stored" status, and data integrity    |
| `--amber`      | `#f59e0b` | Pending tasks, NATS latency, or warning states  |

### Typography

- **UI Interface**: `Inter` (Sans-serif) — used for all labels, navigation, and summaries.
- **Data & Hashes**: `JetBrains Mono` (Monospace) — used for all `ehash` values, `conversationId`, and technical metadata.

---

## 🧩 Component Architecture

### 1. The Dashboard Grid

A glassmorphic layout featuring four primary KPI cards with high-contrast numerical displays.

- **Aesthetic**: `border: 1px solid rgba(255, 255, 255, 0.06)`, `backdrop-filter: blur(8px)`.
- **Interactions**: Subtle hover lift (`transform: translateY(-2px)`) with an expanded accent glow.

### 2. Conversation Explorer

A vertical pane listing active "Vines" (conversation threads).

- **Branching Visualization**: Uses left-padded indentations and connecting lines to represent automatic context branching.
- **Metadata Badges**: Compact blue badges for turn counts (e.g., `3 TURNS`).

### 3. Recent Turns Live Stream

A real-time "heartbeat" of the system.

- **Privacy Mode**: Displays truncated `ehash` values instead of text.
- **Hash Animation**: New turns fade in with a subtle `--green` flash to indicate successful persistence.

---

## 🛡️ The "Privacy Promise" UI

The most important design feature is the **Plaintext Audit**.

- **Visual**: A high-contrast card featuring a large digital "0" and a lightning bolt icon.
- **Function**: Constantly polls the backend to confirm `unhashed_count === 0`. If this digit ever moves above zero, the UI enters a critical `system-violation` state (flashing red).

---

## ⚡ Interaction & FX

- **Cipher Glows**: Active buttons and navigation items emit a `-accent-glow` (15% opacity radial gradient) to feel "powered on."
- **Transitions**: All hover states use a standard `0.15s ease-in-out` to maintain a snappy, premium feel.
- **Empty States**: Uses custom SVG illustrations with `opacity: 0.1` to guide users when no turns are recorded.

---

## 🛠️ Implementation Specs

- **Framework**: React (Vite)
- **Styling**: Vanilla CSS with CSS Variables (Tokens)
- **Icons**: Custom SVG set + Lucide React
- **Optimizations**: SWC-based build for sub-second hot reloading of the design system.
