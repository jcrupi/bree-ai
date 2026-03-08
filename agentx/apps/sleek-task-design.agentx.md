---
app: crazy-fast-feature
version: 1
created_at: "2025-03-05T00:00:00Z"
type: algo
component: TaskTrackingTable
---

# Sleek Task Tracking Table — Design Spec

A compact, Linear/Notion/Airtable-aesthetic spreadsheet view for the Crazy Week task board.
This sits inside the existing `tech` tab alongside or replacing the current `TaskSpreadsheet`.

## Visual Reference

Light theme, white table on gray-100 background. Pill-shaped filter chips with always-colored icons.
Alternating row stripes (white / blue-50/30). Inline description editing. Sortable columns.

## Layout

- Page: `bg-gray-100`, `max-w-7xl mx-auto py-8 px-4`
- Title block: `text-2xl font-semibold` + `text-sm text-gray-500` subtitle
- Table container: `bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden`

## Header Bar (above table)

Flex row — three sections separated by `w-px h-6 bg-gray-200` dividers:

### Left: Search

```
<input placeholder="Search tasks..." className="pl-9 w-52 border border-gray-200 rounded-md text-sm" />
<SearchIcon className="absolute left-3 text-gray-400 w-4 h-4" />
```

### Middle: Filter Chips

**Product chips** (multi-select, AND with status):
| Product | Icon | Color |
|---|---|---|
| Wound AI | `HeartPulse` | violet-600, bg-violet-50, border-violet-200 |
| Billing AI | `Receipt` | teal-600, bg-teal-50, border-teal-200 |
| Chart AI | `FileChartColumn` | orange-600, bg-orange-50, border-orange-200 |

**Status chips**:
| Status | Icon | Color |
|---|---|---|
| Pending | `Clock` | amber-700, bg-amber-50, border-amber-200 |
| In Progress | `LoaderCircle` | blue-700, bg-blue-50, border-blue-200 |
| Complete | `CheckCircle2` | emerald-700, bg-emerald-50, border-emerald-200 |
| Blocked | `ShieldAlert` | red-700, bg-red-50, border-red-200 |

Chip behavior: icon ALWAYS shows its color. Text goes gray when inactive, colored when active.
Active adds colored bg/border + `shadow-sm`.

### Right: Count + Column Toggle

- `{n} tasks` — `text-xs text-gray-500`
- `SlidersHorizontal` icon opens dropdown with checkbox per column

## Table

### Columns

`Product | Task ID | Description | Link | Created Date | Status`

### Header Row

`bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500 font-medium px-4 py-2.5`

- `border-r border-gray-200` vertical dividers on headers
- Sortable — click to toggle asc/desc, show `ArrowUp`/`ArrowDown` on active column

### Rows

- `border-r border-gray-100` cell dividers
- Even rows: `bg-white`, odd rows: `bg-blue-50/30`
- Hover: `hover:bg-blue-50/60 transition-colors`
- Compact: `px-4 py-2 text-sm`

### Cell Details

| Column       | Render                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Product      | Colored icon + `text-gray-700` name                                                                     |
| Task ID      | `font-mono text-gray-600`                                                                               |
| Description  | Truncated; click → inline `<input>` with blue focus ring, Enter=save, Escape=cancel, hover=`bg-blue-50` |
| Link         | `ExternalLink` icon `text-gray-400 hover:text-blue-600`, opens new tab                                  |
| Created Date | `text-sm text-gray-500`                                                                                 |
| Status       | Colored pill: `rounded-full px-2.5 py-0.5 text-xs font-medium border` + matching icon                   |

## Data Mapping (crazy-fast-feature products)

The existing `ProductName` enum maps to the spec's 3 products:

- `'Wound AI'` → Wound AI (violet)
- `'Performance AI'` → Billing AI (teal)
- `'Extraction AI'` → Chart AI (orange)

Status mapping from existing `TaskStatus`:

- `'pending'` → Pending
- `'active'` → In Progress
- `'investigating'` → In Progress
- `'complete'` → Complete

## Component API

```tsx
export interface TaskTrackingTableProps {
  tasks: Task[];
  onDescriptionUpdate?: (id: string, description: string) => void;
}

export function TaskTrackingTable({
  tasks,
  onDescriptionUpdate,
}: TaskTrackingTableProps);
```

## Files

- **Component**: `src/components/TaskTrackingTable.tsx`
- **Usage**: Drop into `App.tsx` tech tab, alongside or replacing `TaskSpreadsheet`
