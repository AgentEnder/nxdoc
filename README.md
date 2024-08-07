> This package is unstable! Documentation formatting could change in the future. See something that you think should be different? [Open an issue](https://github.com/agentender/nxdoc/issues) on github and help shape this plugin.

> [!NOTE]  
> This plugin was formerly published as @nx-dotnet/nxdoc. It was moved due to not being relevant to .NET and to decouple the releases. To view previous versions and changelogs checkout the [nx-dotnet repo](https://github.com/nx-dotnet/nx-dotnet)

## Prerequisites

- Have an existing nx workspace containing an Nx plugin project. For creating this, see [nrwl's documentation](https://nx.dev/latest/angular/getting-started/nx-setup).

## Installation

### NPM

```shell
npm i --save-dev nxdoc
```

### PNPM

```shell
pnpm i --save-dev nxdoc
```

### Yarn

```shell
yarn add --dev nxdoc
```

## Usage

To get started, run the following command to configure docs generation for your plugin project:

```shell
nx generate nxdoc:configuration --project=my-plugin
```

This will add a target to your plugin's `project.json` file that will generate documentation for your plugin. You can then run the following command to generate the documentation:

```shell
nx run my-plugin:generate-docs
```

By default, this will output the documentation to `docs/my-plugin`. You can customize this by passing the `outputDirectory` option to the `generate-docs` target. For example, if we only have one plugin in our workspace, we can output the documentation to the root of the workspace:

```json
{
  "targets": {
    "generate-docs": {
      "executor": "nxdoc:generate-docs",
      "options": {
        "project": "my-plugin",
        "outputDirectory": "docs",
        "root": true
      }
    }
  }
}
```

### Multiple Project Documentation

What if we have multiple plugins in our workspace? We can generate documentation for each plugin by creating a target for each plugin. For example, if we have two plugins, `my-plugin` and `my-other-plugin`, we can run the configuration generator for each. Then we can run the `generate-docs` target for each plugin:

```shell

nx generate nxdoc:configuration --project=my-plugin
nx generate nxdoc:configuration --project=my-other-plugin
nx run-many -t generate-docs
```

By default, this will output the documentation to `docs/my-plugin` and `docs/my-other-plugin`. There will not be anything that ties the documentation together though. As such, we provide another executor / generator pair to generate a landing page for the documentation. You can either run this generator manually as below:

```shell
nx generate nxdoc:generate-index
```

or you can add it to a project's `project.json` file as a target:

```json
{
  "targets": {
    "generate-index": {
      "executor": "nxdoc:generate-index"
    }
  }
}
```
