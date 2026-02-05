import { Hono } from 'hono';
import { getCloudinarySignature } from '../controllers/upload.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const upload = new Hono();

upload.get('/cloudinary-signature', authMiddleware, getCloudinarySignature);

export default upload;