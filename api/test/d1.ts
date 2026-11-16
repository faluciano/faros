// A just-enough stand-in for a D1 database, backed by Node's built-in SQLite,
// so the API can be tested without the Workers runtime.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

class TestStatement {
	readonly #db: DatabaseSync;
	readonly #sql: string;
	readonly #values: SQLInputValue[];

	constructor(db: DatabaseSync, sql: string, values: SQLInputValue[] = []) {
		this.#db = db;
		this.#sql = sql;
		this.#values = values;
	}

	bind(...values: SQLInputValue[]) {
		return new TestStatement(this.#db, this.#sql, values);
	}

	execute() {
		const results = this.#db.prepare(this.#sql).all(...this.#values);
		const { changes } = this.#db.prepare("SELECT changes() AS changes").get() as { changes: number };
		return { results, success: true, meta: { changes } };
	}

	async all() {
		return this.execute();
	}

	async run() {
		return this.execute();
	}

	async first() {
		return this.execute().results[0] ?? null;
	}
}

export class TestD1 {
	readonly #db = new DatabaseSync(":memory:");

	constructor() {
		this.#db.exec("PRAGMA foreign_keys = ON");
		const migrations = join(import.meta.dirname, "..", "migrations");
		for (const file of readdirSync(migrations).sort()) {
			this.#db.exec(readFileSync(join(migrations, file), "utf8"));
		}
	}

	prepare(sql: string) {
		return new TestStatement(this.#db, sql);
	}

	// D1 runs a batch as one transaction; so does this.
	async batch(statements: TestStatement[]) {
		this.#db.exec("BEGIN");
		try {
			const results = statements.map((statement) => statement.execute());
			this.#db.exec("COMMIT");
			return results;
		} catch (error) {
			this.#db.exec("ROLLBACK");
			throw error;
		}
	}

	exec(sql: string) {
		this.#db.exec(sql);
	}
}
