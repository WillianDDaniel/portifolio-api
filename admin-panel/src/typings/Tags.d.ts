import { z } from 'zod'
import { createTagSchema } from '../../../src/schemas/tags.schema';

export type NewTag = z.infer<typeof createTagSchema>;

export type Tag = NewTag & {
  id: string;
};