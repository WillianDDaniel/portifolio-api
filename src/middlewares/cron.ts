import { createMiddleware } from 'hono/factory';

export const cronMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    await next();
});