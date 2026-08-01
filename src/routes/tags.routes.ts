import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { authMiddleware } from '../middlewares/auth.js';
import { createTagSchema } from '../schemas/tags.schema.js';
import { getTags, createTag } from '../controllers/tags.controller.js';

const tags = new Hono();

tags.get('/', getTags);
tags.post('/', authMiddleware, zValidator('json', createTagSchema), createTag);

export default tags;
