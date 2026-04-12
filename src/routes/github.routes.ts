import { Hono } from 'hono';
import { cronMiddleware } from '../middlewares/cron.js';
import { authMiddleware } from '../middlewares/auth.js';
import { previewGithubData, syncGithubData } from '../controllers/github.controller.js';

const github = new Hono();

github.get('/cron/sync', cronMiddleware, syncGithubData);
github.post('/sync', cronMiddleware, syncGithubData);
github.get('/preview', authMiddleware, previewGithubData);

export default github;
