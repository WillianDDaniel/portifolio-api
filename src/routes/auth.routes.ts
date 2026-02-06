import { Hono } from 'hono';
import { login, logout } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const auth = new Hono();

auth.post('/login', login);
auth.post('/logout', logout)

auth.get('/me', authMiddleware, (c) => {
  const payload = c.get('jwtPayload');
  return c.json(payload);
});

export default auth;