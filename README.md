# create-research-flow

Scaffold a new [Research Flow](https://github.com/dangquan1402/research-flow) project — an agentic research system with persistent memory, Claude Code skills, and a GitHub Project board for tracking research goals, hypotheses, and findings.

> **New here?** See [**docs/getting-started.md**](docs/getting-started.md) for a step-by-step setup walkthrough (Node, git, gh, uv, Claude Code) before running the CLI.

## Quick start

```bash
npx create-research-flow my-project
```

That's it. The CLI walks you through the rest:

1. **Checks prereqs** — `git`, `gh`, `claude`, `uv`. If any are missing, it offers to install them for you (see [Prerequisites](#prerequisites)).
2. **Verifies `gh` auth** — aborts with `gh auth login` instructions if not signed in.
3. **Prompts** for parent folder, repo name, GitHub owner, visibility (private/public), whether to create a Project board, and an optional first research goal.
4. **Scaffolds**: clones the template → initial commit → creates the GitHub repo → pushes → seeds labels → creates the Project board → opens the first issue and adds it to the board → runs `uv sync`.
5. **Optionally launches `claude`** in the new project directory.

### Non-interactive form

```bash
npx create-research-flow my-project \
  --owner my-github-username \
  --private \
  --skip-project \
  --skip-install \
  --skip-claude
```

## Prerequisites

| Tool | Why | Install |
|---|---|---|
| **Node 20+** | Runs this CLI | [nodejs.org](https://nodejs.org) or `nvm install 20` |
| **`git`** | Clones the template, initial commit | macOS: `xcode-select --install` |
| **`gh`** | Creates the repo, labels, Project board, first issue | macOS: `brew install gh` · Linux: see [cli.github.com](https://cli.github.com) |
| **`claude`** | Launches Claude Code in the new project | `npm i -g @anthropic-ai/claude-code` |
| **`uv`** | Installs the Python deps in the new project | `curl -LsSf https://astral.sh/uv/install.sh | sh` |

> If any of `gh`, `claude`, or `uv` are missing when you run the CLI, it will **prompt you to install them automatically** using the commands above. You can decline and install them yourself.

### One-time `gh` setup

```bash
gh auth login                              # interactive: GitHub.com → HTTPS → browser
gh auth refresh -s project,repo,workflow   # ensure scopes for repo + Project board
gh auth status                             # verify
```

The `project` scope is required — without it, the Project board step fails (the rest still works).

### One-time `claude` setup

```bash
claude   # first run prompts for login / API key
```

## Flags

| Flag | Description |
|---|---|
| `--private` / `--public` | Repo visibility (prompted if omitted) |
| `--owner <owner>` | GitHub owner/org (defaults to authed user) |
| `--skip-project` | Don't create a GitHub Project board |
| `--skip-install` | Don't run `uv sync` in the new project |
| `--skip-claude` | Don't offer to launch `claude` at the end |

## What you get

After scaffolding, your new project has:

- The full [research-flow](https://github.com/dangquan1402/research-flow) template (memory layer, skills, hooks, experiment harness)
- A GitHub repo at `{owner}/{repo}` with seeded labels: `research-goal`, `hypothesis`, `finding`, `synthesis`, `maintenance`
- A GitHub Project board `Research Flow` with columns: `Backlog | In Progress | Synthesizing | Done`
- (optional) A first research-goal issue, added to the Project board
- Python deps installed via `uv sync`

## Troubleshooting

- **`Still missing: uv. Restart your shell and rerun.`** — the `uv` installer drops the binary into `~/.local/bin`, which isn't on `PATH` until you start a new shell. Open a new terminal and rerun.
- **`gh project create` fails** — your `gh` token is missing the `project` scope. Run `gh auth refresh -s project`.
- **`Directory ... already exists.`** — pick a different project name, or remove the existing folder.
- **No automated installer for `git`** — on Linux, install via your package manager (`apt install git`, `dnf install git`, etc.).

## Local development

```bash
git clone <this-repo>
cd create-research-flow
npm install
npm start -- my-test-project
```

## License

MIT
