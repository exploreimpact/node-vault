import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function readFileUtf8(file: string): Promise<string> {
  return fs.readFile(file, 'utf8');
}

export async function readFileBuffer(file: string): Promise<Buffer> {
  return fs.readFile(file);
}

export async function writeFileUtf8(file: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf8');
}

export async function writeFileBuffer(file: string, content: Buffer): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function listFilesRecursively(dir: string): Promise<string[]> {
  const items = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      const sub = await listFilesRecursively(full);
      results.push(...sub);
    } else if (item.isFile()) {
      results.push(full);
    }
  }
  return results;
}
