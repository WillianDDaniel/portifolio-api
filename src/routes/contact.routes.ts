import { Hono } from 'hono';
import { sendContactEmail } from '../controllers/contact.controller.js';

const contact = new Hono();

contact.post('/', sendContactEmail);

export default contact;