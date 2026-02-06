import { Hono } from 'hono';
import { cronMiddleware } from '../middlewares/cron.js';
import { syncGithubData } from '../controllers/github.controller.js';

const github = new Hono();

github.get('/cron/syncGithubData', cronMiddleware, syncGithubData);
github.post('/syncGithubData', cronMiddleware, syncGithubData);

export default github;