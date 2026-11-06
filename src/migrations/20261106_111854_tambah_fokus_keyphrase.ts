import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`docs\` ADD \`fokus_keyphrase\` text;`)
  await db.run(sql`ALTER TABLE \`_docs_v\` ADD \`version_fokus_keyphrase\` text;`)
  await db.run(sql`ALTER TABLE \`posts\` ADD \`fokus_keyphrase\` text;`)
  await db.run(sql`ALTER TABLE \`_posts_v\` ADD \`version_fokus_keyphrase\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`docs\` DROP COLUMN \`fokus_keyphrase\`;`)
  await db.run(sql`ALTER TABLE \`_docs_v\` DROP COLUMN \`version_fokus_keyphrase\`;`)
  await db.run(sql`ALTER TABLE \`posts\` DROP COLUMN \`fokus_keyphrase\`;`)
  await db.run(sql`ALTER TABLE \`_posts_v\` DROP COLUMN \`version_fokus_keyphrase\`;`)
}
