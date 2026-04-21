import type { Context } from 'hono';
import { sendContactFormEmail } from '../services/resend.service.js';

export const sendContactEmail = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { name, company, email, whatsapp, message } = body;

    if (!name || !company || !message) {
      return c.json({
        success: false,
        message: 'Missing required fields: name, company, or message'
      }, 400);
    }

    if (!email && !whatsapp) {
      return c.json({
        success: false,
        message: 'You must provide either an email or a whatsapp number'
      }, 400);
    }

    const result = await sendContactFormEmail({ name, company, email, whatsapp, message });

    if (!result.success) {
      return c.json({ success: false, message: 'Error sending email to the service.' }, 500);
    }

    return c.json({ success: true, message: 'Email sent successfully!', data: result.data });

  } catch (error) {
    console.error('Error in contact controller:', error);
    return c.json({ success: false, message: 'Internal server error.' }, 500);
  }
};
