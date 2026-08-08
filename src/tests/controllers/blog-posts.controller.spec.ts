import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import {
  getBlogPosts,
  getBlogPostBySlug,
  getAdminBlogPosts,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  generateBlogPost,
  checkSlug,
  stylizeBlogPost
} from '../../controllers/blog-posts.controller.js';

import {
  findAllBlogPosts,
  findBlogPostById,
  findBlogPostBySlugAndLang,
  createBlogPostRecord,
  updateBlogPostRecord,
  deleteBlogPostRecord,
  checkSlugExists
} from '../../repositories/blog-posts.repository.js';

import { findAiProviderById } from '../../repositories/ai-providers.repository.js';

vi.mock('../../repositories/blog-posts.repository.js', () => ({
  findAllBlogPosts: vi.fn(),
  findBlogPostById: vi.fn(),
  findBlogPostBySlugAndLang: vi.fn(),
  createBlogPostRecord: vi.fn(),
  updateBlogPostRecord: vi.fn(),
  deleteBlogPostRecord: vi.fn(),
  checkSlugExists: vi.fn(),
}));

vi.mock('../../prompts/blog.prompts.js', () => ({
  BlogPrompts: {
    buildHtmlSystemPrompt: vi.fn().mockReturnValue('mock system prompt'),
    getUserPrompt: vi.fn().mockReturnValue('mock user prompt'),
    buildStylingSystemPrompt: vi.fn().mockReturnValue('mock styling system prompt'),
    getStylingUserPrompt: vi.fn().mockReturnValue('mock styling user prompt'),
  }
}));

vi.mock('../../constants/index.js', () => ({
  DEFAULT_MODELS: {
    openai: 'gpt-3.5-turbo',
    anthropic: 'claude-3-haiku-20240307'
  }
}));

vi.mock('../../repositories/ai-providers.repository.js', () => ({
  findAiProviderById: vi.fn(),
}));

vi.mock('../../services/ai.service.js', () => {
  return {
    AiService: class {
      streamHtmlContent = vi.fn().mockResolvedValue({ stream: {} });
    }
  };
});

vi.mock('ai', () => ({
  toTextStream: vi.fn().mockReturnValue('mock-stream'),
}));

describe('Blog Posts Controller', () => {
  let mockContext: any;
  let mockParams: Record<string, string>;

  beforeAll(() => {
    if (typeof global.Response === 'undefined') {
      global.Response = class Response {
        body: any;
        init: any;
        headers: any;
        constructor(body: any, init: any) {
          this.body = body;
          this.init = init;
          this.headers = new Map(Object.entries(init?.headers || {}));
        }
      } as any;
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = {};
    mockContext = {
      req: {
        json: vi.fn(),
        param: vi.fn((name?: string) => {
          if (name) return mockParams[name];
          return mockParams;
        }),
        query: vi.fn(),
      },
      json: vi.fn((data, status = 200) => ({ data, status })),
      get: vi.fn().mockReturnValue({ id: 'author-123' }),
    };
  });

  describe('getBlogPosts', () => {
    it('should return 200 with list of published posts', async () => {
      const mockPosts = [{ id: '1', title: 'Post 1' }];
      vi.mocked(findAllBlogPosts).mockResolvedValue(mockPosts as any);

      const response = await getBlogPosts(mockContext);

      expect(findAllBlogPosts).toHaveBeenCalledWith(true);
      expect(mockContext.json).toHaveBeenCalledWith(mockPosts, 200);
      expect(response.status).toBe(200);
    });

    it('should return 500 when repository throws error', async () => {
      const errorMsg = 'DB Error';
      vi.mocked(findAllBlogPosts).mockRejectedValue(new Error(errorMsg));

      const response = await getBlogPosts(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.list', message: errorMsg },
        500
      );
      expect(response.status).toBe(500);
    });
  });

  describe('getBlogPostBySlug', () => {
    it('should return 200 with the blog post when found', async () => {
      mockParams = { lang: 'en', slug: 'test-slug' };
      const mockPost = { id: '1', slug: 'test-slug' };
      vi.mocked(findBlogPostBySlugAndLang).mockResolvedValue(mockPost as any);

      const response = await getBlogPostBySlug(mockContext);

      expect(findBlogPostBySlugAndLang).toHaveBeenCalledWith('en', 'test-slug');
      expect(mockContext.json).toHaveBeenCalledWith(mockPost, 200);
      expect(response.status).toBe(200);
    });

    it('should return 404 when blog post is not found', async () => {
      mockParams = { lang: 'en', slug: 'non-existent' };
      vi.mocked(findBlogPostBySlugAndLang).mockResolvedValue(null as any);

      const response = await getBlogPostBySlug(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.not_found', message: 'Blog post not found' },
        404
      );
      expect(response.status).toBe(404);
    });

    it('should return 500 when repository throws error', async () => {
      mockParams = { lang: 'en', slug: 'error-slug' };
      const errorMsg = 'DB Error';
      vi.mocked(findBlogPostBySlugAndLang).mockRejectedValue(new Error(errorMsg));

      const response = await getBlogPostBySlug(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.get_by_slug', message: errorMsg },
        500
      );
      expect(response.status).toBe(500);
    });
  });

  describe('getAdminBlogPosts', () => {
    it('should return 200 with list of all posts (admin)', async () => {
      const mockPosts = [{ id: '1', title: 'Post 1' }];
      vi.mocked(findAllBlogPosts).mockResolvedValue(mockPosts as any);

      const response = await getAdminBlogPosts(mockContext);

      expect(findAllBlogPosts).toHaveBeenCalledWith(false);
      expect(mockContext.json).toHaveBeenCalledWith(mockPosts, 200);
      expect(response.status).toBe(200);
    });

    it('should return 500 when repository throws error', async () => {
      const errorMsg = 'DB Error';
      vi.mocked(findAllBlogPosts).mockRejectedValue(new Error(errorMsg));

      const response = await getAdminBlogPosts(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.list', message: errorMsg },
        500
      );
      expect(response.status).toBe(500);
    });
  });

  describe('getBlogPostById', () => {
    it('should return 200 with the blog post when found', async () => {
      mockParams = { id: 'post-123' };
      const mockPost = { id: 'post-123', title: 'Test Post' };
      vi.mocked(findBlogPostById).mockResolvedValue(mockPost as any);

      const response = await getBlogPostById(mockContext);

      expect(findBlogPostById).toHaveBeenCalledWith('post-123');
      expect(mockContext.json).toHaveBeenCalledWith(mockPost, 200);
      expect(response.status).toBe(200);
    });

    it('should return 404 when blog post is not found', async () => {
      mockParams = { id: 'non-existent' };
      vi.mocked(findBlogPostById).mockResolvedValue(null as any);

      const response = await getBlogPostById(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.not_found', message: 'Blog post not found' },
        404
      );
      expect(response.status).toBe(404);
    });

    it('should return 500 when repository throws error', async () => {
      mockParams = { id: 'error-id' };
      const errorMsg = 'DB Error';
      vi.mocked(findBlogPostById).mockRejectedValue(new Error(errorMsg));

      const response = await getBlogPostById(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.get_by_id', message: errorMsg },
        500
      );
      expect(response.status).toBe(500);
    });
  });

  describe('createBlogPost', () => {
    const validPayload = {
      coverImageUrl: 'https://example.com/image.png',
      status: 'published',
      translations: [
        {
          language: 'en',
          slug: 'my-post',
          title: 'My Post',
          excerpt: 'This is a short excerpt.',
          content: 'This is a long content for the post.',
        },
      ],
    };

    it('should return 201 with the created blog post on success', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      const mockNewPost = { id: 'new-id', ...validPayload };
      vi.mocked(createBlogPostRecord).mockResolvedValue(mockNewPost as any);

      const response = await createBlogPost(mockContext);

      expect(createBlogPostRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          coverImageUrl: validPayload.coverImageUrl,
          status: 'published',
          authorId: 'author-123',
          publishedAt: expect.any(Date),
        }),
        validPayload.translations,
        undefined,
        undefined
      );
      expect(mockContext.json).toHaveBeenCalledWith(mockNewPost, 201);
      expect(response.status).toBe(201);
    });

    it('should set publishedAt to null if status is not published', async () => {
      const unpublishedPayload = { ...validPayload, status: 'draft' };
      mockContext.req.json.mockResolvedValue(unpublishedPayload);
      const mockNewPost = { id: 'new-id', ...unpublishedPayload };
      vi.mocked(createBlogPostRecord).mockResolvedValue(mockNewPost as any);

      await createBlogPost(mockContext);

      expect(createBlogPostRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          coverImageUrl: validPayload.coverImageUrl,
          status: 'draft',
          authorId: 'author-123',
          publishedAt: null,
        }),
        validPayload.translations,
        undefined,
        undefined
      );
    });

    it('should return 422 if creation returns null', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(createBlogPostRecord).mockResolvedValue(null);

      const response = await createBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.create', message: 'Blog post not created' },
        422
      );
      expect(response.status).toBe(422);
    });

    it('should return 500 when repository throws error', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      const errorMsg = 'Create Failed';
      vi.mocked(createBlogPostRecord).mockRejectedValue(new Error(errorMsg));

      const response = await createBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.create', message: 'Create Failed' },
        500
      );
      expect(response.status).toBe(500);
    });
  });

  describe('updateBlogPost', () => {
    const validPayload = {
      coverImageUrl: 'https://example.com/image.png',
      status: 'published',
      translations: [
        {
          language: 'en',
          slug: 'my-post',
          title: 'My Post',
          excerpt: 'This is a short excerpt.',
          content: 'This is a long content for the post.',
        },
      ],
    };

    it('should return 200 with updated blog post on success', async () => {
      mockParams = { id: 'post-123' };
      mockContext.req.json.mockResolvedValue(validPayload);

      const existingPost = { id: 'post-123', publishedAt: null };
      vi.mocked(findBlogPostById).mockResolvedValue(existingPost as any);

      const mockUpdatedPost = { id: 'post-123', ...validPayload };
      vi.mocked(updateBlogPostRecord).mockResolvedValue(mockUpdatedPost as any);

      const response = await updateBlogPost(mockContext);

      expect(findBlogPostById).toHaveBeenCalledWith('post-123');
      expect(updateBlogPostRecord).toHaveBeenCalledWith(
        'post-123',
        expect.objectContaining({
          coverImageUrl: validPayload.coverImageUrl,
          status: 'published',
          publishedAt: expect.any(Date),
        }),
        validPayload.translations,
        undefined,
        undefined
      );
      expect(mockContext.json).toHaveBeenCalledWith(mockUpdatedPost, 200);
      expect(response.status).toBe(200);
    });

    it('should not update publishedAt if status is published but it was already published', async () => {
      mockParams = { id: 'post-123' };
      mockContext.req.json.mockResolvedValue(validPayload);

      const alreadyPublishedDate = new Date('2026-01-01');
      const existingPost = { id: 'post-123', publishedAt: alreadyPublishedDate };
      vi.mocked(findBlogPostById).mockResolvedValue(existingPost as any);

      const mockUpdatedPost = { id: 'post-123', ...validPayload, publishedAt: alreadyPublishedDate };
      vi.mocked(updateBlogPostRecord).mockResolvedValue(mockUpdatedPost as any);

      await updateBlogPost(mockContext);

      const secondArg = vi.mocked(updateBlogPostRecord).mock.calls[0][1];
      expect(secondArg.publishedAt).toBeUndefined();
    });

    it('should return 404 if post to update is not found', async () => {
      mockParams = { id: 'non-existent' };
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findBlogPostById).mockResolvedValue(null as any);

      const response = await updateBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.not_found', message: 'Blog post not found' },
        404
      );
      expect(response.status).toBe(404);
    });

    it('should return 422 if update returns null', async () => {
      mockParams = { id: 'post-123' };
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findBlogPostById).mockResolvedValue({ id: 'post-123' } as any);
      vi.mocked(updateBlogPostRecord).mockResolvedValue(null);

      const response = await updateBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.update', message: 'Blog post not updated' },
        422
      );
      expect(response.status).toBe(422);
    });

    it('should return 500 when repository throws error during update', async () => {
      mockParams = { id: 'post-123' };
      mockContext.req.json.mockResolvedValue(validPayload);

      const errorMsg = 'Database update error';
      vi.mocked(findBlogPostById).mockRejectedValue(new Error(errorMsg));

      const response = await updateBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.update', message: errorMsg },
        500
      );
      expect(response.status).toBe(500);
    });
  });

  describe('deleteBlogPost', () => {
    it('should return 200 with deleted post on success', async () => {
      mockParams = { id: 'post-123' };
      const mockDeletedPost = { id: 'post-123', title: 'Deleted Post' };
      vi.mocked(deleteBlogPostRecord).mockResolvedValue(mockDeletedPost as any);

      const response = await deleteBlogPost(mockContext);

      expect(deleteBlogPostRecord).toHaveBeenCalledWith('post-123');
      expect(mockContext.json).toHaveBeenCalledWith(mockDeletedPost, 200);
      expect(response.status).toBe(200);
    });

    it('should return 422 if delete returns null', async () => {
      mockParams = { id: 'post-123' };
      vi.mocked(deleteBlogPostRecord).mockResolvedValue(null);

      const response = await deleteBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.delete', message: 'Blog post not deleted' },
        422
      );
      expect(response.status).toBe(422);
    });

    it('should return 500 when repository throws error during delete', async () => {
      mockParams = { id: 'post-123' };
      const errorMsg = 'Delete error';
      vi.mocked(deleteBlogPostRecord).mockRejectedValue(new Error(errorMsg));

      const response = await deleteBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.delete', message: errorMsg },
        500
      );
      expect(response.status).toBe(500);
    });
  });

  describe('checkSlug', () => {
    it('should return 200 with exists status', async () => {
      mockParams = { lang: 'en', slug: 'test-slug' };
      mockContext.req.query = vi.fn().mockReturnValue('123');
      vi.mocked(checkSlugExists).mockResolvedValue(true);

      const response = await checkSlug(mockContext);

      expect(checkSlugExists).toHaveBeenCalledWith('en', 'test-slug', '123');
      expect(mockContext.json).toHaveBeenCalledWith({ exists: true }, 200);
      expect(response.status).toBe(200);
    });

    it('should return 500 when repository throws error', async () => {
      mockParams = { lang: 'en', slug: 'test-slug' };
      mockContext.req.query = vi.fn().mockReturnValue(undefined);
      vi.mocked(checkSlugExists).mockRejectedValue(new Error('DB Error'));

      const response = await checkSlug(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.check_slug', message: 'DB Error' },
        500
      );
      expect(response.status).toBe(500);
    });
  });

  describe('generateBlogPost', () => {
    const validPayload = {
      prompt: 'Test prompt',
      providerId: '123e4567-e89b-12d3-a456-426614174000',
      postPartialData: { language: 'en', title: 'Test' }
    };

    it('should return 404 if AI provider is not found', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findAiProviderById).mockResolvedValue(null);

      const response = await generateBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.provider_not_found', message: expect.any(String) },
        404
      );
    });

    it('should return 400 if AI provider is inactive', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findAiProviderById).mockResolvedValue({ isActive: false } as any);

      const response = await generateBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.provider_inactive', message: expect.any(String) },
        400
      );
    });

    it('should return 400 if model is invalid', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findAiProviderById).mockResolvedValue({ isActive: true, provider: 'invalid-provider' } as any);

      const response = await generateBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.invalid_model', message: expect.any(String) },
        400
      );
    });

    it('should return text stream on success', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findAiProviderById).mockResolvedValue({ isActive: true, provider: 'openai', key: 'key' } as any);

      const response = await generateBlogPost(mockContext);

      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    });

    it('should return 500 when service throws error', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findAiProviderById).mockRejectedValue(new Error('Service Error'));

      const response = await generateBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.generate', message: 'Service Error' },
        500
      );
    });
  });

  describe('stylizeBlogPost', () => {
    const validPayload = {
      htmlContent: '<p>Test</p>',
      language: 'en',
      providerId: '123e4567-e89b-12d3-a456-426614174000'
    };

    it('should return 400 if htmlContent is empty', async () => {
      mockContext.req.json.mockResolvedValue({ ...validPayload, htmlContent: '   ' });

      const response = await stylizeBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.empty_content', message: expect.any(String) },
        400
      );
    });

    it('should return 404 if AI provider is not found', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findAiProviderById).mockResolvedValue(null);

      const response = await stylizeBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.provider_not_found', message: expect.any(String) },
        404
      );
    });

    it('should return 400 if AI provider is inactive', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findAiProviderById).mockResolvedValue({ isActive: false } as any);

      const response = await stylizeBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.provider_inactive', message: expect.any(String) },
        400
      );
    });

    it('should return text stream on success', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findAiProviderById).mockResolvedValue({ isActive: true, provider: 'openai', key: 'key' } as any);

      const response = await stylizeBlogPost(mockContext);

      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    });

    it('should return 500 when service throws error', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findAiProviderById).mockRejectedValue(new Error('Service Error'));

      const response = await stylizeBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.stylize', message: 'Service Error' },
        500
      );
    });

    it('should return 400 if model is invalid', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findAiProviderById).mockResolvedValue({
        isActive: true,
        provider: 'invalid-provider',
        key: 'key'
      } as any);

      await stylizeBlogPost(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'blog_posts.error.invalid_model', message: expect.any(String) },
        400
      );
    });
  });
});
