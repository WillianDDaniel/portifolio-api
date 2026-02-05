import { Context } from 'hono';
import { db } from '../db/index.js';
import { projects, projectTranslations } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const getProjects = async (c: Context) => {
  const result = await db.query.projects.findMany({
    with: {
      translations: true,
    },
  });
  
  return c.json(result);
};

export const createProject = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { imageUrl, liveUrl, repoUrl, translations } = body;

    // 1. Inserir o registo principal na tabela projects
    const insertedProjects = await db.insert(projects).values({
      imageUrl, // URL já enviada pelo teu frontend após o upload no Cloudinary
      liveUrl,
      repoUrl,
    }).returning();

    const project = insertedProjects[0];

    // Se o projecto não for devolvido, a inserção falhou
    if (!project) {
      throw new Error('Falha ao inserir o projecto principal no banco de dados.');
    }

    // 2. Inserir as traduções vinculadas ao ID do projecto criado
    if (translations && Array.isArray(translations) && translations.length > 0) {
      const translationsWithId = translations.map((t: any) => ({
        projectId: project.id,
        language: t.language,
        title: t.title,
        description: t.description,
      }));
      
      await db.insert(projectTranslations).values(translationsWithId);
    }

    // Retorna o projecto criado com status 201
    return c.json(project, 201);
  } catch (error: any) {
    console.error('ERRO AO CRIAR PROJECTO:', error);
    return c.json({ 
      message: 'Erro interno ao salvar projecto', 
      error: error.message 
    }, 500);
  }
};

export const updateProject = async (c: Context) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    const { imageUrl, liveUrl, repoUrl, translations } = body;

    // 1. Atualiza dados principais do projeto
    await db.update(projects)
      .set({ 
        imageUrl, 
        liveUrl, 
        repoUrl, 
        updatedAt: new Date() 
      })
      .where(eq(projects.id, id));

    // 2. Sincroniza as traduções sequencialmente
    if (translations && Array.isArray(translations)) {
      // Primeiro remove as traduções antigas deste projeto
      await db.delete(projectTranslations).where(eq(projectTranslations.projectId, id));
      
      // Se houver novas traduções no corpo da requisição, insere elas
      if (translations.length > 0) {
        const translationsWithId = translations.map((t: any) => ({
          projectId: id,
          language: t.language,
          title: t.title,
          description: t.description,
        }));
        await db.insert(projectTranslations).values(translationsWithId);
      }
    }

    return c.json({ message: 'Projeto atualizado com sucesso' });
  } catch (error: any) {
    console.error('ERRO AO ATUALIZAR PROJETO:', error);
    return c.json({ message: 'Erro ao atualizar projeto', error: error.message }, 500);
  }
};

export const deleteProject = async (c: Context) => {
  const id = c.req.param('id');
  
  await db.delete(projects).where(eq(projects.id, id));
  
  return c.json({ message: 'Projeto removido com sucesso' });
};

export const getProjectById = async (c: Context) => {
  const id = c.req.param('id');
  
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        translations: true,
      },
    });

    if (!project) {
      return c.json({ message: 'Projeto não encontrado' }, 404);
    }

    return c.json(project);
  } catch (error) {
    return c.json({ message: 'Erro ao procurar projeto', error }, 500);
  }
};