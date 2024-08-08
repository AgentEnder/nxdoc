import { workspaceRoot } from '@nx/devkit';
import { frontMatter, lines } from 'markdown-factory';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export async function CopyReadmeAndChangelogPlugin() {
  const changelog = readFileSync(
    join(workspaceRoot, './CHANGELOG.md'),
    'utf-8'
  );

  writeFileSync(
    join(__dirname, '../../docs/changelog.md'),
    addFrontMatter(changelog, {
      id: 'changelog',
      title: 'Changelog',
      hide_title: true,
      sidebar_position: 2,
      slug: '/changelog',
    })
  );

  return {
    // a unique name for this plugin
    name: 'copy-readme-and-changelog-plugin',
  };
}

function addFrontMatter(
  contents: string,
  frontMatterContents: Record<string, string | boolean | number>
) {
  return lines(frontMatter(frontMatterContents), contents);
}
