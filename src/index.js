import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { execa } from 'execa';
import path from 'node:path';
import os from 'node:os';
import { existsSync } from 'node:fs';
import { TEMPLATE } from './templates.js';
import { checkPrereqs, ghAuthed, installTool } from './prereqs.js';
import {
  cloneTemplate,
  initialCommit,
  createRepoAndPush,
  currentUser,
  createLabels,
  createProject,
  createIssue,
  addIssueToProject,
  setProjectColumns,
} from './github.js';

export async function run(argv) {
  const program = new Command();
  program
    .name('create-research-flow')
    .description('Scaffold a new Research Flow project (Claude Code + gh + GitHub Project).')
    .argument('[project-name]', 'Name of the new project / repo')
    .option('--private', 'Create the repo as private', false)
    .option('--public', 'Create the repo as public', false)
    .option('--owner <owner>', 'GitHub owner/org (otherwise prompted)')
    .option('--skip-project', 'Skip GitHub Project board creation')
    .option('--project-name <name>', 'GitHub Project board title (otherwise prompted)')
    .option('--skip-install', 'Skip `uv sync`')
    .option('--skip-claude', 'Skip launching `claude`')
    .parse(argv);

  const opts = program.opts();
  const [cliName] = program.args;

  p.intro(chalk.bgCyan.black(' create-research-flow '));

  // 1. Prereqs — git, gh, claude, uv
  let missing = await checkPrereqs();
  if (missing.length) {
    p.log.warn('Missing required tools:');
    for (const m of missing) {
      const installable = m.install ? chalk.dim(`(install: ${m.install.label})`) : chalk.dim('(no auto-installer)');
      p.log.message(`  • ${chalk.bold(m.bin)} — ${m.hint} ${installable}`);
    }
    const autoInstall = await p.confirm({
      message: `Install ${missing.filter((m) => m.install).length} missing tool(s) now?`,
      initialValue: true,
    });
    if (p.isCancel(autoInstall) || !autoInstall) {
      p.cancel('Install the tools above and rerun.');
      process.exit(1);
    }
    for (const m of missing) {
      if (!m.install) {
        p.log.error(`Skipping ${m.bin}: no automated installer. See: ${m.hint}`);
        continue;
      }
      p.log.step(`Installing ${m.bin} → ${m.install.label}`);
      try {
        await installTool(m);
        p.log.success(`${m.bin} installed`);
      } catch (err) {
        p.cancel(`Failed to install ${m.bin}: ${err.message}`);
        process.exit(1);
      }
    }
    missing = await checkPrereqs();
    if (missing.length) {
      p.cancel(`Still missing: ${missing.map((m) => m.bin).join(', ')}. Restart your shell and rerun.`);
      process.exit(1);
    }
  }
  p.log.success('Prereqs OK: git, gh, claude, uv');

  // 2. gh auth
  if (!(await ghAuthed())) {
    p.cancel('GitHub CLI not authenticated. Run: gh auth login');
    process.exit(1);
  }

  // 3. Project name (always prompt if not passed)
  const name = cliName ?? (await askName());
  if (p.isCancel(name)) return cancel();

  // 3b. Parent folder (where to create the project directory)
  const parentAnswer = await p.text({
    message: 'Parent folder (where to create the project)?',
    placeholder: process.cwd(),
    initialValue: process.cwd(),
    validate: (v) => {
      const resolved = path.resolve(expandHome(v.trim()));
      return existsSync(resolved) ? undefined : `Path does not exist: ${resolved}`;
    },
  });
  if (p.isCancel(parentAnswer)) return cancel();
  const cwd = path.resolve(expandHome(parentAnswer.trim()));

  if (existsSync(path.resolve(cwd, name))) {
    p.cancel(`Directory ${path.join(cwd, name)} already exists.`);
    process.exit(1);
  }

  // 4. Repo name (defaults to project name, user can override)
  const repoNameAnswer = await p.text({
    message: 'GitHub repo name?',
    placeholder: name,
    initialValue: name,
    validate: (v) =>
      !v?.trim()
        ? 'Required'
        : /^[a-z0-9][a-z0-9-_.]*$/i.test(v.trim())
          ? undefined
          : 'Letters, numbers, dash, dot, underscore only',
  });
  if (p.isCancel(repoNameAnswer)) return cancel();
  const repoName = repoNameAnswer.trim();

  // 5. Owner (always prompt, defaulting to gh authed user)
  let owner = opts.owner;
  if (!owner) {
    const authedUser = await currentUser().catch(() => '');
    const answer = await p.text({
      message: 'GitHub owner (user or org)?',
      placeholder: authedUser || 'your-github-username',
      initialValue: authedUser,
      validate: (v) => (!v?.trim() ? 'Required' : undefined),
    });
    if (p.isCancel(answer)) return cancel();
    owner = answer.trim();
  }

  // 5. Visibility
  let visibility = opts.private ? 'private' : opts.public ? 'public' : null;
  if (!visibility) {
    const v = await p.select({
      message: 'Repository visibility?',
      options: [
        { value: 'private', label: 'Private' },
        { value: 'public', label: 'Public' },
      ],
      initialValue: 'private',
    });
    if (p.isCancel(v)) return cancel();
    visibility = v;
  }

  // 6. Optional project board + first goal
  const createProjectBoard =
    !opts.skipProject &&
    (await p.confirm({
      message: `Create a GitHub Project board for ${owner}?`,
      initialValue: true,
    }));
  if (p.isCancel(createProjectBoard)) return cancel();

  let projectTitle = opts.projectName || TEMPLATE.projectName;
  if (createProjectBoard && !opts.projectName) {
    const t = await p.text({
      message: 'Project board title?',
      placeholder: TEMPLATE.projectName,
      initialValue: TEMPLATE.projectName,
      validate: (v) => (!v?.trim() ? 'Required' : undefined),
    });
    if (p.isCancel(t)) return cancel();
    projectTitle = t.trim();
  }

  const firstGoal = await p.text({
    message: 'First research goal (leave blank to skip)?',
    placeholder: 'e.g. Transformer architectures for arithmetic',
  });
  if (p.isCancel(firstGoal)) return cancel();

  let researchQuestion = '';
  let dataSources = '';
  if (firstGoal?.trim()) {
    const q = await p.text({
      message: 'Specific research question to answer?',
      placeholder: 'e.g. Does positional coupling help with multi-digit multiplication?',
    });
    if (p.isCancel(q)) return cancel();
    researchQuestion = (q ?? '').trim();

    const ds = await p.text({
      message: 'Initial data sources (URLs / paths / dataset names, comma-separated)?',
      placeholder: 'e.g. arxiv:2310.16028, ./data/math-1k.jsonl',
    });
    if (p.isCancel(ds)) return cancel();
    dataSources = (ds ?? '').trim();
  }

  // --- Execute ---
  const s = p.spinner();

  s.start(`Cloning ${TEMPLATE.repo}`);
  const projectRoot = await cloneTemplate({ templateRepo: TEMPLATE.repo, name, cwd });
  s.stop(`Template cloned into ./${name}`);

  s.start('Creating initial commit');
  await initialCommit(projectRoot);
  s.stop('Initial commit created');

  s.start(`Creating GitHub repo ${owner}/${repoName} and pushing`);
  const repo = await createRepoAndPush({ owner, name: repoName, visibility, cwd: projectRoot });
  s.stop(`Repo pushed: ${repo}`);

  s.start('Seeding labels');
  await createLabels(repo, TEMPLATE.seedLabels);
  s.stop('Labels seeded');

  let project = null;
  if (createProjectBoard) {
    s.start(`Creating GitHub Project "${projectTitle}"`);
    project = await createProject({ owner, title: projectTitle });
    if (project?.error) {
      s.stop(chalk.yellow(`Project skipped: ${project.error}`));
      project = null;
    } else {
      s.stop(`Project created: #${project.number}`);
      s.start(`Setting columns: ${TEMPLATE.projectColumns.join(' | ')}`);
      const colRes = await setProjectColumns({
        owner,
        projectNumber: project.number,
        columns: TEMPLATE.projectColumns,
      });
      if (colRes.ok) s.stop('Columns set');
      else s.stop(chalk.yellow(`Columns left as default (${colRes.error})`));
    }
  }

  if (firstGoal?.trim()) {
    s.start(`Opening first issue: ${firstGoal}`);
    const body = [
      '## Research Goal',
      firstGoal,
      researchQuestion ? `\n## Research Question\n${researchQuestion}` : '',
      dataSources ? `\n## Initial Data Sources\n${dataSources.split(',').map((s) => `- ${s.trim()}`).join('\n')}` : '',
      '\n---\n_Created by create-research-flow. See `CLAUDE.md` for the research loop and `memory/` for findings._',
    ].filter(Boolean).join('\n');
    const issueUrl = await createIssue({
      repo,
      title: firstGoal,
      body,
      labels: ['research-goal'],
    });
    s.stop(`Issue: ${issueUrl}`);
    if (project?.number) {
      await addIssueToProject({ owner, projectNumber: project.number, url: issueUrl }).catch(() => {});
    }
  }

  if (!opts.skipInstall) {
    s.start('Running `uv sync`');
    try {
      await execa('uv', ['sync'], { cwd: projectRoot, stdio: 'ignore' });
      s.stop('Dependencies installed');
    } catch (err) {
      s.stop(chalk.yellow(`uv sync failed: ${err.shortMessage ?? err.message}`));
    }
  }

  p.outro(chalk.green('Ready.'));

  console.log(`
Next steps:
  ${chalk.cyan(`cd ${path.relative(process.cwd(), projectRoot) || name}`)}
  ${chalk.cyan('claude')}          # launch Claude Code
  ${chalk.cyan('gh browse')}       # open the repo on GitHub${project?.url ? `\n  ${chalk.cyan(`open ${project.url}`)}  # open the project board` : ''}
`);

  if (!opts.skipClaude) {
    const launch = await p.confirm({ message: 'Launch `claude` now?', initialValue: true });
    if (!p.isCancel(launch) && launch) {
      await execa('claude', [], { cwd: projectRoot, stdio: 'inherit' });
    }
  }
}

async function askName() {
  return p.text({
    message: 'Local project directory name?',
    validate: (v) =>
      !v
        ? 'Required'
        : /^[a-z0-9][a-z0-9-_]*$/i.test(v)
          ? undefined
          : 'Letters, numbers, dash, underscore only',
  });
}

function expandHome(p) {
  if (!p) return p;
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function cancel() {
  p.cancel('Cancelled.');
  process.exit(0);
}
