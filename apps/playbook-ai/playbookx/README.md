# Playbookx CLI

Validate, sync, and watch agentx rules for specialty apps.

## Commands

| Command | Description |
|---------|-------------|
| `validate [specialty]` | Parse agentx, check handlers exist. Omit specialty to validate all. |
| `sync [specialty]` | (Future) Parse agentx → write catalog |
| `watch` | Watch agentx files, run validate on change |

## Usage

```bash
cd apps/playbook-ai

# Validate all rules-engine specialties
bun run playbookx:validate

# Validate wound only
bun run playbookx validate wound

# Watch for changes
bun run playbookx:watch
```

## Related

- `rules-engine/` — Core engine and wound-ai specialty
- `shared/specialty-config.ts` — Central specialty config
