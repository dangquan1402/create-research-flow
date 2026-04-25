import { execa } from 'execa';
import { rm } from 'node:fs/promises';
import path from 'node:path';

export async function cloneTemplate({ templateRepo, name, cwd }) {
  await execa('git', ['clone', '--depth', '1', `https://github.com/${templateRepo}.git`, name], {
    cwd,
    stdio: 'inherit',
  });
  const dest = path.join(cwd, name);
  await rm(path.join(dest, '.git'), { recursive: true, force: true });
  await execa('git', ['init', '-b', 'main'], { cwd: dest, stdio: 'ignore' });
  return dest;
}

export async function initialCommit(cwd) {
  await execa('git', ['add', '.'], { cwd, stdio: 'ignore' });
  await execa('git', ['commit', '-m', 'chore: initial scaffold from research-flow template'], {
    cwd,
    stdio: 'ignore',
  });
}

export async function createRepoAndPush({ owner, name, visibility, cwd }) {
  const full = `${owner}/${name}`;
  await execa(
    'gh',
    ['repo', 'create', full, `--${visibility}`, '--source=.', '--remote=origin', '--push'],
    { cwd, stdio: 'inherit' }
  );
  return full;
}

export async function currentUser() {
  const { stdout } = await execa('gh', ['api', 'user', '--jq', '.login']);
  return stdout.trim();
}

export async function createLabels(repo, labels) {
  for (const l of labels) {
    try {
      await execa(
        'gh',
        ['label', 'create', l.name, '--repo', repo, '--color', l.color, '--description', l.description, '--force'],
        { stdio: 'ignore' }
      );
    } catch {
      // ignore
    }
  }
}

export async function createProject({ owner, title }) {
  try {
    const { stdout } = await execa('gh', ['project', 'create', '--owner', owner, '--title', title, '--format', 'json']);
    return JSON.parse(stdout);
  } catch (err) {
    return { error: err.shortMessage ?? err.message };
  }
}

export async function createIssue({ repo, title, body, labels }) {
  const args = ['issue', 'create', '--repo', repo, '--title', title, '--body', body];
  for (const l of labels) args.push('--label', l);
  const { stdout } = await execa('gh', args);
  return stdout.trim();
}

export async function addIssueToProject({ owner, projectNumber, url }) {
  await execa('gh', ['project', 'item-add', String(projectNumber), '--owner', owner, '--url', url], {
    stdio: 'ignore',
  });
}

const COLUMN_COLORS = ['GRAY', 'YELLOW', 'ORANGE', 'PURPLE', 'BLUE', 'GREEN', 'PINK', 'RED'];

// Best-effort: rename the default Status field options on a Projects v2 board.
// Returns { ok: true } or { error: '...' } — never throws.
export async function setProjectColumns({ owner, projectNumber, columns }) {
  try {
    const { stdout: fieldsJson } = await execa('gh', [
      'project', 'field-list', String(projectNumber),
      '--owner', owner, '--format', 'json',
    ]);
    const fields = JSON.parse(fieldsJson).fields ?? [];
    const status = fields.find((f) => f.name === 'Status' && f.type === 'ProjectV2SingleSelectField');
    if (!status) return { error: 'Status field not found on project' };

    const options = columns.map((name, i) => ({
      name,
      color: COLUMN_COLORS[i % COLUMN_COLORS.length],
      description: '',
    }));

    const mutation = `mutation($fieldId: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
      updateProjectV2Field(input: { fieldId: $fieldId, singleSelectOptions: $options }) {
        projectV2Field { ... on ProjectV2SingleSelectField { id } }
      }
    }`;

    await execa('gh', [
      'api', 'graphql',
      '-f', `query=${mutation}`,
      '-f', `fieldId=${status.id}`,
      '--raw-field', `options=${JSON.stringify(options)}`,
    ], { stdio: 'ignore' });

    return { ok: true };
  } catch (err) {
    return { error: err.shortMessage ?? err.message };
  }
}
