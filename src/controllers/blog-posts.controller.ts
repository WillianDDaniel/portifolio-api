import { Context } from 'hono';
import { toTextStream } from 'ai';

import { AiService } from '../services/ai.service.js';
import { BlogPrompts } from '../prompts/blog.prompts.js';
import type { BlogPost, GenerateBlogPost } from '../schemas/blog-posts.schema.js';

import { DEFAULT_MODELS } from '../constants/index.js';

import {
  findAllBlogPosts,
  findBlogPostById,
  findBlogPostBySlugAndLang,
  createBlogPostRecord,
  updateBlogPostRecord,
  deleteBlogPostRecord,
  checkSlugExists
} from '../repositories/blog-posts.repository.js';

import {
  findAiProviderById
} from '../repositories/ai-providers.repository.js';

export const getBlogPosts = async (c: Context) => {
  try {
    const posts = await findAllBlogPosts(true);
    return c.json(posts, 200);
  } catch (error: any) {
    return c.json({ error: 'blog_posts.error.list', message: error.message }, 500);
  }
};

export const getBlogPostBySlug = async (c: Context) => {
  const { lang, slug } = c.req.param();

  try {
    const post = await findBlogPostBySlugAndLang(lang, slug);

    if (!post) return c.json({
      error: 'blog_posts.error.not_found', message: 'Blog post not found'
    }, 404);

    return c.json(post, 200);
  } catch (error: any) {
    return c.json({ error: 'blog_posts.error.get_by_slug', message: error.message }, 500);
  }
};

export const getAdminBlogPosts = async (c: Context) => {
  try {
    const posts = await findAllBlogPosts(false);
    return c.json(posts, 200);
  } catch (error: any) {
    return c.json({ error: 'blog_posts.error.list', message: error.message }, 500);
  }
};

export const getBlogPostById = async (c: Context) => {
  const id = c.req.param('id');

  try {
    const post = await findBlogPostById(id);

    if (!post) return c.json({
      error: 'blog_posts.error.not_found', message: 'Blog post not found'
    }, 404);

    return c.json(post, 200);
  } catch (error: any) {
    return c.json({ error: 'blog_posts.error.get_by_id', message: error.message }, 500);
  }
};

export const createBlogPost = async (c: Context) => {
  try {
    const rawBody = await c.req.json<BlogPost>();
    const { translations, categoryIds, tagIds, ...postData } = rawBody;

    const jwtPayload = c.get('jwtPayload');
    const authorId = jwtPayload.id;

    let finalPublishedAt = postData.publishedAt ? new Date(postData.publishedAt) : null;
    if (postData.status === 'published' && !finalPublishedAt) {
      finalPublishedAt = new Date();
    }

    const newPostData = {
      ...postData,
      authorId,
      publishedAt: finalPublishedAt,
    };

    const newPost = await createBlogPostRecord(newPostData, translations, categoryIds, tagIds);

    if (!newPost) {
      return c.json({
        error: 'blog_posts.error.create',
        message: 'Blog post not created'
      }, 422);
    }

    return c.json(newPost, 201);
  } catch (error: any) {
    return c.json({
      error: 'blog_posts.error.create',
      message: "Create Failed"
    }, 500);
  }
};

export const updateBlogPost = async (c: Context) => {
  const id = c.req.param('id');

  try {
    const rawBody = await c.req.json<BlogPost>();
    const { translations, categoryIds, tagIds, ...postData } = rawBody;

    const existingPost = await findBlogPostById(id);

    if (!existingPost) return c.json({
      error: 'blog_posts.error.not_found', message: 'Blog post not found'
    }, 404);

    const updatePayload: any = { ...postData };

    if (postData.publishedAt) {
      updatePayload.publishedAt = new Date(postData.publishedAt);
    } else if (postData.status === 'published' && !existingPost.publishedAt) {
      updatePayload.publishedAt = new Date();
    }

    const updatedPost = await updateBlogPostRecord(id, updatePayload, translations, categoryIds, tagIds);

    if (!updatedPost) return c.json({
      error: 'blog_posts.error.update', message: 'Blog post not updated'
    }, 422);

    return c.json(updatedPost, 200);
  } catch (error: any) {
    return c.json({ error: 'blog_posts.error.update', message: error.message }, 500);
  }
};

export const deleteBlogPost = async (c: Context) => {
  const id = c.req.param('id');

  try {
    const deletedPost = await deleteBlogPostRecord(id);

    if (!deletedPost) return c.json({
      error: 'blog_posts.error.delete', message: 'Blog post not deleted'
    }, 422);

    return c.json(deletedPost, 200);
  } catch (error: any) {
    return c.json({ error: 'blog_posts.error.delete', message: error.message }, 500);
  }
};

export const generateBlogPost = async (c: Context) => {
  try {
    const { prompt, postPartialData, providerId } = await c.req.json<GenerateBlogPost>();

    const aiProviderRecord = await findAiProviderById(providerId);
    if (!aiProviderRecord) {
      return c.json({
        error: 'blog_posts.error.provider_not_found',
        message: 'Provedor de IA não encontrado.'
      }, 404);
    }

    if (!aiProviderRecord.isActive) {
      return c.json({
        error: 'blog_posts.error.provider_inactive',
        message: 'O provedor de IA selecionado está desativado no painel.'
      }, 400);
    }

    const model = DEFAULT_MODELS[aiProviderRecord.provider];
    if (!model) {
      return c.json({
        error: 'blog_posts.error.invalid_model',
        message: 'Modelo padrão não definido para este provedor.'
      }, 400);
    }

    const systemPrompt = BlogPrompts.buildHtmlSystemPrompt(postPartialData);
    const userPrompt = prompt || BlogPrompts.getUserPrompt(postPartialData.language);

    const aiService = new AiService(aiProviderRecord.provider, model, aiProviderRecord.key);
    const result = await aiService.streamHtmlContent(systemPrompt, userPrompt);

    return new Response(toTextStream({ stream: result.stream }), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return c.json({ error: 'blog_posts.error.generate', message: error.message }, 500);
  }
};

export const checkSlug = async (c: Context) => {
  const { lang, slug } = c.req.param();
  const excludeId = c.req.query('excludeId');

  try {
    const exists = await checkSlugExists(lang, slug, excludeId);

    return c.json({ exists }, 200);
  } catch (error: any) {
    return c.json({ error: 'blog_posts.error.check_slug', message: error.message }, 500);
  }
};

export const stylizeBlogPost = async (c: Context) => {
  try {
    const { htmlContent, language, providerId } = await c.req.json<{
      htmlContent: string;
      language: 'en' | 'pt' | 'es';
      providerId: string;
    }>();

    if (!htmlContent || htmlContent.trim() === '') {
      return c.json({
        error: 'blog_posts.error.empty_content',
        message: 'O conteúdo está vazio. Gere ou escreva um texto antes de estilizar.'
      }, 400);
    }

    const aiProviderRecord = await findAiProviderById(providerId);
    if (!aiProviderRecord) {
      return c.json({
        error: 'blog_posts.error.provider_not_found',
        message: 'Provedor de IA não encontrado.'
      }, 404);
    }

    if (!aiProviderRecord.isActive) {
      return c.json({
        error: 'blog_posts.error.provider_inactive',
        message: 'O provedor de IA selecionado está desativado no painel.'
      }, 400);
    }

    const model = DEFAULT_MODELS[aiProviderRecord.provider];
    if (!model) {
      return c.json({
        error: 'blog_posts.error.invalid_model',
        message: 'Modelo padrão não definido para este provedor.'
      }, 400);
    }

    const systemPrompt = BlogPrompts.buildStylingSystemPrompt(language);
    const userPrompt = BlogPrompts.getStylingUserPrompt(htmlContent, language);

    const aiService = new AiService(aiProviderRecord.provider, model, aiProviderRecord.key);
    const result = await aiService.streamHtmlContent(systemPrompt, userPrompt);

    return new Response(toTextStream({ stream: result.stream }), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return c.json({ error: 'blog_posts.error.stylize', message: error.message }, 500);
  }
};
