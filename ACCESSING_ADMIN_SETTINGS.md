# Accessing Admin Settings in Genius Talent & Keen

## How to Access Admin Settings

### Genius Talent

1. **Start the app:**

   ```bash
   cd apps/genius-talent
   bun run dev
   ```

2. **Navigate to the dashboard:**
   - Open browser to `http://localhost:5173`
   - Go to the Dashboard (if not already there)

3. **Click Settings in the sidebar:**
   - Look for the **Settings** icon in the left sidebar (gear icon)
   - Click it to access `/dashboard/settings`

4. **Set your Ragster collection:**
   - In Admin Settings, go to the **"Admin Stuff"** tab
   - Under "Ragster Collections", select your collection from the dropdown
   - The selected collection will be saved to localStorage

### Keen.ai

Keen.ai doesn't have a settings page yet built into the UI. You have two options:

**Option 1: Set Collection ID in Environment File (Recommended)**

Edit `apps/keen-ai/.env.local` and add:

```bash
VITE_RAGSTER_DEFAULT_COLLECTION_ID=your-collection-id-here
```

Then restart the dev server:

```bash
cd apps/keen-ai
bun run dev
```

**Option 2: Add a Settings Page (Same as Genius)**

If you want a settings UI for Keen, follow the same pattern:

1. Create `apps/keen-ai/src/pages/Settings.tsx`:

   ```typescript
   import { AdminSettings } from '@bree-ai/core/components'

   export default function Settings() {
     return (
       <div className="p-6">
         <AdminSettings
           mode="live"
           brandName="Keen.ai"
           onClose={() => {}}
         />
       </div>
     )
   }
   ```

2. Add to pages index and routing (same as Genius Talent)

## Admin Settings Features

Once in Admin Settings, you can:

### 1. **Admin Stuff Tab**

- **View Ragster Collections**: See all collections for your organization
- **Select Collection**: Choose which collection to use for searches
- **Create New Collection**: Set up a new document collection
- **Upload Documents**: Add documents to your collections

### 2. **Identity (AM) Tab**

- **View Organizations**: See AntiMatterDB organizations
- **Manage Users**: View user information
- **Create Organizations**: Set up new orgs if needed

### 3. **Debug Tab**

- View environment configuration
- Check API endpoints
- Test connections

## Finding Your Collection ID

To find existing collections:

```bash
# For Genius Talent
curl "https://agent-collective-ragster.fly.dev/api/collections?org_id=genius-talent" \
  -H "x-org-id: genius-talent" \
  -H "x-user-id: user@genius-talent.com"

# For Keen.ai
curl "https://agent-collective-ragster.fly.dev/api/collections?org_id=keen.ai" \
  -H "x-org-id: keen.ai" \
  -H "x-user-id: user@keen.ai"
```

The response will show all collections with their IDs:

```json
{
  "collections": [
    {
      "id": "your-collection-id",
      "name": "Collection Name",
      "org_id": "genius-talent",
      ...
    }
  ]
}
```

## Quick Access URLs

Once apps are running:

- **Genius Talent Settings**: `http://localhost:5173/dashboard/settings`
- **Keen.ai**: Edit `.env.local` (no UI yet)

## Setting Collection via localStorage (Alternative)

If you're already in the app, you can set it via browser console:

```javascript
// Open browser console (F12) and run:
localStorage.setItem("katai_default_collection", "your-collection-id");
// Reload the page
```

This works in both apps as they use the same storage key.

---

**Now you can access Admin Settings in Genius Talent! The Settings link in the sidebar will take you to the collection management page where you can select your Ragster collection.** 🎉
