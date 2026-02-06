import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static'

import authRoutes from './routes/auth.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import githubRoutes from './routes/github.routes.js';

// Definimos o tipo das variáveis para o contexto global do Hono
// Isso garante que o TypeScript reconheça o jwtPayload em qualquer lugar do app
type Variables = {
  jwtPayload: any;
};

const app = new Hono<{ Variables: Variables }>();

// Middlewares de log e infraestrutura
app.use('*', logger());

// Configuração de CORS funcional para Serverless
app.use('*', cors({
  origin: (origin) => origin,
  credentials: true,
}));

app.route('/auth', authRoutes);
app.route('/api/projects', projectsRoutes)
app.route('/api/uploads', uploadRoutes)
app.route('/api/github', githubRoutes)

app.use('/*', serveStatic({
  root: './public',
  index: 'index.html'
}))

app.get('/projects/edit/:id', serveStatic({ 
  path: './public/projects/edit/index.html' 
}));

export default app;