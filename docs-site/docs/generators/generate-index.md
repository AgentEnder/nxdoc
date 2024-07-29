---
title: nxdoc:generate-index
---

# nxdoc:generate-index

## Generate Index Generator

Generator for generating an index that ties multiple projects together.

## Options

### <span class="required">outputDirectory</span>

- string: Where should the generated docs be placed?

Default: `"docs"`

### exclude

- string: Comma separated list of packages to exclude from the generated docs.

### skipFrontMatter

- boolean: NxDoc generates frontmatter suitable for docusaurus by default.

### skipFormat

- boolean: Skips running the output through prettier
