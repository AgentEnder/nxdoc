import {
  formatFiles,
  getProjects,
  joinPathFragments,
  names,
  ProjectConfiguration,
  ProjectGraphProjectNode,
  readJson,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { GenerateIndexGeneratorSchema } from './schema';
import { PackageJson } from 'nx/src/utils/package-json';
import { findMatchingProjects } from 'nx/src/utils/find-matching-projects';
import {
  getExecutorsToDocument,
  getGeneratorsToDocument,
  projectContainsGeneratorsOrExecutors,
} from '../generate-docs/generator';
import { frontMatter, h1, h2, lines, link, ul } from 'markdown-factory';

type PackageDetail = {
  projectFileName: string;
  packageName: string;
  generators: number;
  executors: number;
};

export async function generateIndexGenerator(
  tree: Tree,
  options: GenerateIndexGeneratorSchema
) {
  const packageDetails: PackageDetail[] = [];

  const fauxGraphNodes = readGraphNodesFromProjectMap(getProjects(tree));

  const exclude = new Set(
    options.exclude
      ? findMatchingProjects(options.exclude.split(','), fauxGraphNodes)
      : []
  );

  const projects = options.projects
    ? findMatchingProjects(options.projects.split(','), fauxGraphNodes)
    : Object.keys(fauxGraphNodes);

  for (const project of projects) {
    const { generators, ...config } = fauxGraphNodes[project].data;
    if (exclude.has(project)) {
      continue;
    }

    const packageDetail = collectPackageDetails(tree, config);
    if (packageDetail) {
      packageDetails.push(packageDetail);
    }
  }

  tree.write(
    joinPathFragments(options.outputDirectory, 'index.md'),
    lines(
      options.skipFrontMatter
        ? []
        : frontMatter({ sidebar_position: 0, slug: '/' }),
      h1('Our Plugins'),
      packageDetails.map((packageDetail) =>
        h2(
          link(`./${packageDetail.projectFileName}`, packageDetail.packageName),
          lines(
            ...(packageDetail.generators > 0
              ? [
                  ul(
                    `${plural(packageDetail.generators, 'Generator')} (${
                      packageDetail.generators
                    })`
                  ),
                ]
              : []),
            ...(packageDetail.executors > 0
              ? [
                  ul(
                    `${plural(packageDetail.executors, 'Executor')} (${
                      packageDetail.executors
                    })`
                  ),
                ]
              : [])
          )
        )
      )
    )
  );

  await formatFiles(tree);
}

function collectPackageDetails(
  tree: Tree,
  project: Omit<ProjectConfiguration, 'generators'>
): PackageDetail | null {
  if (!tree.exists(path.join(project.root, 'package.json'))) {
    return null;
  }
  const packageJson = readJson<PackageJson>(
    tree,
    path.join(project.root, 'package.json')
  );
  const projectFileName = names(project.name).fileName;
  const paths = projectContainsGeneratorsOrExecutors(tree, project);

  if (!paths) {
    return null;
  }

  const generators = getGeneratorsToDocument(tree, {
    ...project,
    ...paths,
    name: project.name!,
  });
  const executors = getExecutorsToDocument(tree, {
    ...project,
    ...paths,
    name: project.name!,
  });

  return {
    packageName: packageJson.name,
    projectFileName,
    generators: Object.keys(generators).length,
    executors: Object.keys(executors).length,
  };
}

function plural(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function readGraphNodesFromProjectMap(
  map: Map<string, ProjectConfiguration>
): Record<string, ProjectGraphProjectNode> {
  const projects: Record<string, ProjectGraphProjectNode> = {};
  for (const [name, project] of map) {
    projects[name] = {
      name,
      type: project.projectType === 'application' ? 'app' : 'lib',
      data: project,
    };
  }
  return projects;
}

export default generateIndexGenerator;
