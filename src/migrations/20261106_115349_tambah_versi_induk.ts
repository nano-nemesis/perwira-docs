import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`docs\` ADD \`versi\` text DEFAULT '1.0';`)
  await db.run(sql`ALTER TABLE \`docs\` ADD \`induk_id\` integer REFERENCES docs(id);`)
  await db.run(sql`CREATE INDEX \`docs_induk_idx\` ON \`docs\` (\`induk_id\`);`)
  await db.run(sql`ALTER TABLE \`_docs_v\` ADD \`version_versi\` text DEFAULT '1.0';`)
  await db.run(sql`ALTER TABLE \`_docs_v\` ADD \`version_induk_id\` integer REFERENCES docs(id);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_version_induk_idx\` ON \`_docs_v\` (\`version_induk_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_docs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`slug\` text,
  	\`kode\` text,
  	\`produk_id\` integer,
  	\`urutan\` numeric DEFAULT 100,
  	\`perlu_review\` integer,
  	\`video\` text,
  	\`fokus_keyphrase\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`produk_id\`) REFERENCES \`produk\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_docs\`("id", "slug", "kode", "produk_id", "urutan", "perlu_review", "video", "fokus_keyphrase", "updated_at", "created_at", "_status") SELECT "id", "slug", "kode", "produk_id", "urutan", "perlu_review", "video", "fokus_keyphrase", "updated_at", "created_at", "_status" FROM \`docs\`;`)
  await db.run(sql`DROP TABLE \`docs\`;`)
  await db.run(sql`ALTER TABLE \`__new_docs\` RENAME TO \`docs\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE UNIQUE INDEX \`docs_slug_idx\` ON \`docs\` (\`slug\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`docs_kode_idx\` ON \`docs\` (\`kode\`);`)
  await db.run(sql`CREATE INDEX \`docs_produk_idx\` ON \`docs\` (\`produk_id\`);`)
  await db.run(sql`CREATE INDEX \`docs_updated_at_idx\` ON \`docs\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`docs_created_at_idx\` ON \`docs\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`docs__status_idx\` ON \`docs\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`__new__docs_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_slug\` text,
  	\`version_kode\` text,
  	\`version_produk_id\` integer,
  	\`version_urutan\` numeric DEFAULT 100,
  	\`version_perlu_review\` integer,
  	\`version_video\` text,
  	\`version_fokus_keyphrase\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`docs\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_produk_id\`) REFERENCES \`produk\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new__docs_v\`("id", "parent_id", "version_slug", "version_kode", "version_produk_id", "version_urutan", "version_perlu_review", "version_video", "version_fokus_keyphrase", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "snapshot", "published_locale", "latest", "autosave") SELECT "id", "parent_id", "version_slug", "version_kode", "version_produk_id", "version_urutan", "version_perlu_review", "version_video", "version_fokus_keyphrase", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "snapshot", "published_locale", "latest", "autosave" FROM \`_docs_v\`;`)
  await db.run(sql`DROP TABLE \`_docs_v\`;`)
  await db.run(sql`ALTER TABLE \`__new__docs_v\` RENAME TO \`_docs_v\`;`)
  await db.run(sql`CREATE INDEX \`_docs_v_parent_idx\` ON \`_docs_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_version_slug_idx\` ON \`_docs_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_version_kode_idx\` ON \`_docs_v\` (\`version_kode\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_version_produk_idx\` ON \`_docs_v\` (\`version_produk_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_version_updated_at_idx\` ON \`_docs_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_version_created_at_idx\` ON \`_docs_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_version__status_idx\` ON \`_docs_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_created_at_idx\` ON \`_docs_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_updated_at_idx\` ON \`_docs_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_snapshot_idx\` ON \`_docs_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_published_locale_idx\` ON \`_docs_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_latest_idx\` ON \`_docs_v\` (\`latest\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_autosave_idx\` ON \`_docs_v\` (\`autosave\`);`)
}
