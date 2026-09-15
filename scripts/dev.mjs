import { spawn, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const npmCliPath = process.env.npm_execpath;
const npmCommand = npmCliPath
  ? process.execPath
  : process.platform === 'win32'
    ? 'npm.cmd'
    : 'npm';
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const coreEnvironment = {
  ...process.env,
  MSGDOCK_DATABASE_PATH:
    process.env.MSGDOCK_DATABASE_PATH ??
    resolve(projectRoot, '.msgdock', 'msgdock.sqlite'),
};
const children = [];
let shuttingDown = false;

function stopChild(child) {
  if (child.exitCode !== null) return;

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
    });
    return;
  }

  child.kill('SIGTERM');
}

function shutdown(exitCode, graceful = false) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (!graceful || process.platform !== 'win32') {
    for (const child of children) stopChild(child);
  }

  const timeout = setTimeout(() => process.exit(exitCode), 2_000);
  timeout.unref();
}

for (const command of [
  {
    args: ['run', 'dev', '--workspace', '@msgdock/core-runtime'],
    env: coreEnvironment,
  },
  { args: ['run', 'dev', '--workspace', '@msgdock/web'], env: process.env },
]) {
  const child = spawn(
    npmCommand,
    npmCliPath ? [npmCliPath, ...command.args] : command.args,
    { cwd: projectRoot, env: command.env, stdio: 'inherit' },
  );
  children.push(child);
  child.on('error', () => shutdown(1));
  child.on('exit', (code) => {
    if (!shuttingDown) shutdown(code ?? 1);
  });
}

process.once('SIGINT', () => shutdown(0, true));
process.once('SIGTERM', () => shutdown(0, true));
