import { handleResponse } from '@/helpers/fetchHelpers';

import type { Tag, NewTag } from '@/typings/Tags';

export const TagService = {
  async getAll(): Promise<Tag[]> {
    const res = await fetch('/api/tags', { credentials: 'include' });
    return handleResponse(res);
  },

  async create(payload: NewTag): Promise<Tag> {
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  }
};
