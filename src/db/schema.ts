import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
  unique,
  jsonb,
  date,
  pgEnum,
  primaryKey
} from 'drizzle-orm/pg-core';

import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
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
  language: text('language').notNull(),
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

export const education = pgTable('education', {
  id: uuid('id').defaultRandom().primaryKey(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  type: text('type').$type<'college' | 'course' | 'certification' | 'bootcamp'>().notNull(),
  durationHours: integer('duration_hours'),
  imageUrl: text('image_url'),
  certificateUrl: text('certificate_url'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const educationTranslations = pgTable('education_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  educationId: uuid('education_id')
    .notNull()
    .references(() => education.id, { onDelete: 'cascade' }),
  language: text('language').notNull(), // 'pt', 'en'
  name: text('name').notNull(),
  institution: text('institution').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const educationRelations = relations(education, ({ many }) => ({
  translations: many(educationTranslations),
}));

export const educationTranslationRelations = relations(educationTranslations, ({ one }) => ({
  education: one(education, {
    fields: [educationTranslations.educationId],
    references: [education.id],
  }),
}));

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  link: text('link'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const serviceTranslations = pgTable('service_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
  language: text('language').notNull(), // 'pt', 'en'
  title: text('title').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const serviceRelations = relations(services, ({ many }) => ({
  translations: many(serviceTranslations),
}));

export const serviceTranslationRelations = relations(serviceTranslations, ({ one }) => ({
  service: one(services, {
    fields: [serviceTranslations.serviceId],
    references: [services.id],
  }),
}));

export const settings = pgTable('settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  theme: text('theme').$type<'light' | 'dark' | 'system'>().default('system').notNull(),
  panelLanguage: text('panel_language').default('en').notNull(),
  siteUrl: text('site_url'),
  publicEmail: text('public_email'),
  logoUrl: text('logo_url'),
  customConfig: jsonb('custom_config').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const postStatusEnum = pgEnum('post_status', ['draft', 'scheduled', 'published', 'archived']);

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').defaultRandom().primaryKey(),

  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),

  coverImageUrl: text('cover_image_url'),
  ogImageUrl: text('og_image_url'),

  status: postStatusEnum('status').default('draft').notNull(),
  publishedAt: timestamp('published_at'),
  isFeatured: boolean('is_featured').default(false).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const blogPostTranslations = pgTable('blog_post_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id')
    .notNull()
    .references(() => blogPosts.id, { onDelete: 'cascade' }),

  language: text('language').notNull(),
  slug: text('slug').notNull(),

  title: text('title').notNull(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),

  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  unqSlugLang: unique('unq_slug_lang').on(table.language, table.slug),
}));

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categoryTranslations = pgTable('category_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  language: text('language').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
}, (table) => ({
  unqCategorySlugLang: unique('unq_category_slug_lang').on(table.language, table.slug),
}));

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tagTranslations = pgTable('tag_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  language: text('language').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
}, (table) => ({
  unqTagSlugLang: unique('unq_tag_slug_lang').on(table.language, table.slug),
}));

export const blogPostsToCategories = pgTable('blog_posts_to_categories', {
  postId: uuid('post_id')
    .notNull()
    .references(() => blogPosts.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.postId, t.categoryId] })
]);

export const blogPostsToTags = pgTable('blog_posts_to_tags', {
  postId: uuid('post_id')
    .notNull()
    .references(() => blogPosts.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.postId, t.tagId] })
]);

export const usersRelations = relations(users, ({ many }) => ({
  blogPosts: many(blogPosts),
}));

export const blogPostRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  translations: many(blogPostTranslations),
  categories: many(blogPostsToCategories),
  tags: many(blogPostsToTags),
}));

export const blogPostTranslationRelations = relations(blogPostTranslations, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostTranslations.postId],
    references: [blogPosts.id],
  }),
}));


export const categoryRelations = relations(categories, ({ many }) => ({
  translations: many(categoryTranslations),
}));

export const categoryTranslationRelations = relations(categoryTranslations, ({ one }) => ({
  category: one(categories, {
    fields: [categoryTranslations.categoryId],
    references: [categories.id],
  }),
}));

export const tagRelations = relations(tags, ({ many }) => ({
  translations: many(tagTranslations),
}));

export const tagTranslationRelations = relations(tagTranslations, ({ one }) => ({
  tag: one(tags, {
    fields: [tagTranslations.tagId],
    references: [tags.id],
  }),
}));

export const blogPostsToCategoriesRelations = relations(blogPostsToCategories, ({ one }) => ({
  post: one(blogPosts, { fields: [blogPostsToCategories.postId], references: [blogPosts.id] }),
  category: one(categories, { fields: [blogPostsToCategories.categoryId], references: [categories.id] }),
}));

export const blogPostsToTagsRelations = relations(blogPostsToTags, ({ one }) => ({
  post: one(blogPosts, { fields: [blogPostsToTags.postId], references: [blogPosts.id] }),
  tag: one(tags, { fields: [blogPostsToTags.tagId], references: [tags.id] }),
}));


export const aiProviders = pgTable('ai_api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),

  settingsId: uuid('settings_id')
    .notNull()
    .references(() => settings.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  provider: text('provider').$type<'openai' | 'groq' | 'gemini'>().notNull(),
  key: text('key').notNull(),
  isActive: boolean('is_active').default(false).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const settingsRelations = relations(settings, ({ many }) => ({
  aiKeys: many(aiProviders),
}));

export const aiProvidersRelations = relations(aiProviders, ({ one }) => ({
  setting: one(settings, {
    fields: [aiProviders.settingsId],
    references: [settings.id],
  }),
}));

