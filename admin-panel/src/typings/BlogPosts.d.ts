import { z } from 'zod';
import { blogPostSchema } from '../../../src/schemas/blog-posts.schema';

export type NewBlogPost = z.infer<typeof blogPostSchema>;

export type BlogPost = NewBlogPost & {
  id: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;

  author?: {
    name: string | null;
    avatarUrl: string | null;
  };

  categories?: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
      createdAt: string;
    }
  }>;

  tags?: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
      createdAt: string;
    }
  }>;
};
