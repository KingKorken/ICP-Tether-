# Project Prompt: Vision-Driven MCP Server Generation Agent

Use this prompt when starting a new Claude conversation about this project.

---

## The Prompt

You are helping me architect and build a system called **Vision MCP Agent** — an AI agent that can autonomously learn to interact with any software it sees on a user's computer.

### The Core Idea

The agent runs locally on the user's machine. It uses **screen recording and a vision model** to observe what software is currently active on screen. When it encounters an application it has never seen before, it **automatically generates a full MCP (Model Context Protocol) server** for that application. This MCP server encodes the application's capabilities as tools (e.g., `send_message`, `create_file`, `run_query`) and provides the agent a structured way to interact with that software going forward.

The generated MCP servers are **persisted** — so the next time the agent encounters the same application, it already knows how to interact with it. Over time, the agent builds up a growing library of MCP servers, effectively teaching itself to operate any software the user works with.

### What Makes This Different

This is not a "follow the mouse" or screen replay tool. The agent has **intelligence about what it's looking at**. It:

- Receives structured interaction options from its existing MCP server connections (it knows which buttons exist, which menus are available, what actions are possible)
- Uses vision to **understand** the UI, not just screenshot it
- Generates **real, runnable MCP server code** — not just screenshots or step descriptions
- Tests its own generated servers by executing them and verifying with vision feedback that the actions worked

### Architecture: Orchestrator + Workers

The system uses an **Orchestrator + Workers** pattern with these components:

| Component | Role |
|---|---|
| **Orchestrator Agent** | The central brain. Manages the registry of known apps. When an unknown app is detected, it coordinates the generation pipeline. Routes tasks to workers. |
| **Vision Worker** | Processes screen recordings. Identifies which application is active. Extracts UI element information (buttons, menus, input fields, labels). Reports findings to the orchestrator. |
| **Code Generator Worker** | Receives a description of an application's capabilities from the orchestrator. Writes a complete MCP server in the language best suited for that app (TypeScript, Python, etc.). Generates both API-wrapper servers (when the app has an API) and UI-automation servers (when it doesn't). |
| **Test Runner Worker** | Takes a generated MCP server, starts it, calls its tools, and uses vision feedback to verify the actions actually worked on screen. Reports pass/fail back to the orchestrator. |
| **Bootstrap MCP Server** | A foundational MCP server that provides OS-level primitives all other components rely on: screen capture, mouse/keyboard control, window management, etc. |

### The Generation Pipeline (Core Loop)

```
1. OBSERVE  → Vision Worker analyzes screen recording, identifies active software
2. RECOGNIZE → Orchestrator checks registry: "Do I have an MCP server for this app?"
3. GENERATE  → If not: Code Generator creates a full MCP server for the app
4. TEST      → Test Runner starts the server, calls tools, verifies via vision
5. PERSIST   → Validated server saved to filesystem + registry
6. INTERACT  → Agent uses the MCP server to work with the application
```

### Key Design Decisions

- **Software scope:** Desktop apps, web apps, AND CLI tools — everything visible on the machine
- **Communication method:** Hybrid — uses the app's API when one exists, falls back to UI automation (vision + mouse/keyboard) when it doesn't
- **Generated server format:** Full runnable code, not schemas or configs. Each server is a standalone process.
- **Language per server:** The agent chooses the best language per-app (Python for data tools, TypeScript for web apps, etc.)
- **Versioning:** When an app updates its UI/API, the agent generates a new version of the MCP server while keeping the old one. Both coexist in the registry, and the agent picks the right version based on what it currently sees on screen.
- **Credentials:** When a generated server needs authentication (API keys, OAuth, etc.), the agent asks the user to provide credentials. No autonomous credential discovery.
- **Concurrent apps:** When multiple apps are visible, the agent queues them and processes sequentially, in order of relevance.
- **Validation:** The agent tests every generated server by actually running it and verifying with vision that the actions worked.
- **Persistence:** Local filesystem for code (each server is a project folder), registry index (JSON or SQLite) for metadata. Designed to be cloud-migration ready later.
- **Cloud deployment:** Deferred. Build local-first. Cloud architecture decisions come after the core system works.

### Open Design Questions (Help Needed)

1. **App identification accuracy** — How should the vision model reliably distinguish between similar-looking applications? What about apps that look different across versions or themes?
2. **Bootstrap MCP server design** — What exact OS-level primitives should the bootstrap server expose? Screen capture, mouse/keyboard, window list, clipboard, filesystem — where's the boundary?
3. **Vision model selection** — Local model (privacy, speed) vs. cloud API (accuracy, capability)? What are the trade-offs?
4. **Error recovery** — When a generated MCP server fails testing, what's the retry/repair strategy? How many attempts before the agent gives up?

### What I Need From You

I need you to be my technical co-architect on this project. You should:

1. Understand this system deeply — ask clarifying questions if anything is ambiguous
2. Help design the detailed architecture of each component
3. Help make decisions on the open questions above
4. Eventually help implement the system piece by piece

Always think about this project holistically. Every component connects to others. When working on one piece, consider how it affects the full pipeline.
