import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = getCookie(c, 'auth_token');

  if (!token) {
    return c.json({ message: 'Unauthorized' }, 401);
  }

  try {
    const decoded = await verify(token, process.env.JWT_SECRET!, 'HS256');
    
    c.set('jwtPayload', decoded);
    await next();
  } catch (error) {
    return c.json({ message: 'Invalid or expired token' }, 401);
  }
});