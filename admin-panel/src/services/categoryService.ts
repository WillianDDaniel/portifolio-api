import { handleResponse } from '@/helpers/fetchHelpers';

import type { Category, NewCategory } from '@/typings/Categories';

export const CategoryService = {
  async getAll(): Promise<Category[]> {
    const res = await fetch('/api/categories', { credentials: 'include' });
    return handleResponse(res);
  },

  async create(payload: NewCategory): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  }
};
