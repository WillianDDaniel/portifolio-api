import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { authMiddleware } from '../middlewares/auth.js';
import { createCategorySchema } from '../schemas/categories.schema.js';
import { getCategories, createCategory } from '../controllers/categories.controller.js';

const categories = new Hono();

categories.get('/', getCategories);
categories.post('/', authMiddleware, zValidator('json', createCategorySchema), createCategory);

export default categories;
