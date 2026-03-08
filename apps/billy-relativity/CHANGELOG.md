# Changelog

## [1.1.0] - 2026-03-07

### ✨ New Features

#### Collapsible Sidebar
- **Toggle Button**: Added collapse/expand button for the API questions panel
- **Icon-Only Mode**: When collapsed, shows just icons for each API operation
- **Full-Width Tables**: Collapsed sidebar allows tables to use full window width
- **Persistent State**: Sidebar state maintained during session
- **Smooth Transitions**: Animated collapse/expand with CSS transitions

#### Prominent Workspace IDs

**Quick Reference Cards**:
- Beautiful ID reference cards that appear for workspace-related operations
- Click-to-copy functionality with visual confirmation (✓ icon)
- Auto-fills the input field when clicked
- Gradient backgrounds (indigo for workspaces, blue for resource pools)
- Shows: ID number, workspace name, and client name

**Enhanced ID Display in Tables**:
- Artifact IDs now displayed with:
  - Large, bold monospace font (18px)
  - Indigo color scheme (#4F46E5)
  - Background highlight (indigo-50)
  - Rounded border badge
  - Increased padding for visibility

**Smart Input Fields**:
- ID input fields now use monospace font
- Larger, bold text for entered IDs
- Placeholder text guides users to click reference cards

### 🎨 UI Improvements

**Quick Reference Panels** (New Component):
- Show when operations require workspace or resource pool IDs
- **Workspace IDs**: 5 available workspaces with names and clients
- **Resource Pool IDs**: 4 available pools with names
- Hover effects and shadow on interaction
- Copy icon (clipboard) appears on hover
- Green checkmark confirmation when copied

**Sidebar States**:
```
Expanded (Default):          Collapsed (Space-Saving):
┌──────────────────┐         ┌─────┐
│  API Questions   │         │ [▶] │
│                  │         │     │
│ Workspace Queries│         │ 🗄️  │
│ • Get all        │         │ 🔍  │
│ • Get by ID      │         │ ➕  │
│                  │         │     │
│ Workspace Mgmt   │         │ ✏️  │
│ • Create         │         │ 🗑️  │
│ • Update         │         │ 🔍  │
└──────────────────┘         └─────┘

Width: ~320px                Width: 64px
```

### 🔧 Technical Changes

**APIExplorer.tsx**:
- Added `sidebarCollapsed` state management
- Added `copiedId` state for copy confirmation
- New workspace and resource pool quick reference data
- `copyToClipboard()` helper function
- Conditional rendering based on selected operation
- Dynamic grid layout based on sidebar state
- Added icons: `ChevronLeft`, `ChevronRight`, `Copy`, `CheckCircle2`

**DataTable.tsx**:
- Enhanced number formatting for ID fields
- Special styling for columns containing "artifactid" or "id"
- Larger font size and badge-style display for IDs

### 📊 Quick Reference Data

**Workspace IDs**:
- 1234001 - Acme Patent - Phase 1 (Acme Corp)
- 1234002 - Acme Patent - Phase 2 (Acme Corp)
- 1234003 - Global Contract Review (Global Industries)
- 1234004 - TechStart Regulatory (TechStart Ventures)
- 1234005 - Acme Archived 2025 (Acme Corp - Archived)

**Resource Pool IDs**:
- 1003680 - Production Pool - East
- 1003681 - Production Pool - West
- 1003682 - Development Pool
- 1003683 - Archive Pool

### 🎯 User Experience Improvements

1. **Easier Testing**: Click-to-copy IDs eliminate manual typing
2. **Full-Screen Tables**: Collapsed sidebar provides more space for data
3. **Visual Hierarchy**: Prominent IDs make it easy to scan results
4. **Better Navigation**: Icon-only sidebar still allows quick operation switching
5. **Contextual Help**: Quick reference only shows for relevant operations

### 📸 Visual Changes

**Before**:
- Fixed 3-column grid (1:2 ratio)
- IDs displayed as regular numbers
- No quick reference for IDs

**After**:
- Dynamic grid (expandable/collapsible)
- IDs highlighted with badges and large font
- Click-to-copy quick reference cards
- Full-width option for tables

### 🚀 Performance

- No performance impact from new features
- Click-to-copy uses native Clipboard API
- CSS transitions are GPU-accelerated
- Conditional rendering prevents unnecessary DOM updates

### 🐛 Bug Fixes

None - this is a pure feature release

### 📝 Notes

- Sidebar collapse state does NOT persist across page refreshes (intentional)
- Quick reference cards only show for operations that need IDs
- Copy confirmation automatically clears after 2 seconds
- All existing functionality remains unchanged

---

## [1.0.0] - 2026-03-07

### Initial Release

- Full BREE stack application (Bun + React + Elysia + Eden)
- 11 API operations for Relativity Workspace APIs
- Mock data with realistic relationships
- Pretty data tables with smart formatting
- Advanced view for REST call details
- Complete documentation (README, QUICKSTART, DESIGN_SPEC)
