import { handleResponse } from '@/helpers/fetchHelpers';
import type { BlogPost, NewBlogPost } from '@/typings/BlogPosts';

export const BlogPostService = {
  async getAll(): Promise<BlogPost[]> {
    const res = await fetch('/api/blog-posts', { credentials: 'include' });
    return handleResponse(res);
  },

  async getById(id: string): Promise<BlogPost> {
    const res = await fetch(`/api/blog-posts/${id}`, { credentials: 'include' });
    return handleResponse(res);
  },

  async create(payload: NewBlogPost): Promise<BlogPost> {
    const res = await fetch('/api/blog-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async update(id: string, payload: Partial<BlogPost>): Promise<BlogPost> {
    const res = await fetch(`/api/blog-posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async delete(id: string): Promise<{ id: string }> {
    const res = await fetch(`/api/blog-posts/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return handleResponse(res);
  },

  async generate(payload: {
    providerId: string;
    prompt: string;
    postPartialData: {
      language: string;
      title?: string;
      excerpt?: string;
      slug?: string;
    }
  }): Promise<Response> {
    const res = await fetch('/api/blog-posts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao gerar conteúdo com IA');
    }

    return res;
  },

  async checkSlug(language: string, slug: string, excludeId?: string): Promise<{ exists: boolean }> {
    const query = excludeId ? `?excludeId=${excludeId}` : '';
    const res = await fetch(`/api/blog-posts/check-slug/${language}/${slug}${query}`, {
      credentials: 'include'
    });
    return handleResponse(res);
  },

  async stylize(payload: {
    htmlContent: string;
    language: string;
    providerId: string;
  }): Promise<Response> {
    const res = await fetch('/api/blog-posts/stylize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro ao estilizar conteúdo com IA');
    }

    return res;
  },
};
