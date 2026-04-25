import { execa } from 'execa';
import os from 'node:os';

const isMac = os.platform() === 'darwin';
const isLinux = os.platform() === 'linux';

const TOOLS = [
  {
    bin: 'git',
    args: ['--version'],
    hint: 'https://git-scm.com/downloads',
    install: isMac
      ? { cmd: 'xcode-select', args: ['--install'], label: 'xcode-select --install' }
      : null,
  },
  {
    bin: 'gh',
    args: ['--version'],
    hint: 'https://cli.github.com — then run: gh auth login',
    install: isMac
      ? { cmd: 'brew', args: ['install', 'gh'], label: 'brew install gh', requires: 'brew' }
      : isLinux
        ? {
            cmd: 'sh',
            args: ['-c', '(type -p wget >/dev/null || sudo apt-get install -y wget) && sudo mkdir -p -m 755 /etc/apt/keyrings && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null && sudo apt update && sudo apt install -y gh'],
            label: 'apt install gh (via official repo)',
          }
        : null,
  },
  {
    bin: 'claude',
    args: ['--version'],
    hint: 'Claude Code not found. Install: npm i -g @anthropic-ai/claude-code  (or see https://docs.claude.com/claude-code)',
    install: { cmd: 'npm', args: ['i', '-g', '@anthropic-ai/claude-code'], label: 'npm i -g @anthropic-ai/claude-code', requires: 'npm' },
  },
  {
    bin: 'uv',
    args: ['--version'],
    hint: 'uv not found. Install: curl -LsSf https://astral.sh/uv/install.sh | sh  (https://docs.astral.sh/uv/)',
    install: { cmd: 'sh', args: ['-c', 'curl -LsSf https://astral.sh/uv/install.sh | sh'], label: 'curl -LsSf https://astral.sh/uv/install.sh | sh' },
  },
];

async function has(bin, args = ['--version']) {
  try {
    await execa(bin, args, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function checkPrereqs() {
  const missing = [];
  for (const tool of TOOLS) {
    if (!(await has(tool.bin, tool.args))) missing.push(tool);
  }
  return missing;
}

export async function installTool(tool) {
  if (!tool.install) {
    throw new Error(`No automated installer for ${tool.bin}. See: ${tool.hint}`);
  }
  if (tool.install.requires && !(await has(tool.install.requires, ['--version']))) {
    throw new Error(
      `Cannot auto-install ${tool.bin}: requires \`${tool.install.requires}\` which is not installed. See: ${tool.hint}`
    );
  }
  await execa(tool.install.cmd, tool.install.args, { stdio: 'inherit' });
  // Re-check after install — uv installer drops into ~/.local/bin which may not be on PATH yet
  if (!(await has(tool.bin, tool.args))) {
    throw new Error(
      `${tool.bin} still not on PATH after install. You may need to restart your shell, then rerun.`
    );
  }
}

export async function ghAuthed() {
  try {
    await execa('gh', ['auth', 'status'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
