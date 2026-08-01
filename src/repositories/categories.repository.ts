import { db } from '../db/index.js';
import { categories, categoryTranslations } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export const findAllCategories = async () => {
  return await db.query.categories.findMany({
    with: { translations: true },
    orderBy: (c, { desc }) => [desc(c.createdAt)]
  });
};

export const findCategoryBySlugAndLang = async (slug: string, language: string) => {
  return await db.query.categoryTranslations.findFirst({
    where: and(
      eq(categoryTranslations.slug, slug),
      eq(categoryTranslations.language, language)
    )
  });
};

export const createCategoryRecord = async (
  data: { translations: { language: string; name: string; slug: string }[] }
) => {

  return await db.transaction(async (tx) => {
    const [newCategory] = await tx.insert(categories).values({}).returning();

    if (data.translations && data.translations.length > 0) {
      await tx.insert(categoryTranslations).values(
        data.translations.map(t => ({
          categoryId: newCategory.id,
          language: t.language,
          name: t.name,
          slug: t.slug,
        }))
      );
    }

    return await tx.query.categories.findFirst({
      where: eq(categories.id, newCategory.id),
      with: { translations: true }
    });
  });
};
