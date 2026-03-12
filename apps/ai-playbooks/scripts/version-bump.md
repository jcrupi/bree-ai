# Playbook & Algo Version Bump

When saving a new version of a playbook or algos agentx note:

1. **Copy current file** to `agentx/playbook/archives/` with timestamp:
   - `{specialty}.playbook.agentx-v1.md` → `archives/{specialty}.playbook.agentx-v1.2025-03-05.md`
   - or `archives/{specialty}.playbook.agentx-v1.md` (overwrite if re-archiving)

2. **Create new version** with incremented `-vN`:
   - `{specialty}.playbook.agentx-v2.md`
   - Update frontmatter: `version: 2`, `created_at: "<ISO now>"`

3. **Example (manual):**
   ```bash
   cd apps/wound-ai/agentx/playbook
   cp wound-ai.playbook.agentx-v1.md archives/wound-ai.playbook.agentx-v1.md
   # Edit wound-ai.playbook.agentx-v1.md → save as wound-ai.playbook.agentx-v2.md
   # Update frontmatter version: 2, created_at
   rm wound-ai.playbook.agentx-v1.md  # or keep v1 in archives only
   ```

4. **Playbook-ai** always loads the **highest version** (`-vN`) from `agentx/playbook/`.
