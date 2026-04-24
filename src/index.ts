import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static'

import authRoutes from './routes/auth.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import githubRoutes from './routes/github.routes.js';
import contactRoutes from './routes/contact.routes.js';
import educationsRoutes from './routes/educations.routes.js';

type Variables = {
  jwtPayload: any;
};

const app = new Hono<{ Variables: Variables }>();

app.use('*', logger());

app.use('*', cors({
  origin: (origin) => origin,
  credentials: true,
}));

app.route('/auth', authRoutes);
app.route('/api/projects', projectsRoutes);
app.route('/api/uploads', uploadRoutes);
app.route('/api/github', githubRoutes);
app.route('/api/contact', contactRoutes);
app.route('/api/educations', educationsRoutes);

app.use('/*', serveStatic({
  root: './public',
  index: 'index.html'
}));

app.get('/projects/edit/:id', serveStatic({
  path: './public/projects/edit/index.html'
}));

export default app;