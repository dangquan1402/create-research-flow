# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` — install deps
- `npm start -- <project-name>` — run the CLI locally (equivalent to `node bin/cli.js`)
- `npx create-research-flow <project-name>` — invoke the published CLI

There is no test, lint, or build step configured in `package.json`.

## Architecture

This is an ESM Node CLI (`"type": "module"`, Node 20+) that scaffolds a new [Research Flow](https://github.com/dangquan1402/research-flow) project from a GitHub template repo. The flow is a single linear pipeline orchestrated by `src/index.js`:

1. `src/prereqs.js` — verifies `git`, `gh`, `claude`, `uv` exist on PATH and that `gh` is authenticated. Aborts early if any are missing.
2. Interactive prompts via `@clack/prompts` collect: project dir name, parent folder, repo name, owner (defaulting to `gh api user`), visibility, whether to create a Project board, and an optional first research goal.
3. `src/github.js` wraps all `git` and `gh` shell calls via `execa`. Key sequence: `cloneTemplate` (shallow clone of `TEMPLATE.repo`, strips `.git`, re-inits `main`) → `initialCommit` → `createRepoAndPush` (`gh repo create --source=. --push`) → `createLabels` → `createProject` → `createIssue` + `addIssueToProject`.
4. `src/templates.js` is the single source of truth for the template repo slug, seed labels, and Project board name/columns. Changing what gets scaffolded usually means editing this file, not the orchestrator.
5. Post-scaffold: runs `uv sync` in the new project, then optionally launches `claude` with `stdio: 'inherit'`.

The `--skip-project`, `--skip-install`, `--skip-claude` flags short-circuit the corresponding stages. `--owner`, `--private`, `--public` skip their respective prompts.

`bin/cli.js` is a thin entrypoint that calls `run(process.argv)` and prints/exits on error.

The `sample-run/`, `sample-run-1/`, `test-run/` directories at the repo root are local scratch outputs from prior CLI runs — not part of the package (`package.json` `files` only ships `bin` and `src`).
