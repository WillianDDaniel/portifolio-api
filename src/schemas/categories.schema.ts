import { z } from 'zod';

const categoryTranslationSchema = z.object({
  language: z.string().max(4).min(2, { error: 'errors.categories.language' }),
  name: z.string().min(2, { error: 'errors.categories.name' }),
  slug: z.string().min(2, { error: 'errors.categories.slug' }),
}).strict();

export const createCategorySchema = z.object({
  translations: z.array(categoryTranslationSchema).min(1, { error: 'errors.categories.translations_required' }),
}).strict();

export type CreateCategory = z.infer<typeof createCategorySchema>;
