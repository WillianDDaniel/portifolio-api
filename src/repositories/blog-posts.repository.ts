import { db } from '../db/index.js';

import { blogPosts, blogPostTranslations, blogPostsToCategories, blogPostsToTags } from '../db/schema.js';

import { eq, and, ne, or, lte } from 'drizzle-orm';

type NewBlogPost = typeof blogPosts.$inferInsert;
type NewBlogPostTranslation = typeof blogPostTranslations.$inferInsert;

export const findAllBlogPosts = async (publishedOnly: boolean = false) => {
  return await db.query.blogPosts.findMany({
    where: publishedOnly
      ? or(
        eq(blogPosts.status, 'published'),
        and(
          eq(blogPosts.status, 'scheduled'),
          lte(blogPosts.publishedAt, new Date())
        )
      )
      : undefined,
    with: {
      translations: true,
      author: {
        columns: { name: true, avatarUrl: true }
      },
      categories: {
        with: { category: true }
      },
      tags: {
        with: { tag: true }
      }
    },
    orderBy: (posts, { desc }) => [desc(posts.publishedAt), desc(posts.createdAt)]
  });
};

export const findBlogPostById = async (id: string) => {
  return await db.query.blogPosts.findFirst({
    where: eq(blogPosts.id, id),
    with: {
      translations: true,
      author: {
        columns: { name: true, avatarUrl: true }
      },
      categories: {
        with: { category: true }
      },
      tags: {
        with: { tag: true }
      }
    },
  });
};

export const findBlogPostBySlugAndLang = async (language: string, slug: string) => {
  const translationRecord = await db.query.blogPostTranslations.findFirst({
    where: and(
      eq(blogPostTranslations.language, language),
      eq(blogPostTranslations.slug, slug)
    ),
    with: {
      post: {
        with: {
          translations: true,
          author: { columns: { name: true, avatarUrl: true } },
          categories: { with: { category: true } },
          tags: { with: { tag: true } }
        },
      },
    },
  });

  if (!translationRecord) return undefined;

  const post = translationRecord.post;

  const isPublished = post.status === 'published';
  const isScheduledAndReady = post.status === 'scheduled' && post.publishedAt && post.publishedAt <= new Date();

  if (!isPublished && !isScheduledAndReady) return undefined;

  return post;
};

export const createBlogPostRecord = async (
  postData: NewBlogPost,
  translations: Omit<NewBlogPostTranslation, 'postId'>[],
  categoryIds?: string[],
  tagIds?: string[]
) => {
  return await db.transaction(async (tx) => {
    const [post] = await tx.insert(blogPosts).values(postData).returning();

    if (!post) return null;

    if (translations?.length) {
      await tx.insert(blogPostTranslations).values(
        translations.map((t) => ({ ...t, postId: post.id }))
      );
    }

    if (categoryIds?.length) {
      await tx.insert(blogPostsToCategories).values(
        categoryIds.map((categoryId) => ({ postId: post.id, categoryId }))
      );
    }

    if (tagIds?.length) {
      await tx.insert(blogPostsToTags).values(
        tagIds.map((tagId) => ({ postId: post.id, tagId }))
      );
    }

    return await tx.query.blogPosts.findFirst({
      where: eq(blogPosts.id, post.id),
      with: {
        translations: true,
        categories: { with: { category: true } },
        tags: { with: { tag: true } }
      }
    });
  });
};

export const updateBlogPostRecord = async (
  id: string,
  postData: Partial<NewBlogPost>,
  translations: Omit<NewBlogPostTranslation, 'postId'>[],
  categoryIds?: string[],
  tagIds?: string[]
) => {
  return await db.transaction(async (tx) => {
    const [updatedPost] = await tx.update(blogPosts)
      .set({ ...postData, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();

    if (!updatedPost) return null;

    if (translations && Array.isArray(translations)) {
      await tx.delete(blogPostTranslations).where(eq(blogPostTranslations.postId, id));
      if (translations.length > 0) {
        await tx.insert(blogPostTranslations).values(
          translations.map((t) => ({ ...t, postId: id }))
        );
      }
    }

    if (categoryIds !== undefined) {
      await tx.delete(blogPostsToCategories).where(eq(blogPostsToCategories.postId, id));
      if (categoryIds.length > 0) {
        await tx.insert(blogPostsToCategories).values(
          categoryIds.map((categoryId) => ({ postId: id, categoryId }))
        );
      }
    }

    if (tagIds !== undefined) {
      await tx.delete(blogPostsToTags).where(eq(blogPostsToTags.postId, id));
      if (tagIds.length > 0) {
        await tx.insert(blogPostsToTags).values(
          tagIds.map((tagId) => ({ postId: id, tagId }))
        );
      }
    }

    return await tx.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
      with: {
        translations: true,
        categories: { with: { category: true } },
        tags: { with: { tag: true } }
      }
    });
  });
};

export const deleteBlogPostRecord = async (id: string) => {
  const [deletedPost] = await db.delete(blogPosts)
    .where(eq(blogPosts.id, id))
    .returning({ id: blogPosts.id });

  if (!deletedPost) return null;

  return deletedPost;
};

export const checkSlugExists = async (
  language: string,
  slug: string,
  excludePostId?: string
): Promise<boolean> => {
  const filters = [
    eq(blogPostTranslations.language, language),
    eq(blogPostTranslations.slug, slug)
  ];

  if (excludePostId) {
    filters.push(ne(blogPostTranslations.postId, excludePostId));
  }

  const existing = await db.query.blogPostTranslations.findFirst({
    where: and(...filters),
    columns: { id: true }
  });

  return !!existing;
};
