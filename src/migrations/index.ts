import * as migration_20261105_112259_baseline from './20261105_112259_baseline';
import * as migration_20261106_111854_tambah_fokus_keyphrase from './20261106_111854_tambah_fokus_keyphrase';
import * as migration_20261106_115349_tambah_versi_induk from './20261106_115349_tambah_versi_induk';
import * as migration_20261107_071449_gambar_langkah from './20261107_071449_gambar_langkah';
import * as migration_20261107_085316_merek_produk from './20261107_085316_merek_produk';

export const migrations = [
  {
    up: migration_20261105_112259_baseline.up,
    down: migration_20261105_112259_baseline.down,
    name: '20261105_112259_baseline',
  },
  {
    up: migration_20261106_111854_tambah_fokus_keyphrase.up,
    down: migration_20261106_111854_tambah_fokus_keyphrase.down,
    name: '20261106_111854_tambah_fokus_keyphrase',
  },
  {
    up: migration_20261106_115349_tambah_versi_induk.up,
    down: migration_20261106_115349_tambah_versi_induk.down,
    name: '20261106_115349_tambah_versi_induk',
  },
  {
    up: migration_20261107_071449_gambar_langkah.up,
    down: migration_20261107_071449_gambar_langkah.down,
    name: '20261107_071449_gambar_langkah',
  },
  {
    up: migration_20261107_085316_merek_produk.up,
    down: migration_20261107_085316_merek_produk.down,
    name: '20261107_085316_merek_produk'
  },
];
