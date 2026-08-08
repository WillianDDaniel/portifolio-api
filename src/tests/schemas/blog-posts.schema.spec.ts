import { describe, it, expect } from 'vitest';
import { blogPostSchema } from '../../schemas/blog-posts.schema.js';

describe('Blog Posts Zod Schema', () => {
  const validPayload = {
    coverImageUrl: 'https://example.com/image.jpg',
    status: 'published' as const,
    isFeatured: true,
    translations: [
      {
        language: 'en',
        slug: 'my-post',
        title: 'My Post Title',
        excerpt: 'This is a valid excerpt that is long enough.',
        content: 'This is a valid content that is long enough.',
      },
    ],
  };

  it('should validate a correct payload successfully', () => {
    const result = blogPostSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validPayload);
    }
  });

  it('should fallback status to draft and isFeatured to false if omitted', () => {
    const { status, isFeatured, ...payloadWithoutDefaults } = validPayload;
    const result = blogPostSchema.safeParse(payloadWithoutDefaults);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('draft');
      expect(result.data.isFeatured).toBe(false);
    }
  });

  it('should allow empty coverImageUrl', () => {
    const payload = {
      ...validPayload,
      coverImageUrl: '',
    };
    const result = blogPostSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should allow omitted coverImageUrl', () => {
    const { coverImageUrl, ...payloadWithoutUrl } = validPayload;
    const result = blogPostSchema.safeParse(payloadWithoutUrl);
    expect(result.success).toBe(true);
  });

  it('should fail if coverImageUrl is not a valid url or doesn\'t start with http', () => {
    const payload = {
      ...validPayload,
      coverImageUrl: 'not-a-url',
    };
    const result = blogPostSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('errors.blog_posts.image_url');
    }
  });

  it('should fail and block request if unrecognized keys are sent at root level', () => {
    const payload = {
      ...validPayload,
      extra: 'field',
    };
    const result = blogPostSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue.code).toBe('unrecognized_keys');
    }
  });

  it('should fail if translations list is empty', () => {
    const payload = {
      ...validPayload,
      translations: [],
    };
    const result = blogPostSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('errors.blog_posts.translations_required');
    }
  });

  it('should fail if translation fields do not meet validation constraints', () => {
    const payload = {
      ...validPayload,
      translations: [
        {
          language: 'e',
          slug: 'sl',
          title: 'ti',
          excerpt: 'short',
          content: 'short',
        },
      ],
    };
    const result = blogPostSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map(i => i.message);
      expect(messages).toContain('errors.blog_posts.language');
      expect(messages).toContain('errors.blog_posts.slug');
      expect(messages).toContain('errors.blog_posts.title');
      expect(messages).toContain('errors.blog_posts.excerpt');
      expect(messages).toContain('errors.blog_posts.content');
    }
  });

  it('should fail and block request if unrecognized keys are sent inside translations', () => {
    const payload = {
      ...validPayload,
      translations: [
        {
          ...validPayload.translations[0],
          extraInTranslation: 'not-allowed',
        },
      ],
    };
    const result = blogPostSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue.code).toBe('unrecognized_keys');
    }
  });
});
