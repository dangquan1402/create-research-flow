# Getting Started

End-to-end setup for `create-research-flow` — from a clean machine to your first scaffolded research project.

## What you'll get

After ~5 minutes of one-time setup, you can run:

```bash
npx create-research-flow my-project
```

…and have a fresh GitHub repo with the [research-flow](https://github.com/dangquan1402/research-flow-template) skeleton, a Project board for tracking goals/hypotheses/findings, seeded labels, an optional first research-goal issue, and `claude` ready to launch.

---

## Prerequisites overview

| Tool | Why | First-run cost |
|---|---|---|
| **Node.js 20+** | Runs the CLI (`npx`) | Install once, never touch again |
| **`git`** | Clones the template, makes the initial commit | Comes with macOS / standard everywhere |
| **`gh` (GitHub CLI)** | Creates the repo, labels, Project board, and first issue under your account/org | One-time `gh auth login` + scope grant |
| **`uv` (Python pkg manager)** | Installs the scaffolded project's Python deps | Install once |
| **`claude` (Claude Code)** | The agent you'll run inside your scaffolded project | Install once + sign in |

> **Don't have one of these?** The CLI detects missing tools at startup and offers to install them automatically — no need to memorize the install commands. Read the manual instructions below if you'd rather do it yourself, or if auto-install fails on your platform.

---

## 1. Node.js 20+

`npx` is the entrypoint, and `npx` ships with Node.

### macOS

```bash
# Recommended: nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
exec $SHELL
nvm install 20
nvm use 20

# Or Homebrew
brew install node@20
```

### Linux

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Windows / WSL

Use [nodejs.org](https://nodejs.org) installer, or `nvm-windows`, or run inside WSL with the Linux instructions above.

### Verify

```bash
node --version    # → v20.x.x or higher
npx --version
```

---

## 2. `git`

### macOS

```bash
xcode-select --install      # if not already installed
git --version
```

### Linux

```bash
sudo apt install -y git     # Debian/Ubuntu
sudo dnf install -y git     # Fedora
```

### Verify

```bash
git --version    # → git version 2.x or higher
```

You may want to set your identity once if this machine is fresh:
```bash
git config --global user.name "Your Name"
git config --global user.email you@example.com
```

---

## 3. GitHub CLI (`gh`)

Used to create your repo, seed labels, create the Project board, and open the first issue.

### Install

**macOS:**
```bash
brew install gh
```

**Linux (Debian/Ubuntu):**
```bash
(type -p wget >/dev/null || sudo apt-get install -y wget) \
  && sudo mkdir -p -m 755 /etc/apt/keyrings \
  && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg \
       | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
       | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && sudo apt update && sudo apt install -y gh
```

Other platforms: [cli.github.com](https://cli.github.com)

### Authenticate

```bash
gh auth login
```

Pick: **GitHub.com → HTTPS → Login with a web browser**. Approve in the browser.

### Grant the scopes the CLI needs

`create-research-flow` needs to create a repo, push, manage labels, create a Project board, and open issues. Make sure these scopes are on your token:

```bash
gh auth refresh -s project,read:project,repo,workflow
```

> The CLI **pre-flights the `project` scope** before scaffolding and will offer to run `gh auth refresh` for you if it's missing — but doing it once up front saves a step.

### Verify

```bash
gh auth status
```

You should see something like:
```
✓ Logged in to github.com account <your-username>
- Token scopes: 'project', 'read:project', 'repo', 'workflow', ...
```

---

## 4. `uv` (Python package manager)

The scaffolded research-flow project uses [`uv`](https://docs.astral.sh/uv/) for fast, reproducible Python deps. The CLI runs `uv sync` after scaffolding.

### Install

**macOS / Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows:**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

> The installer drops `uv` into `~/.local/bin` — open a new shell after install so it's on your `PATH`.

### Verify

```bash
uv --version    # → uv 0.x.x
```

---

## 5. Claude Code (`claude`)

The agent that operates inside your scaffolded project — runs the `/research`, `/analyze`, `/experiment`, `/synthesize`, `/read-pdf` etc. skills.

### Install

Official installer (recommended — works without npm):

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Or via npm if you already have it:

```bash
npm i -g @anthropic-ai/claude-code
```

### First-run sign-in

```bash
claude
```

Follow the prompts to log in (Anthropic account or API key).

### Verify

```bash
claude --version    # → 2.x.x (Claude Code)
```

---

## 6. Run `create-research-flow`

```bash
npx create-research-flow my-project
```

The CLI will:

1. **Re-check prereqs** — if anything is missing, offer to auto-install
2. **Verify `gh` is authenticated** — abort with instructions if not
3. **Prompt** for:
   - Local project directory name
   - Parent folder (where to create it)
   - GitHub repo name (defaults to project name)
   - GitHub owner (defaults to your authed user)
   - Visibility: private or public
   - Whether to create a Project board (and its title)
   - Pre-flight check: `project` scope on your gh token; offers to refresh if missing
   - Optional first research goal
   - If you provided a goal: research question and initial data sources
4. **Scaffold** (with live progress for clone/push):
   - Clone the [research-flow-template](https://github.com/dangquan1402/research-flow-template) (~870 KB, takes a couple seconds)
   - `git init` + initial commit
   - `gh repo create ... --push` to your account/org
   - Seed labels: `research-goal`, `hypothesis`, `finding`, `synthesis`, `maintenance`
   - Create the Project board
   - Customize board columns: `Backlog | In Progress | Synthesizing | Done`
   - Open the first research-goal issue (with structured Markdown body) and add it to the board
   - Run `uv sync` in the new project
5. **Optionally launch `claude`** in the new project directory

### Non-interactive form

If you want to skip the prompts:

```bash
npx create-research-flow my-project \
  --owner my-github-username \
  --private \
  --project-name "My Research" \
  --skip-claude
```

### Flags

| Flag | Effect |
|---|---|
| `--private` / `--public` | Visibility (otherwise prompted) |
| `--owner <owner>` | GitHub owner/org (otherwise prompted, defaults to authed user) |
| `--project-name <name>` | Project board title (otherwise prompted) |
| `--skip-project` | Don't create a Project board |
| `--skip-install` | Don't run `uv sync` after scaffolding |
| `--skip-claude` | Don't offer to launch `claude` at the end |

---

## 7. After scaffolding — first steps in your new project

```bash
cd my-project
claude
```

Inside Claude Code, try:

- **`/research`** — Define a research goal, create a branch + parent issue
- **`/read-pdf <path-to-pdf>`** — Render a PDF to images and ingest it into memory
- **`/analyze <source>`** — Extract entities, findings, themes from a source
- **`/experiment <config.yaml>`** — Run an ML experiment
- **`/synthesize`** — Consolidate findings into themes and outputs

Read [`CLAUDE.md`](https://github.com/dangquan1402/research-flow-template/blob/main/CLAUDE.md) in the scaffolded project for the full research loop, memory rules, and git flow.

---

## Troubleshooting

### `Prereqs OK` but then `gh auth status` fails
Run `gh auth login` — the CLI checks tools-on-PATH, not auth state. (It does check `gh auth status` separately, but only after the prereq pass.)

### `Project skipped: ... missing the 'project' scope`
Run `gh auth refresh -s project,read:project,repo,workflow` and re-run the CLI.

### `Still missing: uv. Restart your shell and rerun.`
The `uv` installer puts `uv` in `~/.local/bin` which isn't on your `PATH` until a new shell. Open a new terminal and rerun.

### `Directory ... already exists`
Pick a different project name, or remove the existing folder.

### `gh repo create ... 422 Repository creation failed`
The repo name is taken under that owner. Pick a different name, or delete the old one with `gh repo delete <owner>/<name>`.

### Slow `gh repo create ... and pushing`
Should be a few seconds with the lean template (`research-flow-template` is ~870 KB). If it's taking minutes, check your network and watch for git's progress output (visible since v0.1.2).

### Auto-install fails on Linux for `gh`
The CLI uses the official apt repo recipe, which requires `sudo`. If you're on a non-Debian distro or unprivileged, install `gh` manually from [cli.github.com](https://cli.github.com) and re-run.

---

## Updating

```bash
# Pull the latest CLI version (npx caches per-version; use @latest)
npx create-research-flow@latest my-next-project

# Or globally if you prefer
npm i -g create-research-flow@latest
create-research-flow my-next-project
```

The template repo (`dangquan1402/research-flow-template`) is independently versioned by tag — each `npx` invocation clones the current `main`.
