import { Hono } from 'hono';

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
} from '../controllers/blog-posts.controller.js';

import { authMiddleware } from '../middlewares/auth.js';

import { zValidator } from '@hono/zod-validator';
import { blogPostSchema, generateBlogPostSchema, stylizeBlogPostSchema } from '../schemas/blog-posts.schema.js';

const blogPost = new Hono();

blogPost.get('/public', getBlogPosts);
blogPost.get('/:id', getBlogPostById);

blogPost.get('/slug/:lang/:slug', getBlogPostBySlug);
blogPost.get('/check-slug/:lang/:slug', authMiddleware, checkSlug);

blogPost.get('/', authMiddleware, getAdminBlogPosts);

blogPost.post('/', authMiddleware, zValidator('json', blogPostSchema), createBlogPost);
blogPost.put('/:id', authMiddleware, zValidator('json', blogPostSchema), updateBlogPost);

blogPost.delete('/:id', authMiddleware, deleteBlogPost);

blogPost.post('/generate', authMiddleware, zValidator('json', generateBlogPostSchema), generateBlogPost);
blogPost.post('/stylize', authMiddleware, zValidator('json', stylizeBlogPostSchema), stylizeBlogPost);
export default blogPost;