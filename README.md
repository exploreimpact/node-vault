# node-vault

A TypeScript ESM CLI and library to encrypt/decrypt files with a password, inspired by Ansible Vault.

Features:

- Encrypt and decrypt files (single file or entire vault directory)
- Strong encryption: AES-256-GCM with scrypt-derived key and random salt/IV
- CLI usage
- Configurable via `node-vault.config.js` or `node-vault.config.ts`

Important: Add your `password.txt` to .gitignore and run the encryption on a git commit-hook to avoid committing secrets.

## Installation

```
npm install --save-dev @exploreimpact/node-vault
```

Or globally:

```
npm install -g @exploreimpact/node-vault
```

## Configuration

Create a `node-vault.config.js` or `node-vault.config.ts` in your project root:

```js
// node-vault.config.js
export default {
  vaultDir: './vault', // Path to the directory containing files to encrypt/decrypt
  passwordFilepath: './password.txt', // Path to the password file
};
```

The password file should contain the password on the first line:

```
a-random-password-string
```

Tip: Ensure `password.txt` is in your `.gitignore`.

## CLI Usage

```
node-vault help
node-vault encrypt [filepath] [passwordFilepath]
node-vault decrypt [filepath] [passwordFilepath]
node-vault init
```

- help: Shows usage
- encrypt: Encrypt a single file if `filepath` provided, otherwise encrypt all files in `vaultDir`
- decrypt: Decrypt a single file if `filepath` provided, otherwise decrypt all files in `vaultDir`
- init: Creates default config (if missing), the vault directory, and a `password.txt` with a random password

By default, the CLI looks for `node-vault.config.js/.ts` and `password.txt` in the current working directory. You can override the password file by passing `passwordFilepath` as the second argument to `encrypt`/`decrypt`.

## Programmatic API

Import from the package (ESM only):

```ts
import { encryptData, decryptData } from 'node-vault';
```

## Format of encrypted files

Encrypted files start with:

```
NODE-VAULT v1
```

followed by base64-encoded JSON containing the algorithm, salt, IV, auth tag, and ciphertext. This allows safe in-place encryption of any plaintext file.

## Development

- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`
- Format: `npm run format`

This project uses TypeScript with full ESM, Jest for tests, ESLint for linting, and Prettier for formatting.

## Release flow

To release a new package version, bump the version inside the package.json.
A GitHub workflow will automatically create a GitHub release and publish to npm.
