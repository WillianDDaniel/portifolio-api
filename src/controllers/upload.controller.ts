import { Context } from 'hono';
import { v2 as cloudinary } from 'cloudinary';

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Transforma o título do projeto em um ID amigável para a URL do Cloudinary
 */
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

/**
 * Gera a assinatura para upload seguro no lado do cliente (Frontend)
 */
export const getCloudinarySignature = async (c: Context) => {
  const projectTitle = c.req.query('projectTitle');

  if (!projectTitle) {
    return c.json({ message: 'projectTitle is required' }, 400);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `projects/${slugify(projectTitle)}`;

  const paramsToSign = {
    timestamp,
    public_id: publicId,
  };

  // Gera a assinatura usando o secret do backend
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return c.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    publicId,
  });
};