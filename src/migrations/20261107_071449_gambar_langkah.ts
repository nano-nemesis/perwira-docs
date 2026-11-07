import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`docs_langkah\` ADD \`gambar_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`docs_langkah_gambar_idx\` ON \`docs_langkah\` (\`gambar_id\`);`)
  await db.run(sql`ALTER TABLE \`_docs_v_version_langkah\` ADD \`gambar_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_langkah_gambar_idx\` ON \`_docs_v_version_langkah\` (\`gambar_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_docs_langkah\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`judul\` text,
  	\`isi\` text,
  	\`perintah\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`docs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_docs_langkah\`("_order", "_parent_id", "_locale", "id", "judul", "isi", "perintah") SELECT "_order", "_parent_id", "_locale", "id", "judul", "isi", "perintah" FROM \`docs_langkah\`;`)
  await db.run(sql`DROP TABLE \`docs_langkah\`;`)
  await db.run(sql`ALTER TABLE \`__new_docs_langkah\` RENAME TO \`docs_langkah\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`docs_langkah_order_idx\` ON \`docs_langkah\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`docs_langkah_parent_id_idx\` ON \`docs_langkah\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`docs_langkah_locale_idx\` ON \`docs_langkah\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`__new__docs_v_version_langkah\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`judul\` text,
  	\`isi\` text,
  	\`perintah\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_docs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__docs_v_version_langkah\`("_order", "_parent_id", "_locale", "id", "judul", "isi", "perintah", "_uuid") SELECT "_order", "_parent_id", "_locale", "id", "judul", "isi", "perintah", "_uuid" FROM \`_docs_v_version_langkah\`;`)
  await db.run(sql`DROP TABLE \`_docs_v_version_langkah\`;`)
  await db.run(sql`ALTER TABLE \`__new__docs_v_version_langkah\` RENAME TO \`_docs_v_version_langkah\`;`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_langkah_order_idx\` ON \`_docs_v_version_langkah\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_langkah_parent_id_idx\` ON \`_docs_v_version_langkah\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_docs_v_version_langkah_locale_idx\` ON \`_docs_v_version_langkah\` (\`_locale\`);`)
}
