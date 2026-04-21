import { Resend } from 'resend';
import { buildContactFormEmail } from '../utils/email.js';

export interface EmailPayload {
  name: string;
  company: string;
  email?: string;
  whatsapp?: string;
  message: string;
}

export async function sendContactFormEmail(payload: EmailPayload) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const data = await resend.emails.send({
      from: 'Formulário Portfólio <onboarding@resend.dev>',
      to: 'williandeivitidaniel@live.com',
      ...(payload.email && { replyTo: payload.email }),
      subject: `Nova mensagem de contato: ${payload.name} (${payload.company})`,
      html: buildContactFormEmail(payload)
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error in sendContactFormEmail:', error);
    return { success: false, error };
  }
}
