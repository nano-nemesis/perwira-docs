import * as migration_20261105_112259_baseline from './20261105_112259_baseline';

export const migrations = [
  {
    up: migration_20261105_112259_baseline.up,
    down: migration_20261105_112259_baseline.down,
    name: '20261105_112259_baseline'
  },
];
