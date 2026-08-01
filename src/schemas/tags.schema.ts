import { z } from 'zod';

const tagTranslationSchema = z.object({
  language: z.string().max(4).min(2, { error: 'errors.tags.language' }),
  name: z.string().min(2, { error: 'errors.tags.name' }),
  slug: z.string().min(2, { error: 'errors.tags.slug' }),
}).strict();

export const createTagSchema = z.object({
  translations: z.array(tagTranslationSchema).min(1, { error: 'errors.tags.translations_required' }),
}).strict();

export type CreateTag = z.infer<typeof createTagSchema>;
