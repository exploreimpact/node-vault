import { promises as fs } from 'node:fs';
import path from 'node:path';

export type VaultConfig = {
  vaultDir: string;
  passwordFilepath: string;
};

export const DEFAULT_CONFIG: VaultConfig = {
  vaultDir: './vault',
  passwordFilepath: './password.txt',
};

async function loadJsConfig(cwd: string): Promise<VaultConfig | null> {
  const jsPath = path.join(cwd, 'node-vault.config.js');
  try {
    await fs.access(jsPath);
  } catch {
    return null;
  }
  const moduleUrl = pathToFileURL(jsPath).href;
  const mod = await import(moduleUrl);
  const cfg = (mod.default || mod) as Partial<VaultConfig>;
  return { ...DEFAULT_CONFIG, ...cfg } as VaultConfig;
}

function pathToFileURL(p: string) {
  const resolved = path.resolve(p);
  const url = new URL('file://');
  // Ensure absolute path starts with /
  url.pathname = resolved.startsWith('/') ? resolved : '/' + resolved;
  return url;
}

async function loadTsConfig(cwd: string): Promise<VaultConfig | null> {
  const tsPath = path.join(cwd, 'node-vault.config.ts');
  try {
    await fs.access(tsPath);
  } catch {
    return null;
  }
  // Best-effort simple parser for `export default { ... }`
  const content = await fs.readFile(tsPath, 'utf8');
  const match = content.match(/export\s+default\s+([\s\S]*?);?\s*$/);
  if (!match) return null;
  const objStr = match[1];
  try {
    // eslint-disable-next-line no-new-func
    const obj = new Function(`return (${objStr});`)() as Partial<VaultConfig>;
    return { ...DEFAULT_CONFIG, ...obj } as VaultConfig;
  } catch {
    return null;
  }
}

export async function loadConfig(cwd: string = process.cwd()): Promise<VaultConfig> {
  const js = await loadJsConfig(cwd);
  if (js) return js;
  const ts = await loadTsConfig(cwd);
  if (ts) return ts;
  return DEFAULT_CONFIG;
}
