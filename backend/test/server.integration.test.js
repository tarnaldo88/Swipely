const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');

const backendDir = path.resolve(__dirname, '..');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForHealthyServer(baseUrl, timeoutMs = 5000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch (_error) {
      // Server not ready yet.
    }

    await wait(100);
  }

  throw new Error(`Server did not become healthy within ${timeoutMs}ms`);
}

function startServer(envOverrides = {}) {
  const port = String(46000 + Math.floor(Math.random() * 1000));
  const env = {
    ...process.env,
    PORT: port,
    STRIPE_SECRET_KEY: 'sk_test_integration',
    STRIPE_WEBHOOK_SECRET: 'whsec_integration',
    ...envOverrides,
  };

  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: backendDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', chunk => {
    stdout += chunk.toString();
  });

  child.stderr.on('data', chunk => {
    stderr += chunk.toString();
  });

  return {
    child,
    port,
    baseUrl: `http://127.0.0.1:${port}`,
    getOutput: () => ({ stdout, stderr }),
  };
}

test('server boots and serves /health with real process startup', async () => {
  const { child, baseUrl, getOutput } = startServer();

  try {
    await waitForHealthyServer(baseUrl);

    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { ok: true });
  } finally {
    child.kill();
  }

  await new Promise(resolve => child.once('close', resolve));

  const { stderr } = getOutput();
  assert.equal(stderr, '');
});

test('server exits with error when STRIPE_SECRET_KEY is missing', async () => {
  const { child, getOutput } = startServer({ STRIPE_SECRET_KEY: '' });

  const exitCode = await new Promise(resolve => child.once('close', resolve));
  const { stderr } = getOutput();

  assert.notEqual(exitCode, 0);
  assert.match(stderr, /STRIPE_SECRET_KEY is required/);
});
