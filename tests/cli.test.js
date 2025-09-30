const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

function runCli(cwd, args) {
  const bin = path.resolve('dist/bin/cli.js');
  const res = spawnSync('node', [bin, ...args], { cwd, encoding: 'utf8' });
  if (res.error) throw res.error;
  return res;
}

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

describe('node-vault CLI', () => {
  test('init, encrypt and decrypt a file roundtrip', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'node-vault-test-'));
    // Project structure
    writeFile(
      path.join(tmp, 'node-vault.config.js'),
      "export default {\n  vaultDir: './vault',\n  passwordFilepath: './password.txt',\n};\n",
    );
    fs.mkdirSync(path.join(tmp, 'vault'));
    const secretFile = path.join(tmp, 'vault', 'secret.txt');
    writeFile(secretFile, 'hello world');

    // init to create password
    let res = runCli(tmp, ['init']);
    expect(res.status).toBe(0);
    expect(fs.existsSync(path.join(tmp, 'password.txt'))).toBe(true);

    const passwordPath = path.join(tmp, 'password.txt');
    const passwordContent = fs.readFileSync(passwordPath, 'utf8').trim();
    expect(passwordContent.length).toBeGreaterThan(0);

    // encrypt all
    res = runCli(tmp, ['encrypt']);
    expect(res.status).toBe(0);
    const enc = fs.readFileSync(secretFile, 'utf8');
    expect(enc.startsWith('NODE-VAULT v1\n')).toBe(true);

    // decrypt single file
    res = runCli(tmp, ['decrypt', 'vault/secret.txt']);
    expect(res.status).toBe(0);
    const dec = fs.readFileSync(secretFile, 'utf8');
    expect(dec).toBe('hello world');
  });
});
