import 'dotenv-flow/config';
import { db } from './index.js';
import { services, serviceTranslations } from './schema.js';

const servicesData = [
  {
    id: "becb4c31-1630-455c-8921-135cf9fc9d34",
    imageUrl: "https://res.cloudinary.com/rljreiqm/image/upload/v1783897993/projects/proj-becb4c31-1630-455c-8921-135cf9fc9d34.png",
    link: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    translations: [
      { language: "pt", title: "Tráfego Pago e Performance", description: "Gestão de anúncios (Meta Ads, Google Ads) focada em conversão e retorno sobre investimento. Para produtos físicos, digitais, serviços e infoprodutos." },
      { language: "es", title: "Tráfico Pago y Rendimiento", description: "Gestión de anuncios (Meta Ads, Google Ads) enfocada en conversión y retorno de inversión. Para productos físicos, digitales, servicios e infoproductos." }
    ]
  },
  {
    id: "6a92c0b9-4708-4a37-8a33-6aa9da2362f9",
    imageUrl: "https://res.cloudinary.com/rljreiqm/image/upload/v1783898052/projects/proj-6a92c0b9-4708-4a37-8a33-6aa9da2362f9.png",
    link: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    translations: [
      { language: "pt", title: "Criação de Sites e Landing Pages", description: "Eu e minha equipe, desenvolvemos sites e landing pages otimizadas para conversão. Desde e-commerce até páginas de venda de cursos, serviços, produtos físicos e mentorias." },
      { language: "es", title: "Creación de Sitios Web y Landing Pages", description: "Mi equipo y yo desarrollamos sitios web y landing pages optimizadas para conversión. Desde e-commerce hasta páginas de venta de cursos, servicios, productos físicos y mentorías." }
    ]
  },
  {
    id: "70d2a531-5773-426d-af6f-631fd26333a8",
    imageUrl: "https://res.cloudinary.com/rljreiqm/image/upload/v1783898132/projects/proj-70d2a531-5773-426d-af6f-631fd26333a8.png",
    link: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    translations: [
      { language: "pt", title: "Automações Inteligentes", description: "Implementação de funis automatizados (e-mail, WhatsApp) para manter o cliente engajado e aumentar o valor da vida útil. Assim como para facilitar sua gestão da empresa." },
      { language: "es", title: "Automatizaciones Inteligentes", description: "Implementación de embudos automatizados (correo electrónico, WhatsApp) para mantener al cliente comprometido y aumentar el valor del ciclo de vida. Así como para facilitar la gestión de su empresa." }
    ]
  },
  {
    id: "50cd83ec-824e-4a9b-af4d-1cd2e959f903",
    imageUrl: "https://res.cloudinary.com/rljreiqm/image/upload/v1783898161/projects/proj-50cd83ec-824e-4a9b-af4d-1cd2e959f903.png",
    link: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    translations: [
      { language: "pt", title: "Gestão de Social Media", description: "Estratégia de conteúdo, posicionamento de marca e gestão de redes sociais para criar audiência qualificada. Funciona para qualquer tipo de negócio." },
      { language: "es", title: "Gestión de Social Media", description: "Estrategia de contenido, posicionamiento de marca y gestión de redes sociales para crear una audiencia calificada. Funciona para cualquier tipo de negocio." }
    ]
  },
  {
    id: "01f5ca36-2997-42a7-81e1-84ccf81e3593",
    imageUrl: "https://res.cloudinary.com/rljreiqm/image/upload/v1783898200/projects/proj-01f5ca36-2997-42a7-81e1-84ccf81e3593.png",
    link: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    translations: [
      { language: "pt", title: "Lançamentos Digitais", description: "Criação e estruturação de lançamentos para infoprodutos, cursos, mentorias e produtos digitais. Desde a criação, captação de leads até a venda, incluindo estratégia de precificação e posicionamento." },
      { language: "es", title: "Lanzamientos Digitales", description: "Creación y estructuración de lanzamientos para infoproductos, cursos, mentorías y productos digitales. Desde la creación, captación de leads hasta la venta, incluyendo estrategia de precios y posicionamiento." }
    ]
  },
  {
    id: "1832fde2-98c0-406e-9a17-a8d0974a5021",
    imageUrl: "https://res.cloudinary.com/rljreiqm/image/upload/v1783898232/projects/proj-1832fde2-98c0-406e-9a17-a8d0974a5021.png",
    link: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    translations: [
      { language: "pt", title: "Consultoria Estratégica", description: "Diagnóstico e plano de ação para empresas que precisam estruturar ou otimizar sua estratégia de vendas. Desde estruturação de produto até estratégia de lançamento." },
      { language: "es", title: "Consultoría Estratégica", description: "Diagnóstico y plan de acción para empresas que necesitan estructurar u optimizar su estrategia de ventas. Desde la estructuración del producto hasta la estrategia de lanzamiento." }
    ]
  }
];

async function seed() {
  console.log('🌱 Starting seed process...');

  try {
    console.log('🧹 Limpando banco de dados (apagando os antigos)...');
    await db.delete(serviceTranslations);
    await db.delete(services);

    console.log('📝 Inserindo os 6 novos serviços (PT e ES)...');
    for (const data of servicesData) {
      await db.insert(services)
        .values({
          id: data.id,
          imageUrl: data.imageUrl,
          link: data.link,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });

      for (const t of data.translations) {
        await db.insert(serviceTranslations)
          .values({
            serviceId: data.id,
            language: t.language,
            title: t.title,
            description: t.description,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
      }
      console.log(`✅ Synced service: ${data.translations[0].title}`);
    }

    console.log('\n🚀 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error during seed:', error);
  } finally {
    process.exit(0);
  }
}

seed();
