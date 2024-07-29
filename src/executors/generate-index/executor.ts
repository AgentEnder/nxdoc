import { PromiseExecutor, logger } from '@nx/devkit';
import { FsTree, flushChanges, printChanges } from 'nx/src/generators/tree';

import { GenerateIndexExecutorSchema } from './schema';
import { default as generateIndex } from '../../generators/generate-index/generator';

const runExecutor: PromiseExecutor<GenerateIndexExecutorSchema> = async (
  { check, ...options },
  context
) => {
  const tree = new FsTree(context.root, context.isVerbose);

  await generateIndex(tree, options);

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
