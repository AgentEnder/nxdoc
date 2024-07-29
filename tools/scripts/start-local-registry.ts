/**
 * This script starts a local registry for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 */
import { startLocalRegistry } from '@nx/js/plugins/jest/local-registry';
import { execFileSync } from 'child_process';
import { releasePublish, releaseVersion } from 'nx/release';

export default async () => {
  // local registry target to run
  const localRegistryTarget = 'nxdoc:local-registry';
  // storage folder for the local registry
  const storage = './tmp/local-registry/storage';

  const verbose =
    process.env.NX_VERBOSE_LOGGING === 'true' ||
    process.argv.includes('--verbose');

  global.stopLocalRegistry = await startLocalRegistry({
    localRegistryTarget,
    storage,
    verbose,
  });

  await releaseVersion({
    specifier: '0.0.0-e2e.1',
    stageChanges: false,
    gitCommit: false,
    gitTag: false,
    firstRelease: true,
    generatorOptionsOverrides: {
      skipLockFileUpdate: true,
    },
    verbose,
  });
  await releasePublish({
    tag: 'e2e',
    firstRelease: true,
  });
};
