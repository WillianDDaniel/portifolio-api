import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  loginAttempts: integer('login_attempts').default(0).notNull(),
  lockUntil: timestamp('lock_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  imageUrl: text('image_url'),
  liveUrl: text('live_url'),
  repoUrl: text('repo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectTranslations = pgTable('project_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  language: text('language').notNull(), // ex: 'pt', 'en'
  title: text('title').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectRelations = relations(projects, ({ many, one }) => ({
  translations: many(projectTranslations),
  githubStats: one(githubStats)
}));

export const projectTranslationRelations = relations(projectTranslations, ({ one }) => ({
  project: one(projects, {
    fields: [projectTranslations.projectId],
    references: [projects.id],
  }),
}));

export const githubStats = pgTable('github_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .unique()
    .references(() => projects.id, { onDelete: 'cascade' }),
  
  stars: integer('stars').default(0),
  languages: jsonb('languages').$type<string[]>().default([]),
  topics: jsonb('topics').$type<string[]>().default([]),
  
  syncedAt: timestamp('synced_at').defaultNow(),
});

export const githubStatsRelations = relations(githubStats, ({ one }) => ({
  project: one(projects, {
    fields: [githubStats.projectId],
    references: [projects.id],
  }),
}));
