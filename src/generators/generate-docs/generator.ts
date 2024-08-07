import {
  ExecutorsJson,
  formatFiles,
  generateFiles,
  GeneratorsJson,
  getProjects,
  joinPathFragments,
  names,
  ProjectConfiguration,
  readJson,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';

import { readFileSync } from 'fs';
import * as path from 'node:path';

import { GenerateDocsGeneratorSchema } from './schema';
import { SchemaJSON } from './schema-json.interface';
import { PackageJson } from 'nx/src/utils/package-json';
import { interpolate } from 'nx/src/tasks-runner/utils';
import { frontMatter, h1, h2, h3, lines, link, ul } from 'markdown-factory';
import {
  ExecutorsJsonEntry,
  GeneratorsJsonEntry,
} from 'nx/src/config/misc-interfaces';

type PackageDetail = {
  packageName: string;
  projectFileName: string;
  project: Omit<ProjectConfiguration, 'generators'>;
  generators: number;
  executors: number;
};

export default async function (
  host: Tree,
  options: GenerateDocsGeneratorSchema
) {
  const { generators, ...rawProject } = readProjectConfiguration(
    host,
    options.project
  );
  const hasGeneratorsOrExecutors = projectContainsGeneratorsOrExecutors(
    host,
    rawProject
  );
  if (!hasGeneratorsOrExecutors) {
    throw new Error(
      `Project ${options.project} does not contain any generators or executors`
    );
  }

  generateDocsForProject(
    options,
    {
      ...rawProject,
      ...hasGeneratorsOrExecutors,
      name: options.project,
    },
    host
  );

  if (!options.skipFormat) {
    await formatFiles(host);
  }
}

export function getExecutorsToDocument(
  host: Tree,
  project: Pick<ProjectConfiguration, 'name' | 'root'> & { executors?: string }
): { [name: string]: ExecutorsJsonEntry & { description?: string } } {
  const executorsCollection: ExecutorsJson = project.executors
    ? readJson<ExecutorsJson>(host, project.executors)
    : ({} as ExecutorsJson);

  return Object.fromEntries(
    Object.entries({
      ...executorsCollection.builders,
      ...executorsCollection.executors,
    }).filter(
      ([, config]) =>
        !(config as Required<GeneratorsJson>['generators'][string]).hidden
    )
  );
}

export function getGeneratorsToDocument(
  host: Tree,
  project: Pick<ProjectConfiguration, 'name' | 'root'> & { generators?: string }
) {
  const generatorsCollection: GeneratorsJson = project.generators
    ? readJson<GeneratorsJson>(host, project.generators)
    : ({} as GeneratorsJson);
  return Object.fromEntries(
    Object.entries({
      ...generatorsCollection.schematics,
      ...generatorsCollection.generators,
    }).filter(([, config]) => !config.hidden)
  );
}

function generateDocsForProject(
  options: GenerateDocsGeneratorSchema,
  project: { name: string; generators?: string; executors?: string } & Omit<
    ProjectConfiguration,
    'generators'
  >,
  host: Tree
): PackageDetail {
  let gettingStartedFile: string | null = interpolate(
    options.gettingStartedFile.replace('<src>', project.root),
    {
      projectName: project.name,
      projectRoot: project.root,
      workspaceRoot: '',
    }
  );
  if (process.env.NX_VERBOSE_LOGGING === 'true') {
    console.log('Loading getting started file:', gettingStartedFile);
  }
  gettingStartedFile = host.exists(gettingStartedFile)
    ? gettingStartedFile
    : null;
  if (!gettingStartedFile && process.env.NX_VERBOSE_LOGGING === 'true') {
    console.log('Getting started file not found');
  }

  const executors = getExecutorsToDocument(host, project);
  const generators = getGeneratorsToDocument(host, project);

  const packageName = readJson<PackageJson>(
    host,
    `${project.root}/package.json`
  ).name;
  const projectFileName = names(project.name).fileName;

  const outputDirectory = interpolate(options.outputDirectory, {
    projectName: projectFileName,
    projectRoot: project.root,
    workspaceRoot: '',
  });

  const indexMdLines = [];

  if (!options.skipFrontMatter) {
    indexMdLines.push(
      frontMatter({
        title: packageName,
        summary: packageName,
        sidebar_label: 'Getting Started',
        sidebar_position: 0,
        slug: options.root ? '/' : projectFileName,
      })
    );
    host.write(
      joinPathFragments(outputDirectory, '_category_.yml'),
      `label: '${packageName}'\n`
    );
  }

  if (gettingStartedFile) {
    indexMdLines.push(host.read(gettingStartedFile, 'utf-8'));
  }

  const generatorsEntries = Object.entries(generators);

  if (generatorsEntries.length > 0) {
    indexMdLines.push(
      h2('Generators'),
      ...generatorsEntries.map(([name, generator]) =>
        h3(link(`./generators/${name}`, name), generator.description)
      )
    );

    if (!options.skipFrontMatter) {
      host.write(
        joinPathFragments(outputDirectory, 'generators', '_category_.yml'),
        `label: Generators\n`
      );
    }
  }

  const executorsEntries = Object.entries(executors);

  if (executorsEntries.length > 0) {
    indexMdLines.push(
      h2('Executors'),
      ...executorsEntries.map(([name, executor]) =>
        h3(
          link(`./executors/${name}`, name),
          // For some reason, the executors json entry doesn't specify a description field.
          (executor as GeneratorsJsonEntry).description
        )
      )
    );

    if (!options.skipFrontMatter) {
      host.write(
        joinPathFragments(outputDirectory, 'executors', '_category_.yml'),
        `label: Executors\n`
      );
    }
  }

  host.write(
    joinPathFragments(outputDirectory, 'index.md'),
    lines(indexMdLines)
  );

  for (const [generatorName, config] of Object.entries(generators)) {
    const generatorFileName = names(generatorName).fileName;
    const schema = readJson<SchemaJSON>(
      host,
      path.relative(process.cwd(), path.resolve(project.root, config.schema))
    );
    host.write(
      joinPathFragments(
        outputDirectory,
        'generators',
        `${generatorFileName}.md`
      ),
      getSchemaMarkdown(options, generatorName, packageName, schema, config)
    );
  }

  Object.entries(executors).forEach(([generatorName, config]) => {
    const generatorFileName = names(generatorName).fileName;
    const schema =
      typeof config === 'string'
        ? {}
        : readJson<SchemaJSON>(
            host,
            path.relative(
              process.cwd(),
              path.resolve(project.root, config.schema)
            )
          );
    host.write(
      joinPathFragments(
        outputDirectory,
        'executors',
        `${generatorFileName}.md`
      ),
      getSchemaMarkdown(options, generatorName, packageName, schema, config)
    );
  });

  return {
    packageName,
    projectFileName,
    project,
    generators: Object.keys(generators).length,
    executors: Object.keys(executors).length,
  };
}

function getSchemaMarkdown(
  options: GenerateDocsGeneratorSchema,
  generatorName: string,
  packageName: string,
  schema: Partial<SchemaJSON>,
  entry: GeneratorsJsonEntry | (ExecutorsJsonEntry & { description?: string })
) {
  const detailMdLines = [
    ...(options.skipFrontMatter
      ? []
      : [frontMatter({ title: `${packageName}:${generatorName}` })]),
    h1(
      `${packageName}:${generatorName}`,
      ...(schema.title ? [h2(schema.title)] : []),
      escapeHtml(schema.description ?? entry.description ?? '')
    ),
  ];

  const propertiesEntries = Object.entries(schema.properties ?? {}).filter(
    ([_, property]) => !property.hidden
  );
  if (propertiesEntries.length > 0) {
    detailMdLines.push(h2('Options'));
    detailMdLines.push(
      ...propertiesEntries.map(([name, property]) =>
        h3(
          schema.required?.includes?.(name)
            ? `<span class="required">${name}</span>`
            : name,
          property.oneOf
            ? ul(
                property.oneOf.map((p) =>
                  p.description
                    ? `(${p.type}): ${escapeHtml(p.description)}`
                    : `(${p.type})`
                )
              )
            : ul(
                property.description
                  ? `(${property.type}): ${escapeHtml(property.description)}`
                  : `(${property.type})`
              ),
          ...(property.default
            ? [`Default: \`${escapeHtml(JSON.stringify(property.default))}\``]
            : [])
        )
      )
    );
  }
  return lines(detailMdLines);
}

export async function findProjectsWithGeneratorsOrExecutors(host: Tree) {
  const projects: ({
    name: string;
    generators?: string;
    executors?: string;
  } & Omit<ProjectConfiguration, 'generators'>)[] = [];

  for (const [name, { generators: _, ...configuration }] of getProjects(host)) {
    const res = projectContainsGeneratorsOrExecutors(host, configuration);
    if (res) {
      projects.push({
        ...configuration,
        name,
        ...res,
      });
    }
  }

  return projects;
}

export function projectContainsGeneratorsOrExecutors(
  host: Tree,
  project: ProjectConfiguration
): false | { generators?: string; executors?: string } {
  const packageJson = readJson<PackageJson>(
    host,
    `${project.root}/package.json`
  );

  const executorsRelativePath = packageJson.executors ?? packageJson.builders;
  const executors = executorsRelativePath
    ? joinPathFragments(project.root, executorsRelativePath)
    : undefined;

  const generatorsRelativePath =
    packageJson.generators ?? packageJson.schematics;

  const generators = generatorsRelativePath
    ? joinPathFragments(project.root, generatorsRelativePath)
    : undefined;

  if (!executors && !generators) {
    return false;
  }

  return {
    executors,
    generators,
  };
}

function escapeHtml(unsafe: string) {
  return unsafe.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
