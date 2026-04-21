export function buildContactFormEmail({
  name,
  company,
  email,
  whatsapp,
  message,
}: EmailPayload): string {

  return `
    <h2>New Message Received!</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Company:</strong> ${company}</p>
    ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
    ${whatsapp ? `<p><strong>WhatsApp:</strong> ${whatsapp}</p>` : ''}
    <br/>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `;
}
