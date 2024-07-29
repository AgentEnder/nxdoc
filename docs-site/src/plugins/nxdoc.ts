import { LoadContext } from '@docusaurus/types';
import { workspaceRoot } from '@nx/devkit';
import { execSync } from 'node:child_process';

export async function NxDocPlugin(context: LoadContext) {
  execSync('npx nx run-many -t generate-docs', {
    cwd: workspaceRoot,
  });

  return {
    // a unique name for this plugin
    name: 'nxdoc',
  };
}
