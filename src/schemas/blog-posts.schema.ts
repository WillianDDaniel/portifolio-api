import { z } from 'zod';

export const blogPostSchema = z.object({
  coverImageUrl: z.url({ error: 'errors.blog_posts.image_url' })
    .startsWith('http', { error: 'errors.blog_posts.image_url' })
    .optional()
    .or(z.literal('')),

  ogImageUrl: z.url({ error: 'errors.blog_posts.image_url' })
    .startsWith('http', { error: 'errors.blog_posts.image_url' })
    .optional()
    .or(z.literal('')),

  status: z.enum(['draft', 'scheduled', 'published', 'archived'] as const, {
    message: 'errors.blog_posts.invalid_status'
  }).default('draft').optional(),

  publishedAt: z.string().datetime({ message: 'errors.blog_posts.invalid_date' }).optional().nullable(),

  isFeatured: z.boolean().default(false).optional(),

  categoryIds: z.array(z.uuid({ error: 'errors.blog_posts.invalid_category_id' })).optional(),
  tagIds: z.array(z.uuid({ error: 'errors.blog_posts.invalid_tag_id' })).optional(),

  translations: z.array(z.object({
    language: z.string().min(2, { error: 'errors.blog_posts.language' }),
    slug: z.string().min(3, { error: 'errors.blog_posts.slug' }),
    title: z.string().min(3, { error: 'errors.blog_posts.title' }),
    excerpt: z.string().min(10, { error: 'errors.blog_posts.excerpt' }),
    content: z.string().min(10, { error: 'errors.blog_posts.content' }),

    metaTitle: z.string().optional().nullable(),
    metaDescription: z.string().optional().nullable(),
  }).strict()).min(1, { error: 'errors.blog_posts.translations_required' }),
}).strict();

export type BlogPost = z.infer<typeof blogPostSchema>;

export const generateBlogPostSchema = z.object({
  prompt: z.string().optional(),
  providerId: z.uuid({ message: 'errors.blog_posts.invalid_provider_id' }),

  postPartialData: z.object({
    language: z.enum(['pt', 'en', 'es'] as const, {
      message: 'errors.blog_posts.language_invalid'
    }).default('en'),

    title: z.string().min(3, { message: 'errors.blog_posts.title_required' }),
    slug: z.string().optional(),
    excerpt: z.string().optional(),
  })
}).strict();

export type GenerateBlogPost = z.infer<typeof generateBlogPostSchema>;

export const stylizeBlogPostSchema = z.object({
  htmlContent: z.string().min(1, { message: 'errors.blog_posts.html_required' }),

  language: z.enum(['pt', 'en', 'es'] as const, {
    message: 'errors.blog_posts.language_invalid'
  }).default('en'),

  providerId: z.uuid({ message: 'errors.blog_posts.invalid_provider_id' }),
}).strict();

export type StylizeBlogPost = z.infer<typeof stylizeBlogPostSchema>;