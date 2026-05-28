---
name: fork
description: summarize a branch or a specific topic from the chat in a .md file named fork-<topic>.md under the root/docs/fork folder, so that it can be picked up by a fresh agent.
disable-model-invocation: true
---

# Fork

## Purpose

Create a handoff markdown file for a fresh agent by summarizing either:
- a branch discussed in the current chat, or
- a specific topic from the current chat.

## Trigger

Use when the user runs:
- `/fork <topic or branch from current chat>`

Example:
- `/fork failed job recovery`

## Required Output

1. Ensure `docs/fork` exists at project root.
2. Create `docs/fork/fork-<topic>.md` using a lowercase kebab-case topic slug.
3. Write only information grounded in the current chat and repository state.
4. Keep the handoff concise, actionable, and easy for a fresh agent to continue.

## File Template

Use this structure:

```markdown
# Fork: <original topic text>

## Goal
<what needs to be achieved>

## Scope
- <what is in scope>
- <what is out of scope if relevant>

## Current State
- <what is already done>
- <what is partially done>
- <what is blocked>

## Key Context
- <important decisions and rationale>
- <critical files, commands, or artifacts>

## Next Steps
1. <next action>
2. <next action>

## Verification
- <how to confirm completion>

## Open Questions
- <unknowns that need clarification>
```

## Guardrails

- Do not invent facts.
- Do not include secrets.
- If context is missing, note assumptions explicitly under `Open Questions`.
