import * as migration_20261105_112259_baseline from './20261105_112259_baseline';
import * as migration_20261106_111854_tambah_fokus_keyphrase from './20261106_111854_tambah_fokus_keyphrase';

export const migrations = [
  {
    up: migration_20261105_112259_baseline.up,
    down: migration_20261105_112259_baseline.down,
    name: '20261105_112259_baseline',
  },
  {
    up: migration_20261106_111854_tambah_fokus_keyphrase.up,
    down: migration_20261106_111854_tambah_fokus_keyphrase.down,
    name: '20261106_111854_tambah_fokus_keyphrase'
  },
];
