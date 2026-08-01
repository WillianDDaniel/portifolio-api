import { useTranslation } from 'react-i18next';

import { type UseFormRegister, type FieldErrors, type Control } from 'react-hook-form';
import type { NewBlogPost } from '@/typings/BlogPosts';

import GlobalError from '@/components/GlobalError';

import BlogPostGeneralSettings from '@/components/BlogPostGeneralSettings';
import BlogPostTaxonomies from '@/components/BlogPostTaxonomies';
import BlogPostTranslationItem from '@/components/BlogPostTranslationItem';

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
  generateTableOfContents: (index: number) => void;
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
      <GlobalError error={globalError} message={''} />

      <BlogPostGeneralSettings imagePreview={imagePreview}
        handleFileChange={handleFileChange} register={register} errors={errors}
      />

      <BlogPostTaxonomies control={control} errors={errors} />

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
          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-xl text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium flex justify-center items-center gap-2"
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
