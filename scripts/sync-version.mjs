import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const pkgPath = path.join(rootDir, 'package.json');
const cargoTomlPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version;

if (!version || typeof version !== 'string') {
  console.error('[sync-version] Invalid version in package.json');
  process.exit(1);
}

const cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
const updatedCargoToml = cargoToml.replace(
  /(\[package\][\s\S]*?^version\s*=\s*")[^"]+(")/m,
  `$1${version}$2`
);

if (cargoToml !== updatedCargoToml) {
  fs.writeFileSync(cargoTomlPath, updatedCargoToml, 'utf8');
  console.log(`[sync-version] Updated src-tauri/Cargo.toml version -> ${version}`);
} else {
  console.log(`[sync-version] src-tauri/Cargo.toml already at ${version}`);
}
