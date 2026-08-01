import { db } from '../db/index.js';
import { tags, tagTranslations } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export const findAllTags = async () => {
  return await db.query.tags.findMany({
    with: { translations: true },
    orderBy: (t, { desc }) => [desc(t.createdAt)]
  });
};

export const findTagBySlugAndLang = async (slug: string, language: string) => {
  return await db.query.tagTranslations.findFirst({
    where: and(
      eq(tagTranslations.slug, slug),
      eq(tagTranslations.language, language)
    )
  });
};

export const createTagRecord = async (
  data: { translations: { language: string; name: string; slug: string }[] }
) => {

  return await db.transaction(async (tx) => {
    const [newTag] = await tx.insert(tags).values({}).returning();

    if (data.translations && data.translations.length > 0) {
      await tx.insert(tagTranslations).values(
        data.translations.map(t => ({
          tagId: newTag.id,
          language: t.language,
          name: t.name,
          slug: t.slug,
        }))
      );
    }

    return await tx.query.tags.findFirst({
      where: eq(tags.id, newTag.id),
      with: { translations: true }
    });
  });
};
