import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { eq } from 'drizzle-orm';
import { getDb } from '../src/lib/server/db/connection.js';
import { repo, daily } from '../src/lib/server/db/schema.js';

const db = getDb();

// Fetch all repos with their daily data
const repos = db.select().from(repo).all();

const snapshot = {
	generatedAt: new Date().toISOString(),
	repos: repos.map((r) => {
		const dailyData = db
			.select({ day: daily.day, commits: daily.commits })
			.from(daily)
			.where(eq(daily.repoId, r.id))
			.orderBy(daily.day)
			.all();

		return {
			id: r.id,
			owner: r.owner,
			name: r.name,
			lastSyncAt: r.lastSyncAt,
			daily: dailyData
		};
	})
};

const outputDir = resolve('static');
mkdirSync(outputDir, { recursive: true });

const outputPath = resolve(outputDir, 'snapshot.json');
writeFileSync(outputPath, JSON.stringify(snapshot, null, 2), 'utf-8');

console.log(`Snapshot generated: ${outputPath}`);
console.log(`Total repos: ${snapshot.repos.length}`);
console.log(`Total daily entries: ${snapshot.repos.reduce((sum, r) => sum + r.daily.length, 0)}`);
