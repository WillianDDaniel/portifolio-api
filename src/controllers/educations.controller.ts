import { Context } from 'hono';
import { db } from '../db/index.js';
import { education, educationTranslations } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const getEducations = async (c: Context) => {
  const result = await db.query.education.findMany({
    with: {
      translations: true,
    },
  });

  return c.json(result);
};

export const getEducationById = async (c: Context) => {
  const id = c.req.param('id');

  try {
    const record = await db.query.education.findFirst({
      where: eq(education.id, id),
      with: {
        translations: true,
      },
    });

    if (!record) {
      return c.json({ message: 'Registro de educação não encontrado' }, 404);
    }

    return c.json(record);
  } catch (error: any) {
    return c.json({ message: 'Erro ao procurar educação', error: error.message }, 500);
  }
};

export const createEducation = async (c: Context) => {
  try {
    const body = await c.req.json();
    const {
      type,
      startDate,
      endDate,
      durationHours,
      imageUrl,
      certificateUrl,
      status,
      translations
    } = body;

    const insertedEducation = await db.insert(education).values({
      type,
      startDate,
      endDate,
      durationHours,
      imageUrl,
      certificateUrl,
      status,
    }).returning();

    const eduRecord = insertedEducation[0];

    if (!eduRecord) {
      throw new Error('Falha ao inserir registro de educação no banco de dados.');
    }

    if (translations && Array.isArray(translations) && translations.length > 0) {
      const translationsWithId = translations.map((t: any) => ({
        educationId: eduRecord.id,
        language: t.language,
        institution: t.institution,
        name: t.name,
        description: t.description,
      }));

      await db.insert(educationTranslations).values(translationsWithId);
    }

    return c.json(eduRecord, 201);
  } catch (error: any) {
    console.error('ERRO AO CRIAR EDUCAÇÃO:', error);
    return c.json({
      message: 'Erro interno ao salvar educação',
      error: error.message
    }, 500);
  }
};

export const updateEducation = async (c: Context) => {
  const id = c.req.param('id');
  try {
    const body = await c.req.json();
    const {
      type,
      startDate,
      endDate,
      durationHours,
      imageUrl,
      certificateUrl,
      status,
      translations
    } = body;

    await db.update(education)
      .set({
        type,
        startDate,
        endDate,
        durationHours,
        imageUrl,
        certificateUrl,
        status,
        updatedAt: new Date()
      })
      .where(eq(education.id, id));

    if (translations && Array.isArray(translations)) {
      // Deleta as traduções antigas e insere as novas (estratégia simples de sync)
      await db.delete(educationTranslations).where(eq(educationTranslations.educationId, id));

      if (translations.length > 0) {
        const translationsWithId = translations.map((t: any) => ({
          educationId: id,
          language: t.language,
          institution: t.institution,
          name: t.name,
          description: t.description,
        }));
        await db.insert(educationTranslations).values(translationsWithId);
      }
    }

    return c.json({ message: 'Educação atualizada com sucesso' });
  } catch (error: any) {
    console.error('ERRO AO ATUALIZAR EDUCAÇÃO:', error);
    return c.json({ message: 'Erro ao atualizar educação', error: error.message }, 500);
  }
};

export const deleteEducation = async (c: Context) => {
  const id = c.req.param('id');

  try {
    await db.delete(education).where(eq(education.id, id));
    return c.json({ message: 'Registro de educação removido com sucesso' });
  } catch (error: any) {
    return c.json({ message: 'Erro ao deletar educação', error: error.message }, 500);
  }
};
