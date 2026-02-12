import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function load() {
	const pkgPath = join(__dirname, '../../../package.json');
	const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

	return {
		version: pkg.version
	};
}
