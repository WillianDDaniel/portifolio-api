import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type UseFormRegister, type FieldErrors, type Control, Controller } from 'react-hook-form';
import type { NewBlogPost } from '@/typings/BlogPosts';

import Input from '@/components/Input';
import Select from '@/components/Select';
import FormError from '@/components/FormError';
import Textarea from '@/components/Textarea';
import RichTextEditor from '@/components/RichTextEditor';
import AiEditorHeader from '@/components/AiEditorHeader';

interface BlogPostTranslationItemProps {
  index: number;
  register: UseFormRegister<NewBlogPost>;
  control: Control<NewBlogPost>;
  errors: FieldErrors<NewBlogPost>;
  removeTranslation: (index: number) => void;
  onGenerateAI: (prompt: string, index: number, providerId: string) => Promise<void>;
  isGenerating: boolean;
  isStylizing: boolean;
  onStylizeAI: (index: number, providerId: string) => Promise<void>;
  onGenerateTableOfContents: (index: number) => void;
  handleSlugDebounce: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => void;
}

export default function BlogPostTranslationItem({
  index,
  register,
  control,
  errors,
  removeTranslation,
  onGenerateAI,
  isGenerating,
  handleSlugDebounce,
  isStylizing,
  onStylizeAI,
  onGenerateTableOfContents
}: BlogPostTranslationItemProps) {
  const { t } = useTranslation();
  const [aiPrompt, setAiPrompt] = useState('');

  return (
    <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl p-6 shadow-sm relative">
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-zinc-700 pb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
          🌐 {t('forms.blog_posts.labels.content', { defaultValue: 'Content' })} - {index + 1}
        </h3>
        {index > 0 && (
          <button
            type="button"
            aria-label={t('forms.blog_posts.buttons.delete_translation', { defaultValue: 'Delete translation' })}
            title={t('forms.blog_posts.buttons.delete_translation', { defaultValue: 'Delete translation' })}
            onClick={() => removeTranslation(index)}
            className="cursor-pointer text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4">
          <Select
            id={`translations-${index}-language`}
            label={t('forms.blog_posts.labels.language', { defaultValue: 'Language' })}
            options={['pt', 'en', 'es']}
            translationGroup="global.languages"
            {...register(`translations.${index}.language` as const)}
          />
          <FormError error={!!errors?.translations?.[index]?.language} message={t(errors?.translations?.[index]?.language?.message as string)} />
        </div>

        <div className="md:col-span-4">
          <Input
            id={`translations-${index}-title`}
            label={t('forms.blog_posts.labels.title', { defaultValue: 'Title' })}
            placeholder={t('forms.blog_posts.placeholders.title', { defaultValue: 'My Awesome Post' })}
            {...register(`translations.${index}.title` as const)}
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </Input>
          <FormError error={!!errors?.translations?.[index]?.title} message={t(errors?.translations?.[index]?.title?.message as string)} />
        </div>

        <div className="md:col-span-4">
          <Input
            id={`translations-${index}-slug`}
            label={t('forms.blog_posts.labels.slug', { defaultValue: 'URL Slug' })}
            placeholder={t('forms.blog_posts.placeholders.slug', { defaultValue: 'my-awesome-post' })}
            {...register(`translations.${index}.slug` as const)}
            onChange={(e) => {
              register(`translations.${index}.slug`).onChange(e);
              handleSlugDebounce(e, index);
            }}
          >
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          </Input>
          <FormError error={!!errors?.translations?.[index]?.slug} message={t(errors?.translations?.[index]?.slug?.message as string)} />
        </div>

        <div className="md:col-span-12">
          <Textarea
            id={`translations-${index}-excerpt`}
            label={t('forms.blog_posts.labels.excerpt', { defaultValue: 'Short Summary (SEO)' })}
            {...register(`translations.${index}.excerpt` as const)}
            rows={3}
            placeholder={t('forms.blog_posts.placeholders.excerpt', { defaultValue: 'A brief description of this post for list views and SEO...' })}
          />
          <FormError error={!!errors?.translations?.[index]?.excerpt} message={t(errors?.translations?.[index]?.excerpt?.message as string)} />
        </div>

        <div className="md:col-span-12 mt-4 flex flex-col">
          <AiEditorHeader
            index={index}
            aiPrompt={aiPrompt}
            setAiPrompt={setAiPrompt}
            isGenerating={isGenerating}
            onGenerateAI={onGenerateAI}
            isStylizing={isStylizing}
            onStylizeAI={onStylizeAI}
          />

          <div className={`${isStylizing ? 'opacity-50 pointer-events-none' : ''} transition-opacity duration-200`}>
            <Controller
              name={`translations.${index}.content`}
              control={control}
              render={({ field: { onChange, value } }) => (
                <RichTextEditor
                  value={value || ''}
                  onChange={onChange}
                  onGenerateTableOfContents={() => onGenerateTableOfContents(index)}
                />
              )}
            />
          </div>

          <FormError
            error={!!errors?.translations?.[index]?.content}
            message={t(errors?.translations?.[index]?.content?.message as string)}
          />
        </div>
      </div>
    </div>
  );
}
