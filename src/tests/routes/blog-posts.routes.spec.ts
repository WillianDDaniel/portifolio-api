import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

import blogPostsRoutes from '../../routes/blog-posts.routes.js';
import { authMiddleware } from '../../middlewares/auth.js';
import {
  getBlogPosts,
  getBlogPostById,
  getBlogPostBySlug,
  getAdminBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  generateBlogPost,
  stylizeBlogPost,
  checkSlug
} from '../../controllers/blog-posts.controller.js';

vi.mock('../../controllers/blog-posts.controller.js', () => ({
  getBlogPosts: vi.fn((c) => c.json([{ id: '1', title: 'Public Post' }])),
  getBlogPostById: vi.fn((c) => c.json({ id: c.req.param('id'), title: 'Post by ID' })),
  getBlogPostBySlug: vi.fn((c) => {
    const { lang, slug } = c.req.param();
    return c.json({ slug, lang });
  }),
  getAdminBlogPosts: vi.fn((c) => c.json([{ id: '1', title: 'Admin Post' }])),
  createBlogPost: vi.fn((c) => c.json({ id: '2', title: 'Created Post' }, 201)),
  updateBlogPost: vi.fn((c) => c.json({ id: c.req.param('id'), title: 'Updated Post' })),
  deleteBlogPost: vi.fn((c) => c.json({ success: true })),
  generateBlogPost: vi.fn((c) => c.json({ success: true })),
  stylizeBlogPost: vi.fn((c) => c.json({ success: true })),
  checkSlug: vi.fn((c) => c.json({ success: true }))
}));

vi.mock('../../middlewares/auth.js', () => ({
  authMiddleware: vi.fn(async (c, next) => {
    c.set('jwtPayload', { id: '123', email: 'test@example.com' });
    await next();
  }),
}));

describe('Blog Posts Routes', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();
    app.route('/blog-posts', blogPostsRoutes);
  });

  describe('Public Routes', () => {
    it('should call getBlogPosts on GET /blog-posts/public', async () => {
      const res = await app.request('/blog-posts/public');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual([{ id: '1', title: 'Public Post' }]);
      expect(getBlogPosts).toHaveBeenCalled();
    });

    it('should call getBlogPostById on GET /blog-posts/:id', async () => {
      const res = await app.request('/blog-posts/post-123');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ id: 'post-123', title: 'Post by ID' });
      expect(getBlogPostById).toHaveBeenCalled();
    });

    it('should call getBlogPostBySlug on GET /blog-posts/slug/:lang/:slug', async () => {
      const res = await app.request('/blog-posts/slug/en/my-cool-post');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ lang: 'en', slug: 'my-cool-post' });
      expect(getBlogPostBySlug).toHaveBeenCalled();
    });
  });

  describe('Protected Routes', () => {
    const validBlogPostPayload = {
      coverImageUrl: 'https://example.com/image.png',
      isPublished: true,
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

    it('should call getAdminBlogPosts on GET /blog-posts when authenticated', async () => {
      const res = await app.request('/blog-posts');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual([{ id: '1', title: 'Admin Post' }]);
      expect(authMiddleware).toHaveBeenCalled();
      expect(getAdminBlogPosts).toHaveBeenCalled();
    });

    it('should block GET /blog-posts when not authenticated', async () => {
      vi.mocked(authMiddleware).mockImplementationOnce(async (c) => {
        return c.json({ message: 'Unauthorized' }, 401);
      });

      const res = await app.request('/blog-posts');

      expect(res.status).toBe(401);
      expect(getAdminBlogPosts).not.toHaveBeenCalled();
    });

    it('should call createBlogPost on POST /blog-posts with valid payload when authenticated', async () => {
      const res = await app.request('/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBlogPostPayload),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toEqual({ id: '2', title: 'Created Post' });
      expect(createBlogPost).toHaveBeenCalled();
    });

    it('should return 400 on POST /blog-posts with invalid payload when authenticated', async () => {
      const res = await app.request('/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: 'not-a-bool' }),
      });

      expect(res.status).toBe(400);
      expect(createBlogPost).not.toHaveBeenCalled();
    });

    it('should call updateBlogPost on PUT /blog-posts/:id with valid payload when authenticated', async () => {
      const res = await app.request('/blog-posts/post-123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBlogPostPayload),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ id: 'post-123', title: 'Updated Post' });
      expect(updateBlogPost).toHaveBeenCalled();
    });

    it('should call deleteBlogPost on DELETE /blog-posts/:id when authenticated', async () => {
      const res = await app.request('/blog-posts/post-123', {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
      expect(deleteBlogPost).toHaveBeenCalled();
    });

    it('should block DELETE /blog-posts/:id when not authenticated', async () => {
      vi.mocked(authMiddleware).mockImplementationOnce(async (c) => {
        return c.json({ message: 'Unauthorized' }, 401);
      });

      const res = await app.request('/blog-posts/post-123', {
        method: 'DELETE',
      });

      expect(res.status).toBe(401);
      expect(deleteBlogPost).not.toHaveBeenCalled();
    });

    it('should call checkSlug on GET /blog-posts/check-slug/:lang/:slug when authenticated', async () => {
      const res = await app.request('/blog-posts/check-slug/en/my-cool-post');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
      expect(checkSlug).toHaveBeenCalled();
    });

    it('should block GET /blog-posts/check-slug/:lang/:slug when not authenticated', async () => {
      vi.mocked(authMiddleware).mockImplementationOnce(async (c) => {
        return c.json({ message: 'Unauthorized' }, 401);
      });

      const res = await app.request('/blog-posts/check-slug/en/my-cool-post');

      expect(res.status).toBe(401);
      expect(checkSlug).not.toHaveBeenCalled();
    });

    it('should call generateBlogPost on POST /blog-posts/generate with valid payload when authenticated', async () => {
      const res = await app.request('/blog-posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Valid prompt example',
          providerId: '123e4567-e89b-12d3-a456-426614174000',
          postPartialData: {
            language: 'en',
            title: 'Valid Title Example'
          }
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
      expect(generateBlogPost).toHaveBeenCalled();
    });

    it('should return 400 on POST /blog-posts/generate with invalid payload', async () => {
      const res = await app.request('/blog-posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      expect(generateBlogPost).not.toHaveBeenCalled();
    });

    it('should call stylizeBlogPost on POST /blog-posts/stylize with valid payload when authenticated', async () => {
      const res = await app.request('/blog-posts/stylize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          htmlContent: '<p>Valid HTML content example</p>',
          language: 'en',
          providerId: '123e4567-e89b-12d3-a456-426614174000'
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
      expect(stylizeBlogPost).toHaveBeenCalled();
    });

    it('should return 400 on POST /blog-posts/stylize with invalid payload', async () => {
      const res = await app.request('/blog-posts/stylize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      expect(stylizeBlogPost).not.toHaveBeenCalled();
    });
  });
});
