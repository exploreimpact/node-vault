import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

export type EncryptedPayload = {
  v: 1; // version
  a: 'aes-256-gcm';
  s: string; // base64 salt
  i: string; // base64 iv
  t: string; // base64 auth tag
  c: string; // base64 ciphertext
};

export const VAULT_MAGIC_HEADER = 'NODE-VAULT v1\n';

function deriveKey(password: string, salt: Buffer): Buffer {
  // scrypt with N=16384, r=8, p=1 is default for node scryptSync
  return scryptSync(password, salt, 32);
}

export function isEncrypted(content: Buffer | string): boolean {
  const str = Buffer.isBuffer(content) ? content.toString('utf8') : content;
  return str.startsWith(VAULT_MAGIC_HEADER);
}

export function encryptData(plaintext: Buffer, password: string): string {
  const salt = randomBytes(16);
  const key = deriveKey(password, salt);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload: EncryptedPayload = {
    v: 1,
    a: 'aes-256-gcm',
    s: salt.toString('base64'),
    i: iv.toString('base64'),
    t: authTag.toString('base64'),
    c: ciphertext.toString('base64'),
  };
  return VAULT_MAGIC_HEADER + Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

export function decryptData(encryptedText: string, password: string): Buffer {
  if (!encryptedText.startsWith(VAULT_MAGIC_HEADER)) {
    throw new Error('File is not a node-vault encrypted file (missing header).');
  }
  const b64 = encryptedText.slice(VAULT_MAGIC_HEADER.length);
  let parsed: EncryptedPayload;
  try {
    parsed = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as EncryptedPayload;
  } catch (e) {
    throw new Error('Invalid encrypted payload format.');
  }
  if (parsed.v !== 1 || parsed.a !== 'aes-256-gcm') {
    throw new Error('Unsupported vault format or algorithm.');
  }
  const salt = Buffer.from(parsed.s, 'base64');
  const iv = Buffer.from(parsed.i, 'base64');
  const tag = Buffer.from(parsed.t, 'base64');
  const ciphertext = Buffer.from(parsed.c, 'base64');
  const key = deriveKey(password, salt);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext;
}
