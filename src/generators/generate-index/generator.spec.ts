import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { generateIndexGenerator } from './generator';
import { GenerateIndexGeneratorSchema } from './schema';

describe('generate-index generator', () => {
  let tree: Tree;
  const options: GenerateIndexGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await generateIndexGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});
