import { z } from 'zod'
import { createCategorySchema } from '../../../src/schemas/categories.schema';

export type NewCategory = z.infer<typeof createCategorySchema>;

export type Category = NewCategory & {
  id: string;
};