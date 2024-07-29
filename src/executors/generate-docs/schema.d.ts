import { GenerateDocsGeneratorSchema } from '../../generators/generate-docs/schema';

export interface GenerateDocsExecutorSchema
  extends GenerateDocsGeneratorSchema {
  check: boolean;
}
