import { Context } from 'hono';

import type { CreateCategory } from '../schemas/categories.schema.js';

import {
  findAllCategories,
  findCategoryBySlugAndLang,
  createCategoryRecord
} from '../repositories/categories.repository.js';

export const getCategories = async (c: Context) => {
  try {
    const records = await findAllCategories();
    return c.json(records, 200);
  } catch (error: any) {
    return c.json({ error: 'categories.error.list', message: error.message }, 500);
  }
};

export const createCategory = async (c: Context) => {
  try {
    const data = await c.req.json<CreateCategory>();

    for (const translation of data.translations) {
      const exists = await findCategoryBySlugAndLang(translation.slug, translation.language);
      if (exists) {
        return c.json({ error: 'categories.error.already_exists', message: `Categoria já existe.` }, 409);
      }
    }

    const newCategory = await createCategoryRecord(data);
    return c.json(newCategory, 201);
  } catch (error: any) {
    return c.json({ error: 'categories.error.create', message: 'Create Failed' }, 500);
  }
};
