import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static'

import { i18nMiddleware } from './middlewares/i18n.js';

import authRoutes from './routes/auth.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import userRoutes from './routes/user.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import githubRoutes from './routes/github.routes.js';
import serviceRoutes from './routes/services.routes.js';
import contactRoutes from './routes/contact.routes.js';
import educationsRoutes from './routes/educations.routes.js';

import blogPostRoutes from './routes/blog-posts.routes.js';
import tagsRoutes from './routes/tags.routes.js';
import categoriesRoutes from './routes/categories.routes.js';

import iaProvidersRoutes from './routes/ai-providers.routes.js';

type Variables = {
  jwtPayload: any;
  language: string
  t: (key: string, options?: Record<string, any>) => string
};

const app = new Hono<{ Variables: Variables }>();

app.use('*', logger());

app.use('*', cors({
  origin: (origin) => origin,
  credentials: true,
}));

app.use('*', i18nMiddleware);

app.route('/auth', authRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/user', userRoutes);
app.route('/api/projects', projectsRoutes);
app.route('/api/uploads', uploadRoutes);
app.route('/api/github', githubRoutes);
app.route('/api/contact', contactRoutes);
app.route('/api/educations', educationsRoutes);
app.route('/api/services', serviceRoutes);
app.route('/api/blog-posts', blogPostRoutes);

app.route('/api/tags', tagsRoutes);
app.route('/api/categories', categoriesRoutes);

app.route('/api/ai-providers', iaProvidersRoutes);

app.use('/*', serveStatic({
  root: './public',
  index: 'index.html'
}));

app.get('*', serveStatic({
  path: './public/index.html'
}));

export default app;
