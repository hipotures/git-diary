import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { repo, daily } from './schema.js';

function createTestDb() {
	const sqlite = new Database(':memory:');
	const db = drizzle(sqlite, { schema: { repo, daily } });

	// Create tables manually (simpler than migrations for tests)
	sqlite.exec(`
		CREATE TABLE repo (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			owner TEXT NOT NULL,
			name TEXT NOT NULL,
			last_sync_at TEXT,
			created_at TEXT NOT NULL
		);

		CREATE TABLE daily (
			repo_id INTEGER NOT NULL REFERENCES repo(id),
			day TEXT NOT NULL,
			commits INTEGER NOT NULL,
			PRIMARY KEY (repo_id, day)
		);
	`);

	return { db, sqlite };
}

describe('Database queries', () => {
	let db: ReturnType<typeof drizzle>;
	let sqlite: Database.Database;

	beforeEach(() => {
		const testDb = createTestDb();
		db = testDb.db;
		sqlite = testDb.sqlite;
	});

	it('should insert and retrieve repo', () => {
		const result = db
			.insert(repo)
			.values({ owner: 'test', name: 'repo1', createdAt: '2026-02-12T00:00:00Z' })
			.run();

		const repoId = Number(result.lastInsertRowid);
		expect(repoId).toBeGreaterThan(0);

		const repos = db.select().from(repo).all();
		expect(repos).toHaveLength(1);
		expect(repos[0].owner).toBe('test');
		expect(repos[0].name).toBe('repo1');
	});

	it('should insert and retrieve daily data', () => {
		const result = db
			.insert(repo)
			.values({ owner: 'test', name: 'repo1', createdAt: '2026-02-12T00:00:00Z' })
			.run();

		const repoId = Number(result.lastInsertRowid);

		db.insert(daily)
			.values([
				{ repoId, day: '2026-02-12', commits: 10 },
				{ repoId, day: '2026-02-11', commits: 5 }
			])
			.run();

		const dailyData = db.select().from(daily).all();
		expect(dailyData).toHaveLength(2);
		expect(dailyData[0].commits).toBe(10);
	});

	it('should enforce composite primary key on daily', () => {
		const result = db
			.insert(repo)
			.values({ owner: 'test', name: 'repo1', createdAt: '2026-02-12T00:00:00Z' })
			.run();

		const repoId = Number(result.lastInsertRowid);

		db.insert(daily).values({ repoId, day: '2026-02-12', commits: 10 }).run();

		// Attempting to insert duplicate should fail
		expect(() => {
			db.insert(daily).values({ repoId, day: '2026-02-12', commits: 20 }).run();
		}).toThrow();
	});

	it('should upsert daily data', () => {
		const result = db
			.insert(repo)
			.values({ owner: 'test', name: 'repo1', createdAt: '2026-02-12T00:00:00Z' })
			.run();

		const repoId = Number(result.lastInsertRowid);

		db.insert(daily).values({ repoId, day: '2026-02-12', commits: 10 }).run();

		// Upsert with higher value
		db.insert(daily)
			.values({ repoId, day: '2026-02-12', commits: 20 })
			.onConflictDoUpdate({
				target: [daily.repoId, daily.day],
				set: { commits: 20 }
			})
			.run();

		const dailyData = db.select().from(daily).all();
		expect(dailyData).toHaveLength(1);
		expect(dailyData[0].commits).toBe(20);
	});
});
