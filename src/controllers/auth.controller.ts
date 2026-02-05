import { Context } from 'hono';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import { setCookie } from 'hono/cookie';
import * as bcrypt from 'bcryptjs';

export const login = async (c: Context) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ message: 'Email and password required' }, 400);
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    return c.json({ message: 'Invalid credentials' }, 401);
  }

  // Lock check
  if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
    return c.json({ message: 'Account temporarily locked' }, 429);
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);

  if (!passwordValid) {
    const attempts = user.loginAttempts + 1;
    let lockUntil = user.lockUntil;

    if (attempts >= 5) {
      lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    }

    await db.update(users)
      .set({ loginAttempts: attempts >= 5 ? 0 : attempts, lockUntil })
      .where(eq(users.id, user.id));

    return c.json({ message: 'Invalid credentials' }, 401);
  }

  // Reset attempts on success
  await db.update(users)
    .set({ loginAttempts: 0, lockUntil: null })
    .where(eq(users.id, user.id));

  const token = await sign({
    id: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30),
  }, process.env.JWT_SECRET!);

  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return c.json({ message: 'Logged in' });
};