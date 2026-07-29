import { describe, it, expect, vi } from 'vitest';

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    relations: (table: any, callback: any) => {
      const rel = actual.relations(table, callback);
      rel.__test_callback = callback;
      return rel;
    },
  };
});

import {
  users,
  projects,
  projectTranslations,
  projectRelations,
  projectTranslationRelations,
  githubStats,
  githubStatsRelations,
  education,
  educationTranslations,
  educationRelations,
  educationTranslationRelations,
  services,
  serviceTranslations,
  serviceRelations,
  serviceTranslationRelations,
  settings,
  settingsRelations,
  blogPosts,
  blogPostTranslations,
  blogPostRelations,
  blogPostTranslationRelations,
  aiProviders,
  aiProvidersRelations
} from '../../db/schema.js';

describe('Database Schema', () => {
  it('should define all schemas and tables correctly', () => {
    expect(users).toBeDefined();
    expect(projects).toBeDefined();
    expect(projectTranslations).toBeDefined();
    expect(githubStats).toBeDefined();
    expect(education).toBeDefined();
    expect(educationTranslations).toBeDefined();
    expect(services).toBeDefined();
    expect(serviceTranslations).toBeDefined();
    expect(settings).toBeDefined();
    expect(blogPosts).toBeDefined();
    expect(blogPostTranslations).toBeDefined();
    expect(aiProviders).toBeDefined();
  });

  it('should execute relation callbacks for coverage without initialization errors', () => {
    const relationExports = [
      projectRelations,
      projectTranslationRelations,
      githubStatsRelations,
      educationRelations,
      educationTranslationRelations,
      serviceRelations,
      serviceTranslationRelations,
      blogPostRelations,
      blogPostTranslationRelations,
      settingsRelations,
      aiProvidersRelations
    ];

    for (const rel of relationExports) {
      if ((rel as any).__test_callback) {
        (rel as any).__test_callback({ one: vi.fn(), many: vi.fn() });
      }
    }
  });

  it('should execute inline foreign keys callbacks to ensure coverage', () => {
    const tables = [
      projectTranslations,
      githubStats,
      educationTranslations,
      serviceTranslations,
      blogPostTranslations,
      aiProviders,
    ];

    for (const table of tables) {
      const symbols = Object.getOwnPropertySymbols(table);
      const fkSymbol = symbols.find(s => s.toString() === 'Symbol(drizzle:PgInlineForeignKeys)');

      expect(fkSymbol).toBeDefined();

      if (fkSymbol) {
        const foreignKeys = (table as any)[fkSymbol];
        expect(Array.isArray(foreignKeys)).toBe(true);
        expect(foreignKeys.length).toBeGreaterThan(0);

        for (const fk of foreignKeys) {
          expect(typeof fk.reference).toBe('function');
          const ref = fk.reference();
          expect(ref).toBeDefined();
          expect(ref.foreignColumns).toBeDefined();
        }
      }
    }
  });

  it('should execute table constraint callbacks (like unique indexes) to ensure coverage', () => {
    const symbols = Object.getOwnPropertySymbols(blogPostTranslations);
    let executedSuccessfully = false;

    for (const sym of symbols) {
      const internalProp = (blogPostTranslations as any)[sym];

      if (typeof internalProp === 'function') {
        try {
          const configResult = internalProp(blogPostTranslations);
          if (configResult && configResult.unqSlugLang) {
            executedSuccessfully = true;
            break;
          }
        } catch (e) {
          // Ignore
        }
      }
    }

    expect(executedSuccessfully).toBe(true);
  });
});
