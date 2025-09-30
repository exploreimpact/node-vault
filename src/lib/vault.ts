import path from 'node:path';
import { promises as fs } from 'node:fs';
import { decryptData, encryptData, isEncrypted, VAULT_MAGIC_HEADER } from './crypto.js';
import {
  listFilesRecursively,
  pathExists,
  readFileBuffer,
  readFileUtf8,
  writeFileUtf8,
} from './fs-utils.js';

export type ProcessResult = {
  processed: string[];
  skipped: string[];
  errors: { file: string; error: string }[];
};

export async function readPassword(passwordFile: string): Promise<string> {
  const content = await readFileUtf8(passwordFile).catch(() => {
    throw new Error(
      `Password file not found at: ${passwordFile}. Create it or run 'node-vault init'.`,
    );
  });
  const firstLine = content.split(/\r?\n/)[0];
  if (!firstLine) throw new Error('Password file is empty.');
  return firstLine.trim();
}

export async function encryptFile(
  file: string,
  password: string,
): Promise<'processed' | 'skipped'> {
  const data = await readFileBuffer(file);
  if (isEncrypted(data)) {
    return 'skipped';
  }
  const encrypted = encryptData(data, password);
  await writeFileUtf8(file, encrypted);
  return 'processed';
}

export async function decryptFile(
  file: string,
  password: string,
): Promise<'processed' | 'skipped'> {
  const content = await readFileUtf8(file);
  if (!content.startsWith(VAULT_MAGIC_HEADER)) return 'skipped';
  const decrypted = decryptData(content, password);
  await fs.writeFile(file, decrypted);
  return 'processed';
}

export async function encryptAllInDir(dir: string, password: string): Promise<ProcessResult> {
  const files = (await listFilesRecursively(dir)).filter(
    (f) => path.basename(f) !== 'password.txt',
  );
  const result: ProcessResult = { processed: [], skipped: [], errors: [] };
  for (const file of files) {
    try {
      const status = await encryptFile(file, password);
      result[status].push(file);
    } catch (e: any) {
      result.errors.push({ file, error: e?.message || String(e) });
    }
  }
  return result;
}

export async function decryptAllInDir(dir: string, password: string): Promise<ProcessResult> {
  const files = (await listFilesRecursively(dir)).filter(
    (f) => path.basename(f) !== 'password.txt',
  );
  const result: ProcessResult = { processed: [], skipped: [], errors: [] };
  for (const file of files) {
    try {
      const status = await decryptFile(file, password);
      result[status].push(file);
    } catch (e: any) {
      result.errors.push({ file, error: e?.message || String(e) });
    }
  }
  return result;
}

export async function ensureInit(targetDir: string, vaultDirRel: string, passwordFileRel: string) {
  const cwd = targetDir;
  const vaultDir = path.resolve(cwd, vaultDirRel);
  const passwordFile = path.resolve(cwd, passwordFileRel);
  if (!(await pathExists(vaultDir))) {
    await fs.mkdir(vaultDir, { recursive: true });
  }
  if (!(await pathExists(passwordFile))) {
    const { randomBytes } = await import('node:crypto');
    const randomPassword = randomBytes(32).toString('hex');
    await fs.writeFile(passwordFile, randomPassword + '\n', 'utf8');
  }
}
