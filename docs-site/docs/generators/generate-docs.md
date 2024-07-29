---
title: nxdoc:generate-docs
---

# nxdoc:generate-docs

## Generate Docs Generator

Generator for generating documentation for a single project.

## Options

### <span class="required">project</span>

- string: The project that docs should be generated for.

### <span class="required">outputDirectory</span>

- string: Where should the generated docs be placed?

Default: `"docs/{projectName}"`

### gettingStartedFile

- string: File contents to place before the API reference section for each package. &lt;src&gt; is replaced by the package's root.

Default: `"{projectRoot}/README.md"`

### root

- boolean: If true, the project is assumed to be the "root" project of the docs site, and will not be nested under a package directory.

### skipFrontMatter

- boolean: NxDoc generates frontmatter suitable for docusaurus by default.

### skipFormat

- boolean: Skips running the output through prettier
