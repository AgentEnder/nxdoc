import { GenerateIndexGeneratorSchema } from 'src/generators/generate-index/schema';

export interface GenerateIndexExecutorSchema
  extends GenerateIndexGeneratorSchema {
  check: boolean;
}
