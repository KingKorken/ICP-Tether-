# Vision-Driven MCP Server Generation Agent

**Date:** 2026-02-28
**Status:** Brainstorm
**Author:** Tim Buhrow

---

## What We're Building

An AI agent system that runs locally (with future cloud hosting), continuously observes the user's screen via screen recording, and automatically generates MCP (Model Context Protocol) servers for any software it encounters. The agent creates a persistent, growing library of MCP servers — each one encoding the capabilities of a specific application — enabling the agent to interact with any desktop app, web app, or CLI tool.

### Core Loop

1. **Observe** — The agent uses screen recording + vision model to identify which software is currently active
2. **Recognize** — It checks a local registry: "Do I already have an MCP server for this app?"
3. **Generate** — If not, it analyzes the app's UI (and available APIs) to understand capabilities, then generates a full MCP server (actual code) for that application
4. **Test** — The agent starts the generated MCP server, calls its tools, and uses vision to verify the actions worked correctly on screen
5. **Persist** — Validated MCP servers are saved to a local filesystem with a registry index, ready for reuse
6. **Interact** — On subsequent encounters, the agent loads the existing MCP server and uses it to interact with the software

### Scope of Software

The agent handles **all software visible on the user's machine**:
- Native desktop applications (Slack, VS Code, Figma, etc.)
- Web applications in the browser (Gmail, Notion, Jira, etc.)
- Command-line tools and terminal applications

### Communication Method

Generated MCP servers use a **hybrid approach**:
- **API calls** when the software has a discoverable API (REST, GraphQL, CLI)
- **UI automation** (vision + mouse/keyboard) when no API is available
- The agent decides which method to use per-application

### Generated Server Format

- Full MCP server code (not just schemas or configs)
- Language chosen by the agent per-application (TypeScript, Python, etc.)
- Each server is a self-contained, independently runnable process

---

## Why This Approach

### Architecture: Orchestrator + Workers

We chose the **Orchestrator + Workers** pattern over monolithic or plugin-based approaches.

**Components:**

| Component | Responsibility |
|---|---|
| **Orchestrator Agent** | Central brain. Manages the registry, decides when to generate new MCP servers, coordinates testing, routes tasks to workers |
| **Vision Worker** | Dedicated screen analysis and app recognition. Processes screen recordings, identifies active software, extracts UI element information |
| **Code Generator Worker** | Writes MCP server code from app capability descriptions. Handles both API-wrapper and UI-automation server generation |
| **Test Runner Worker** | Validates generated servers by executing them, calling tools, and using vision feedback to verify correctness |
| **Bootstrap MCP Server** | A foundational MCP server providing OS-level primitives (screen capture, mouse/keyboard, window management) that all other components use |

**Why Orchestrator + Workers over alternatives:**

- **vs. Monolithic:** Better separation of concerns. Each worker can be developed, tested, and scaled independently. More natural mapping to cloud deployment.
- **vs. Plugin-based:** Simpler to build in v1. Plugin interfaces are hard to design upfront. Workers can evolve into a plugin system later if needed.

**Data flow:**

```
Screen Recording
      |
      v
Vision Worker  --->  Orchestrator  --->  Registry (known apps?)
                          |
                    [unknown app]
                          |
                          v
                  Code Generator Worker
                          |
                          v
                  Test Runner Worker
                          |
                    [validation pass]
                          |
                          v
                  Persist to filesystem + registry
```

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Agent observes via | Screen recording + MCP server connections | Combines visual understanding with structured interaction capabilities |
| Generated server format | Full code (not schema/config) | Maximum flexibility, each server is a real process |
| Generated server language | Agent decides per-app | Best tool for the job — Python for data tools, TS for web, etc. |
| Communication with apps | Hybrid (API + UI automation) | API when available for reliability; UI fallback for universal coverage |
| Architecture pattern | Orchestrator + Workers | Clean separation, independently scalable, cloud-migration ready |
| Validation approach | Test by executing | Agent starts the server, calls tools, verifies with vision feedback |
| Persistence | Local filesystem + registry index | Code in folders, metadata in registry (JSON/SQLite), cloud-ready later |
| Software scope | Desktop + Web + CLI | Universal coverage of everything on the user's machine |
| MCP server versioning | Version and keep both | Old version is preserved, new version generated. Agent picks the right one based on what it sees on screen |
| Credential handling | User provides credentials | When a generated MCP server needs auth, the agent asks the user. Credentials stored securely |
| Cloud deployment | Decide later | Build local-first. Defer cloud architecture until core system works |
| Concurrent app handling | Queue and process sequentially | Detect all visible apps, but learn them one at a time in order of relevance |

---

## Resolved Questions

1. **MCP server versioning** — When an app updates, the agent generates a new version of the MCP server while keeping the old one. The agent picks the correct version based on what it observes on screen. Both versions coexist in the registry.

2. **Security model** — The user provides credentials when a generated MCP server needs authentication (API keys, OAuth tokens, etc.). The agent asks the user and stores credentials securely. No autonomous credential discovery.

3. **Concurrent app handling** — When multiple apps are visible, the orchestrator queues them and processes sequentially in order of relevance. No parallel learning of multiple apps.

4. **Cloud deployment model** — Deferred. Build local-first. Cloud architecture decisions will be made once the core system is validated.

---

## Open Questions

1. **App identification accuracy** — How does the vision model reliably distinguish between similar-looking applications? What happens when the same app looks different across versions or themes?

2. **Bootstrap MCP server design** — What OS-level primitives does the bootstrap server need to expose? Screen capture, mouse/keyboard, window list, clipboard, filesystem access — where's the boundary?

3. **Vision model selection** — Which vision model powers the system? A local model (for privacy/speed) or a cloud API (GPT-4V, Claude Vision)? Trade-offs between latency, accuracy, and cost.

4. **Error recovery** — When the test runner determines a generated MCP server doesn't work correctly, what's the retry/repair strategy? How many attempts before giving up?
