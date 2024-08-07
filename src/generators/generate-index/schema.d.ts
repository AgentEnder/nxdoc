export interface GenerateIndexGeneratorSchema {
  outputDirectory: string;
  projects?: string;
  exclude?: string;
  skipFrontMatter: boolean;
  skipFormat: boolean;
}
