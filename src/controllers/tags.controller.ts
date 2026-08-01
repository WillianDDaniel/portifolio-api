import { Context } from 'hono';

import type { CreateTag } from '../schemas/tags.schema.js';

import {
  findAllTags,
  findTagBySlugAndLang,
  createTagRecord
} from '../repositories/tags.repository.js';

export const getTags = async (c: Context) => {
  try {
    const records = await findAllTags();
    return c.json(records, 200);
  } catch (error: any) {
    return c.json({ error: 'tags.error.list', message: error.message }, 500);
  }
};

export const createTag = async (c: Context) => {
  try {
    const data = await c.req.json<CreateTag>();

    for (const translation of data.translations) {
      const exists = await findTagBySlugAndLang(translation.slug, translation.language);
      if (exists) {
        return c.json({ error: 'tags.error.already_exists', message: `Tag já existe.` }, 409);
      }
    }

    const newTag = await createTagRecord(data);
    return c.json(newTag, 201);
  } catch (error: any) {
    return c.json({ error: 'tags.error.create', message: 'Create Failed' }, 500);
  }
};
