# Meta-Playbook: Declarative Rule & Math Representation (AgentX)

## Purpose
This playbook defines the architecture of **AgentX** as a platform for declarative, deterministic knowledge. It establishes the relationship between high-level Playbooks, deterministic Algos, and executable Instances.

## Core Philosophy: "Declarative First"
- **Playbooks**: Human-readable knowledge, directives, and guardrails. They define *what* success looks like.
- **Algos**: Declarative representations of logic (medical rules, tax laws, mathematical formulas). These are *not* scripts; they are structural templates that can be parsed and executed deterministically by a rules/math engine.
- **Instances (Learning Cases)**: Concrete applications of Algos to specific data. These are snapshots of the engine's execution path.

## The Algos Representation
### 1. Coding Rules (asop)
Rules in `algos.agentx` are structural models. They define the "Source of Truth" in a format that ensures:
- **Traceability**: Every finding points back to a specific rule ID.
- **Determinism**: Given the same input, the engine always produces the same PASS/FAIL status.

### 2. Math Models (math-ai)
Mathematical Algos (`math-ai.algos.meta.agentx`) are not just descriptions; they are declarative blueprints for computation.
- **Formula Extraction**: The AI extracts numbers into a standardized variable set.
- **Logic Modeling**: The AI maps these variables into a JSON execution tree (operations, arguments, results).
- **Engine-Ready**: This representation is designed to be fed into an analytics engine or rules engine for zero-hallucination computation.

## Evolution Loop
Learning cases should be treated as **Instances of Algos**. When an AI analyzes a learning case, it is essentially "instantiating" a meta-level Algo into a specific problem-solving structure (the `math_ai_engine` JSON block).
