# Playbook: Learning & Case Study Execution

## Goal
To simulate clinical documentation encounters using `agentx` learning cases and verify the Playbook AI engine's ability to identify the correct CPT codes and provide actionable optimization advice.

## Pillars

### 1. The Learning Case (AgentX)
- **Path**: `apps/playbooks-ai/agentx/apps/<specialty>/learning/learning.<case-name>.agentx.md`
- **Structure**: Includes patient history, treatment timeline, subjective/objective findings, and the current clinical plan.
- **Anonymization**: No real patient names; focus on clinical complexity.

### 2. The Learning Runner (Script)
- **Script**: `apps/playbooks-ai/playbookx/learn.ts`
- **Operation**:
  - Iterates through initialized specialty folders.
  - Sends documentation content to the `/api/chart-ai` endpoint.
  - Returns structured analyzer results: Identified Code, Summary, Optimization Advice, and Rules Engine Evaluations.

### 3. Verification Loop
1. **Identify**: AI must suggest the most appropriate CPT code for the documented complexity.
2. **Optimize**: AI must provide at least one concrete piece of advice to improve the documentation or move to a higher billing level.
3. **Validate**: The deterministic rules engine must confirm the AI's extraction against coded logic.

## Usage
Run the following command to execute all learning cases:
```bash
bun run learn
```

Or for a specific specialty:
```bash
bun run learn:enm
```
