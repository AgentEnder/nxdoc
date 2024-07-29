export interface GenerateDocsGeneratorSchema {
  project: string;
  outputDirectory: string;
  skipFrontMatter: boolean;
  skipFormat: boolean;
  gettingStartedFile: string;
  root: boolean;
}
