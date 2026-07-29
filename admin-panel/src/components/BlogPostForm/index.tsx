import { useTranslation } from 'react-i18next';

import { type UseFormRegister, type FieldErrors, type Control } from 'react-hook-form';
import type { NewBlogPost } from '@/typings/BlogPosts';

import ImageSelector from '@/components/ImageSelector';
import BlogPostTranslationItem from '@/components/BlogPostTranslationItem';
import FormError from '@/components/FormError';

import SaveButton from '@/components/Buttons/SaveButton';

interface BlogPostFormProps {
  register: UseFormRegister<NewBlogPost>;
  control: Control<NewBlogPost>;
  errors: FieldErrors<NewBlogPost>;
  fields: Record<'id', string>[];
  appendTranslation: () => void;
  removeTranslation: (index: number) => void;
  imagePreview: string | null;
  isSubmitting: boolean;
  globalError: string | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitAction: (e?: React.BaseSyntheticEvent) => Promise<void>;
  generateAIContent: (prompt: string, index: number, providerId: string) => Promise<void>;
  isGenerating: boolean;
  isStylizing: boolean;
  stylizeAIContent: (index: number, providerId: string) => Promise<void>;
  generateTableOfContents: any
  handleSlugDebounce: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => void;
}

export default function BlogPostForm({
  register,
  control,
  errors,
  fields,
  appendTranslation,
  removeTranslation,
  imagePreview,
  isSubmitting,
  globalError,
  handleFileChange,
  onSubmitAction,
  generateAIContent,
  isGenerating,
  isStylizing,
  stylizeAIContent,
  generateTableOfContents,
  handleSlugDebounce,

}: BlogPostFormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmitAction} className="space-y-6">

      {globalError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 text-red-700 dark:text-red-400 rounded-lg">
          <p>{globalError}</p>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4 border-b border-gray-100 dark:border-zinc-700 pb-2">
          {t('pages.blog_posts.create.sections.general_settings', { defaultValue: 'General Settings' })}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

          <div>
            <ImageSelector
              imagePreview={imagePreview}
              onFileChange={handleFileChange}
              label={t('forms.blog_posts.labels.cover_image', { defaultValue: 'Cover Image' })}
            />
            <FormError error={!!errors.coverImageUrl} message={t(errors.coverImageUrl?.message as string)} />
          </div>

          <div className="flex items-start bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-lg border border-gray-100 dark:border-zinc-700">
            <div className="flex items-center h-5 mt-1">
              <input
                id="isPublished"
                type="checkbox"
                {...register('isPublished')}
                className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-zinc-800 dark:border-zinc-600"
              />
            </div>
            <div className="ml-4">
              <label htmlFor="isPublished" className="font-semibold text-gray-900 dark:text-zinc-100 text-base">
                {t('forms.blog_posts.labels.publish_now', { defaultValue: 'Publish immediately' })}
              </label>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                {t('forms.blog_posts.labels.publish_help', { defaultValue: 'If unchecked, it will be saved as a draft and hidden from the public.' })}
              </p>
            </div>
          </div>

        </div>
      </div>

      <div className="space-y-6">
        {fields.map((field, index) => (
          <BlogPostTranslationItem
            key={field.id}
            index={index}
            register={register}
            control={control}
            errors={errors}
            removeTranslation={removeTranslation}
            onGenerateAI={generateAIContent}
            isGenerating={isGenerating}
            isStylizing={isStylizing}
            onStylizeAI={stylizeAIContent}
            onGenerateTableOfContents={generateTableOfContents}
            handleSlugDebounce={handleSlugDebounce}
          />
        ))}

        <button
          type="button"
          onClick={appendTranslation}
          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium flex justify-center items-center gap-2"
        >
          <span>➕</span> {t('forms.blog_posts.buttons.add_translation', { defaultValue: 'Add Translation' })}
        </button>
      </div>

      <div className="flex justify-end mt-8">
        <SaveButton isSubmitting={isSubmitting} customLabel={t('forms.blog_posts.buttons.save_post', { defaultValue: 'Save post' })} />
      </div>
    </form>
  );
}
