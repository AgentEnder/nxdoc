import { ExecSyncOptions, execSync } from 'child_process';
import { join, dirname, resolve } from 'path';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { ProjectConfiguration, workspaceRoot } from '@nx/devkit';

describe('nxdoc', () => {
  let projectDirectory: string;

  // The state of the remote matters for some tests so we
  // are going to reinit everything everytime. This is not the most
  // time efficient way to do this but it is the most reliable.
  beforeEach(() => {
    projectDirectory = createTestProject();

    // The plugin has been built and published to a local registry in the jest globalSetup
    // Install the plugin built with the latest source code into the test repo
    installDependencies(
      projectDirectory,
      {},
      {
        nxdoc: 'e2e',
        '@nx/plugin': 'latest',
      }
    );
  });

  it('should generate documentation for executors and generators, and check for changes', () => {
    generatePlugin(projectDirectory, 'my-plugin');

    runCommand(
      'npx nx g nxdoc:configuration --project my-plugin',
      projectDirectory,
      {}
    );

    runCommand('npx nx run my-plugin:generate-docs', projectDirectory, {});

    // Initial docs were generated
    checkFilesExist(projectDirectory, [
      join('docs', 'my-plugin', 'executors', 'my-executor.md'),
      join('docs', 'my-plugin', 'generators', 'my-generator.md'),
      join('docs', 'my-plugin', 'index.md'),
    ]);

    // add a new executor
    runCommand(
      'npx nx g @nx/plugin:executor my-executor2 --directory libs/my-plugin/src/executors/my-executor2 --no-interactive',
      projectDirectory,
      {}
    );

    expect(() =>
      runCommand(
        'npx nx run my-plugin:generate-docs --check',
        projectDirectory,
        {}
      )
    ).toThrow();
  });

  it('should generate index.md for multi-plugin workspaces', () => {
    generatePlugin(projectDirectory, 'my-plugin1');
    generatePlugin(projectDirectory, 'my-plugin2');

    runCommand(
      'npx nx g nxdoc:configuration --project my-plugin1',
      projectDirectory,
      {}
    );

    runCommand(
      'npx nx g nxdoc:configuration --project my-plugin2',
      projectDirectory,
      {}
    );

    runCommand('npx nx run my-plugin1:generate-docs', projectDirectory, {});
    runCommand('npx nx run my-plugin2:generate-docs', projectDirectory, {});

    // Using generator, could setup full target.
    runCommand('npx nx g nxdoc:generate-index', projectDirectory, {});

    checkFilesExist(projectDirectory, [
      join('docs', 'my-plugin1', 'index.md'),
      join('docs', 'my-plugin2', 'index.md'),
      join('docs', 'index.md'),
    ]);

    const contents = readFileSync(
      join(projectDirectory, 'docs', 'index.md'),
      'utf-8'
    );
    expect(contents).toContain('my-plugin1');
    expect(contents).toContain('my-plugin2');
  });
});

/**
 * Creates a test project with create-nx-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
function createTestProject() {
  const projectName = 'test-project';
  const projectDirectory = join(workspaceRoot, 'tmp', 'e2e', projectName);

  // Ensure projectDirectory is empty
  rmSync(projectDirectory, {
    recursive: true,
    force: true,
  });
  mkdirSync(dirname(projectDirectory), {
    recursive: true,
  });

  execSync(
    `npx --yes create-nx-workspace@latest ${projectName} --preset apps --nxCloud=skip --no-interactive`,
    {
      cwd: dirname(projectDirectory),
      stdio: 'inherit',
      env: process.env,
    }
  );
  console.log(`Created test project in "${projectDirectory}"`);

  runCommand(`git init`, projectDirectory, {});

  return projectDirectory;
}

function installDependencies(
  projectDirectory: string,
  dependencies: { [name: string]: string },
  devDependencies: { [name: string]: string }
) {
  if (Object.keys(dependencies).length > 0) {
    execSync(
      `npm install ${Object.entries(dependencies)
        .map(([name, version]) => `${name}@${version}`)
        .join(' ')}`,
      {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      }
    );
  }

  if (Object.keys(devDependencies).length > 0) {
    execSync(
      `npm install ${Object.entries(devDependencies)
        .map(([name, version]) => `${name}@${version}`)
        .join(' ')} --save-dev`,
      {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: process.env,
      }
    );
  }
}

function runCommand(
  command: string,
  testProjectDirectory: string,
  options: Omit<ExecSyncOptions, 'cwd'>
) {
  return execSync(command, {
    cwd: testProjectDirectory,
    stdio: 'inherit',
    env: process.env,
    ...options,
  });
}

function checkFilesExist(directory: string, files: string[]) {
  files.forEach((file) => {
    expect(existsSync(join(directory, file))).toBe(true);
  });
}

function updateFile(
  directory: string,
  file: string,
  updater: (content: string) => string
) {
  const content = readFileSync(join(directory, file), 'utf-8');
  writeFileSync(join(directory, file), updater(content));
}

function updateJsonFile<T>(
  directory: string,
  file: string,
  updater: (json: T) => T
) {
  updateFile(directory, file, (content) => {
    return JSON.stringify(updater(JSON.parse(content)), null, 2);
  });
}

function generatePlugin(projectDirectory: string, projectName: string) {
  runCommand(
    `npx nx g @nx/plugin:plugin ${projectName} --directory libs/${projectName} --projectNameAndRootFormat=as-provided --e2eTestRunner none --unitTestRunner none --linter eslint --importPath=${projectName} --no-interactive`,
    projectDirectory,
    {}
  );

  runCommand(
    `npx nx g @nx/plugin:executor my-executor --directory libs/${projectName}/src/executors/my-executor --no-interactive`,
    projectDirectory,
    {}
  );

  runCommand(
    `npx nx g @nx/plugin:generator my-generator --directory libs/${projectName}/src/generators/my-generator --no-interactive`,
    projectDirectory,
    {}
  );
}
