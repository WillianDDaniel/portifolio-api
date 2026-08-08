import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ne } from 'drizzle-orm';

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    eq: vi.fn().mockReturnValue({ mockEq: true }),
    ne: vi.fn().mockReturnValue({ mockNe: true }),
    and: vi.fn().mockImplementation((...args) => args),
    or: vi.fn().mockImplementation((...args) => args),
    lte: vi.fn().mockReturnValue({ mockLte: true }),
  };
});

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      blogPosts: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      blogPostTranslations: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    }),
    transaction: vi.fn(),
  },
}));

import {
  findAllBlogPosts,
  findBlogPostById,
  findBlogPostBySlugAndLang,
  createBlogPostRecord,
  updateBlogPostRecord,
  deleteBlogPostRecord,
  checkSlugExists,
} from '../../repositories/blog-posts.repository.js';

import { db } from '../../db/index.js';
import { blogPosts, blogPostTranslations, blogPostsToCategories, blogPostsToTags } from '../../db/schema.js';

describe('Blog Posts Repository', () => {
  const mockTx = {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    }),
    query: {
      blogPosts: {
        findFirst: vi.fn(),
      },
    },
  };

  const expectedWithRelations = {
    translations: true,
    author: {
      columns: { name: true, avatarUrl: true },
    },
    categories: {
      with: { category: true },
    },
    tags: {
      with: { tag: true },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.transaction).mockImplementation(async (callback) => {
      return await callback(mockTx as any);
    });
  });

  describe('findAllBlogPosts', () => {
    it('should find all posts when publishedOnly is false', async () => {
      const mockPosts = [{ id: '1', title: 'Post 1' }];
      vi.mocked(db.query.blogPosts.findMany).mockResolvedValue(mockPosts as any);

      const result = await findAllBlogPosts(false);

      expect(db.query.blogPosts.findMany).toHaveBeenCalledWith({
        where: undefined,
        with: expectedWithRelations,
        orderBy: expect.any(Function),
      });
      expect(result).toEqual(mockPosts);
    });

    it('should find only published posts when publishedOnly is true', async () => {
      const mockPosts = [{ id: '1', title: 'Post 1', status: 'published' }];
      vi.mocked(db.query.blogPosts.findMany).mockResolvedValue(mockPosts as any);

      const result = await findAllBlogPosts(true);

      expect(db.query.blogPosts.findMany).toHaveBeenCalledWith({
        where: expect.any(Array),
        with: expectedWithRelations,
        orderBy: expect.any(Function),
      });
      expect(result).toEqual(mockPosts);
    });
  });

  describe('findBlogPostById', () => {
    it('should find and return blog post by ID', async () => {
      const mockPost = { id: 'post-123', translations: [] };
      vi.mocked(db.query.blogPosts.findFirst).mockResolvedValue(mockPost as any);

      const result = await findBlogPostById('post-123');

      expect(db.query.blogPosts.findFirst).toHaveBeenCalledWith({
        where: expect.any(Object),
        with: expectedWithRelations,
      });
      expect(result).toEqual(mockPost);
    });
  });

  describe('findBlogPostBySlugAndLang', () => {
    it('should return undefined if translation record is not found', async () => {
      vi.mocked(db.query.blogPostTranslations.findFirst).mockResolvedValue(undefined);

      const result = await findBlogPostBySlugAndLang('en', 'some-slug');

      expect(db.query.blogPostTranslations.findFirst).toHaveBeenCalledWith({
        where: expect.any(Array),
        with: {
          post: {
            with: expectedWithRelations,
          },
        },
      });
      expect(result).toBeUndefined();
    });

    it('should return undefined if translation record is found but post is not published', async () => {
      const mockTranslation = {
        id: 'trans-1',
        post: {
          id: 'post-1',
          status: 'draft',
        },
      };
      vi.mocked(db.query.blogPostTranslations.findFirst).mockResolvedValue(mockTranslation as any);

      const result = await findBlogPostBySlugAndLang('en', 'some-slug');

      expect(result).toBeUndefined();
    });

    it('should return the post if translation record is found and post is published', async () => {
      const mockTranslation = {
        id: 'trans-1',
        post: {
          id: 'post-1',
          status: 'published',
          translations: [],
        },
      };
      vi.mocked(db.query.blogPostTranslations.findFirst).mockResolvedValue(mockTranslation as any);

      const result = await findBlogPostBySlugAndLang('en', 'some-slug');

      expect(result).toEqual(mockTranslation.post);
    });
  });

  describe('createBlogPostRecord', () => {
    const postData = { coverImageUrl: 'https://example.com/img.png', status: 'published' };
    const translations = [{ language: 'en', slug: 'my-slug', title: 'Title', excerpt: 'Excerpt', content: 'Content' }];

    it('should create post and translations in a transaction', async () => {
      const createdPost = { id: 'post-123', ...postData };
      const createdTranslations = [{ id: 'trans-1', postId: 'post-123', ...translations[0] }];
      const queryResult = {
        ...createdPost,
        translations: createdTranslations,
        categories: [],
        tags: [],
      };

      vi.mocked(mockTx.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([createdPost]),
      } as any);

      vi.mocked(mockTx.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue(createdTranslations),
      } as any);

      vi.mocked(mockTx.query.blogPosts.findFirst).mockResolvedValue(queryResult as any);

      const result = await createBlogPostRecord(postData as any, translations as any);

      expect(db.transaction).toHaveBeenCalled();
      expect(mockTx.insert).toHaveBeenNthCalledWith(1, blogPosts);
      expect(mockTx.insert).toHaveBeenNthCalledWith(2, blogPostTranslations);
      expect(result).toEqual(queryResult);
    });

    it('should return null if post insertion returns no record', async () => {
      vi.mocked(mockTx.insert).mockReturnValueOnce({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      } as any);

      const result = await createBlogPostRecord(postData as any, translations as any);

      expect(result).toBeNull();
    });
  });

  describe('updateBlogPostRecord', () => {
    const updateData = { coverImageUrl: 'https://example.com/new.png' };
    const translations = [{ language: 'pt', slug: 'new-slug', title: 'New', excerpt: 'New excerpt', content: 'New content' }];

    it('should update post and refresh translations in a transaction', async () => {
      const updatedPost = { id: 'post-123', ...updateData };
      const createdTranslations = [{ id: 'trans-2', postId: 'post-123', ...translations[0] }];
      const queryResult = {
        ...updatedPost,
        translations: createdTranslations,
        categories: [],
        tags: [],
      };

      vi.mocked(mockTx.update).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([updatedPost]),
      } as any);

      vi.mocked(mockTx.delete).mockReturnValue({
        where: vi.fn().mockReturnThis(),
      } as any);

      vi.mocked(mockTx.insert).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue(createdTranslations),
      } as any);

      vi.mocked(mockTx.query.blogPosts.findFirst).mockResolvedValue(queryResult as any);

      const result = await updateBlogPostRecord('post-123', updateData, translations as any);

      expect(db.transaction).toHaveBeenCalled();
      expect(mockTx.update).toHaveBeenCalledWith(blogPosts);
      expect(mockTx.delete).toHaveBeenCalledWith(blogPostTranslations);
      expect(mockTx.insert).toHaveBeenCalledWith(blogPostTranslations);
      expect(result).toEqual(queryResult);
    });

    it('should return null if update returns no record', async () => {
      vi.mocked(mockTx.update).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      } as any);

      const result = await updateBlogPostRecord('post-123', updateData, translations as any);

      expect(result).toBeNull();
    });
  });

  describe('deleteBlogPostRecord', () => {
    it('should delete post and return the id record', async () => {
      const deletedRecord = { id: 'post-123' };
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([deletedRecord]),
      } as any);

      const result = await deleteBlogPostRecord('post-123');

      expect(db.delete).toHaveBeenCalledWith(blogPosts);
      expect(result).toEqual(deletedRecord);
    });

    it('should return null if delete returns no record', async () => {
      vi.mocked(db.delete).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      } as any);

      const result = await deleteBlogPostRecord('post-123');

      expect(result).toBeNull();
    });
  });

  describe('checkSlugExists', () => {
    it('should return true if the slug exists for the given language', async () => {
      vi.mocked(db.query.blogPostTranslations.findFirst).mockResolvedValue({ id: 'trans-123' } as any);

      const result = await checkSlugExists('en', 'existing-slug');

      expect(db.query.blogPostTranslations.findFirst).toHaveBeenCalledWith({
        where: expect.any(Array),
        columns: { id: true },
      });
      expect(result).toBe(true);
    });

    it('should return false if the slug does not exist', async () => {
      vi.mocked(db.query.blogPostTranslations.findFirst).mockResolvedValue(undefined);

      const result = await checkSlugExists('en', 'non-existing-slug');

      expect(result).toBe(false);
    });

    it('should apply excludePostId filter when provided', async () => {
      vi.mocked(db.query.blogPostTranslations.findFirst).mockResolvedValue(undefined);

      const excludeId = 'post-123';
      const result = await checkSlugExists('en', 'some-slug', excludeId);

      expect(ne).toHaveBeenCalledWith(blogPostTranslations.postId, excludeId);
      expect(result).toBe(false);
    });
  });
});
