import React from 'react';
import { type UseFormRegister, type FieldErrors } from 'react-hook-form';
import type { NewBlogPost } from '@/typings/BlogPosts';

import { useTranslation } from 'react-i18next';

import ImageSelector from '@/components/ImageSelector';
import FormError from '@/components/FormError';
import Input from '@/components/Input';
import Select from '@/components/Select';

interface BlogPostGeneralSettingsProps {
  imagePreview: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  register: UseFormRegister<NewBlogPost>;
  errors: FieldErrors<NewBlogPost>;
}

export default function BlogPostGeneralSettings({
  imagePreview,
  handleFileChange,
  register,
  errors
}: BlogPostGeneralSettingsProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4 border-b border-gray-100 dark:border-zinc-700 pb-2">
        {t('pages.blog_posts.create.sections.general_settings', { defaultValue: 'General Settings' })}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div>
          <ImageSelector
            imagePreview={imagePreview}
            onFileChange={handleFileChange}
            label={t('forms.blog_posts.labels.cover_image', { defaultValue: 'Cover Image' })}
          />
          <FormError error={!!errors.coverImageUrl} message={t(errors.coverImageUrl?.message as string)} />
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select
                id="status"
                label={t('forms.blog_posts.labels.status', { defaultValue: 'Status' })}
                options={['draft', 'scheduled', 'published', 'archived']}
                translationGroup="forms.blog_posts.status"
                {...register('status')}
              />
              <FormError error={!!errors.status} message={t(errors.status?.message as string)} />
            </div>

            <div className="flex-1">
              <Input
                id="publishedAt"
                type="datetime-local"
                label={t('forms.blog_posts.labels.published_at', { defaultValue: 'Publish Date (Optional)' })}
                {...register('publishedAt')}
              />
              <FormError error={!!errors.publishedAt} message={t(errors.publishedAt?.message as string)} />
            </div>
          </div>

          <div className="flex items-start bg-gray-50 dark:bg-zinc-900/50 p-5 rounded-lg border border-gray-100 dark:border-zinc-700">
            <div className="flex items-center h-5 mt-1">
              <input
                id="isFeatured"
                type="checkbox"
                {...register('isFeatured')}
                className="w-5 h-5 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-zinc-800 dark:border-zinc-600"
              />
            </div>
            <div className="ml-4">
              <label htmlFor="isFeatured" className="font-semibold text-gray-900 dark:text-zinc-100 text-base">
                {t('forms.blog_posts.labels.is_featured', { defaultValue: 'Featured Post' })}
              </label>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                {t('forms.blog_posts.labels.featured_help', { defaultValue: 'Highlight this post on the blog homepage.' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
