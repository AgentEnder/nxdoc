import { PromiseExecutor, logger } from '@nx/devkit';
import { FsTree, flushChanges, printChanges } from 'nx/src/generators/tree';

import { GenerateDocsExecutorSchema } from './schema';
import { default as generateDocs } from '../../generators/generate-docs/generator';

const runExecutor: PromiseExecutor<GenerateDocsExecutorSchema> = async (
  { check, ...options },
  context
) => {
  const tree = new FsTree(context.root, context.isVerbose);

  await generateDocs(tree, options);

  const changes = tree.listChanges();

  if (!check) {
    flushChanges(context.root, changes);
  } else if (changes.length > 0) {
    logger.error('Found changes that would be made:');
  }

  printChanges(changes);

  return {
    success: check ? changes.length === 0 : true,
  };
};

export default runExecutor;
