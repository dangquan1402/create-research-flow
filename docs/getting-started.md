# Getting Started

```bash
npx create-research-flow my-project
```

That's it. The CLI auto-installs anything missing.

## Prerequisites

| Tool | Why it's needed |
|---|---|
| **Node 20+** | Runs `npx` — install once: [nodejs.org](https://nodejs.org) |
| **`git`** | Clones the template (auto-installable on macOS) |
| **`gh`** | Creates the repo + Project board |
| **`uv`** | Installs the scaffolded project's Python deps |
| **`claude`** | The agent you'll run inside your scaffolded project |

The CLI checks for `git`, `gh`, `uv`, `claude` at startup and offers to install any that are missing. Node 20 is the only one you need beforehand.

## One-time setup

After the CLI installs `gh`, sign in once and grant the scopes it needs:

```bash
gh auth login                                       # browser-based login
gh auth refresh -s project,read:project,repo,workflow
```

The `project` scope is required for the Project board step. The CLI pre-flights this and offers to refresh for you if missing.

## What the CLI does

1. Checks/installs `git`, `gh`, `uv`, `claude`
2. Verifies `gh auth status`
3. Prompts for: project dir, parent folder, repo name, owner, visibility, project board title, optional first research goal (+ question + data sources)
4. Clones the [research-flow-template](https://github.com/dangquan1402/research-flow-template), pushes a fresh repo under your account, seeds labels, creates the Project board, opens the first issue
5. Runs `uv sync` and optionally launches `claude`

## Flags (skip the prompts)

```bash
npx create-research-flow my-project \
  --owner my-github-username \
  --private \
  --project-name "My Research" \
  --skip-claude
```

| Flag | Effect |
|---|---|
| `--private` / `--public` | Visibility |
| `--owner <owner>` | GitHub owner/org (defaults to authed user) |
| `--project-name <name>` | Project board title |
| `--skip-project` | No Project board |
| `--skip-install` | No `uv sync` |
| `--skip-claude` | Don't offer to launch `claude` |

## After scaffolding

```bash
cd my-project
claude
```

Inside Claude Code: `/research`, `/analyze`, `/experiment`, `/synthesize`, `/read-pdf <path>`. See `CLAUDE.md` in your scaffolded project for the full research loop.

## Updating

```bash
npx create-research-flow@latest my-next-project   # bypass npx cache
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Project skipped: missing 'project' scope` | `gh auth refresh -s project,read:project,repo,workflow` |
| `Still missing: uv. Restart your shell and rerun.` | `uv` installer puts it in `~/.local/bin` — open a new terminal |
| `Directory ... already exists` | Pick a different name or remove the folder |
| `Repository creation failed` (422) | Repo name taken — pick another or `gh repo delete <owner>/<name>` |
| Auto-install fails on Linux for `gh` | Needs `sudo` (apt). Install manually: [cli.github.com](https://cli.github.com) |
