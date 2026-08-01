import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Control, type FieldErrors, Controller } from 'react-hook-form';
import type { NewBlogPost } from '@/typings/BlogPosts';
import TaxonomySelector from '@/components/TaxonomySelector';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';

interface BlogPostTaxonomiesProps {
  control: Control<NewBlogPost>;
  errors: FieldErrors<NewBlogPost>;
}

export default function BlogPostTaxonomies({ control, errors }: BlogPostTaxonomiesProps) {
  const { t, i18n } = useTranslation();

  const { categories, isCreatingCategory, handleCreateCategory } = useCategories();
  const { tags, isCreatingTag, handleCreateTag } = useTags();

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'category' | 'tag';
    initialName: string;
    currentValue: string[];
    onChange: (val: string[]) => void;
  }>({
    isOpen: false,
    type: 'category',
    initialName: '',
    currentValue: [],
    onChange: () => { }
  });

  const [formData, setFormData] = useState({ pt: '', en: '', es: '' });

  const openCreateModal = (type: 'category' | 'tag', name: string, currentValue: string[], onChange: (val: string[]) => void) => {
    const lang = i18n.language?.substring(0, 2) || 'en';

    setFormData({
      pt: lang === 'pt' ? name : '',
      en: lang === 'en' ? name : '',
      es: lang === 'es' ? name : '',
    });

    setModalState({ isOpen: true, type, initialName: name, currentValue, onChange });
  };

  const closeCreateModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    setFormData({ pt: '', en: '', es: '' });
  };

  const handleConfirmCreation = async () => {
    const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const translations = [];
    if (formData.pt.trim()) translations.push({ language: 'pt', name: formData.pt.trim(), slug: slugify(formData.pt.trim()) });
    if (formData.en.trim()) translations.push({ language: 'en', name: formData.en.trim(), slug: slugify(formData.en.trim()) });
    if (formData.es.trim()) translations.push({ language: 'es', name: formData.es.trim(), slug: slugify(formData.es.trim()) });

    if (translations.length === 0) return;

    let newId = null;
    if (modalState.type === 'category') {
      newId = await handleCreateCategory(translations);
    } else {
      newId = await handleCreateTag(translations);
    }

    if (newId) {
      modalState.onChange([...modalState.currentValue, newId]);
      closeCreateModal();
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4 border-b border-gray-100 dark:border-zinc-700 pb-2 flex items-center gap-2">
          🏷️ {t('pages.blog_posts.create.sections.taxonomies', { defaultValue: 'Categories & Tags' })}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <Controller
            name="categoryIds"
            control={control}
            render={({ field }) => (
              <TaxonomySelector
                label={t('forms.blog_posts.labels.categories', { defaultValue: 'Categories' })}
                placeholder={t('forms.blog_posts.placeholders.categories', { defaultValue: 'Search or create categories...' })}
                options={categories}
                value={field.value || []}
                onChange={field.onChange}
                onCreateOption={(name) => openCreateModal('category', name, field.value || [], field.onChange)}
                isCreating={isCreatingCategory}
                error={errors.categoryIds?.message}
              />
            )}
          />

          <Controller
            name="tagIds"
            control={control}
            render={({ field }) => (
              <TaxonomySelector
                label={t('forms.blog_posts.labels.tags', { defaultValue: 'Tags' })}
                placeholder={t('forms.blog_posts.placeholders.tags', { defaultValue: 'Search or create tags...' })}
                options={tags}
                value={field.value || []}
                onChange={field.onChange}
                onCreateOption={(name) => openCreateModal('tag', name, field.value || [], field.onChange)}
                isCreating={isCreatingTag}
                error={errors.tagIds?.message}
              />
            )}
          />
        </div>
      </div>

      {modalState.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeCreateModal();
          }}
        >
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-gray-100 dark:border-zinc-700">
            <button
              type="button"
              onClick={closeCreateModal}
              className="absolute top-4 right-4 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-zinc-50 mb-6 pr-8">
                {modalState.type === 'category'
                  ? t('taxonomies.modal.title_category', { defaultValue: 'Create New Category' })
                  : t('taxonomies.modal.title_tag', { defaultValue: 'Create New Tag' })}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    🇺🇸 English
                  </label>
                  <input
                    type="text"
                    value={formData.en}
                    onChange={(e) => setFormData(prev => ({ ...prev, en: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-zinc-100"
                    placeholder="e.g. Technology"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    🇧🇷 Português
                  </label>
                  <input
                    type="text"
                    value={formData.pt}
                    onChange={(e) => setFormData(prev => ({ ...prev, pt: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-zinc-100"
                    placeholder="ex. Tecnologia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    🇪🇸 Español
                  </label>
                  <input
                    type="text"
                    value={formData.es}
                    onChange={(e) => setFormData(prev => ({ ...prev, es: e.target.value }))}
                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-zinc-100"
                    placeholder="ej. Tecnología"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  {t('global.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCreation}
                  disabled={isCreatingCategory || isCreatingTag || (!formData.en && !formData.pt && !formData.es)}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(isCreatingCategory || isCreatingTag) ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  {t('global.save', { defaultValue: 'Save' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
