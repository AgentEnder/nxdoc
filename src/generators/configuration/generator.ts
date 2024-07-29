import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import * as path from 'path';
import { ConfigurationGeneratorSchema } from './schema';

export async function configurationGenerator(
  tree: Tree,
  options: ConfigurationGeneratorSchema
) {
  const project = readProjectConfiguration(tree, options.project);
  project.targets[options.targetName] = {
    executor: 'nxdoc:generate-docs',
  };
  updateProjectConfiguration(tree, options.project, project);
}

export default configurationGenerator;
