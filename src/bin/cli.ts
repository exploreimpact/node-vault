#!/usr/bin/env node
import path from 'node:path';
import { promises as fs } from 'node:fs';
// Use package imports instead of relative imports to make it work when installed as a dependency
import { loadConfig } from '@exploreimpact/node-vault';
import {
  decryptAllInDir,
  decryptFile,
  encryptAllInDir,
  encryptFile,
  readPassword,
  ensureInit,
} from '@exploreimpact/node-vault';

function printHelp() {
  const help = `node-vault - Encrypt/Decrypt files with a password

Usage:
  node-vault help
  node-vault encrypt [filepath] [passwordFilepath]
  node-vault decrypt [filepath] [passwordFilepath]
  node-vault init

Notes:
- If filepath is omitted, all files inside the configured vault directory are processed.
- If passwordFilepath is provided, it overrides the configured password file location.
- The tool looks for node-vault.config.js/.ts and password.txt in the current working directory.`;
  console.log(help);
}

function niceError(e: any): string {
  return e?.message || String(e);
}

async function main(argv: string[]) {
  const [cmd, arg1, arg2] = argv.slice(2);
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    printHelp();
    return;
  }
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const vaultDir = path.resolve(cwd, config.vaultDir);
  const passwordFile = path.resolve(cwd, arg2 || config.passwordFilepath);

  try {
    switch (cmd) {
      case 'init': {
        // Create default JS config if neither exists
        const jsCfg = path.join(cwd, 'node-vault.config.js');
        const tsCfg = path.join(cwd, 'node-vault.config.ts');
        if (!(await exists(jsCfg)) && !(await exists(tsCfg))) {
          const content = `export default {\n\tvaultDir: './vault',\n\tpasswordFilepath: './password.txt',\n};\n`;
          await fs.writeFile(jsCfg, content, 'utf8');
          console.log(`Created ${path.relative(cwd, jsCfg)}`);
        }
        await ensureInit(cwd, config.vaultDir, config.passwordFilepath);
        console.log('Vault initialized.');
        break;
      }
      case 'encrypt': {
        const password = await readPassword(passwordFile);
        if (arg1) {
          const file = path.resolve(cwd, arg1);
          const status = await encryptFile(file, password);
          console.log(`${status}: ${path.relative(cwd, file)}`);
        } else {
          const res = await encryptAllInDir(vaultDir, password);
          reportProcessResult(cwd, res);
        }
        break;
      }
      case 'decrypt': {
        const password = await readPassword(passwordFile);
        if (arg1) {
          const file = path.resolve(cwd, arg1);
          const status = await decryptFile(file, password);
          console.log(`${status}: ${path.relative(cwd, file)}`);
        } else {
          const res = await decryptAllInDir(vaultDir, password);
          reportProcessResult(cwd, res);
        }
        break;
      }
      default:
        console.error(`Unknown command: ${cmd}`);
        printHelp();
    }
  } catch (e) {
    console.error('Error:', niceError(e));
    process.exitCode = 1;
  }
}

function reportProcessResult(
  cwd: string,
  res: { processed: string[]; skipped: string[]; errors: { file: string; error: string }[] },
) {
  for (const f of res.processed) console.log(`processed: ${path.relative(cwd, f)}`);
  for (const f of res.skipped) console.log(`skipped:   ${path.relative(cwd, f)}`);
  for (const er of res.errors)
    console.error(`error:     ${path.relative(cwd, er.file)} -> ${er.error}`);
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

main(process.argv);
