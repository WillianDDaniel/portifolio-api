import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { type Control, type FieldErrors, Controller } from 'react-hook-form';

import type { NewBlogPost } from '@/typings/BlogPosts';
import { useTaxonomies } from '@/hooks/useTaxonomies';

import TaxonomySelector from '@/components/TaxonomySelector';
import TaxonomyCreateModal from '@/components/TaxonomyCreateModal';
import Heading from '@/components/Heading';

interface BlogPostTaxonomiesProps {
  control: Control<NewBlogPost>;
  errors: FieldErrors<NewBlogPost>;
}

export default function BlogPostTaxonomies({ control, errors }: BlogPostTaxonomiesProps) {
  const { t, i18n } = useTranslation();

  const { items: categories, isCreating: isCreatingCategory, handleCreate: handleCreateCategory } = useTaxonomies('category');
  const { items: tags, isCreating: isCreatingTag, handleCreate: handleCreateTag } = useTaxonomies('tag');

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'category' | 'tag';
  }>({
    isOpen: false,
    type: 'category'
  });

  const [formData, setFormData] = useState({ pt: '', en: '', es: '' });

  const activeFieldRef = useRef<{
    onChange: (val: string[]) => void;
    currentValue: string[];
  } | null>(null);

  const openCreateModal = (
    type: 'category' | 'tag',
    name: string,
    currentValue: string[],
    onChange: (val: string[]) => void
  ) => {
    const lang = i18n.language?.substring(0, 2) || 'en';

    setFormData({
      pt: lang === 'pt' ? name : '', en: lang === 'en' ? name : '', es: lang === 'es' ? name : '',
    });

    activeFieldRef.current = { onChange, currentValue };
    setModalState({ isOpen: true, type });
  };

  const closeCreateModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    setFormData({ pt: '', en: '', es: '' });
    activeFieldRef.current = null;
  };

  const handleConfirmCreation = async () => {
    const newId = modalState.type === 'category'
      ? await handleCreateCategory(formData)
      : await handleCreateTag(formData);

    if (newId && activeFieldRef.current) {
      activeFieldRef.current.onChange([...activeFieldRef.current.currentValue, newId]);
      closeCreateModal();
    }
  };

  const isSaving = isCreatingCategory || isCreatingTag;
  const isFormEmpty = !formData.en.trim() && !formData.pt.trim() && !formData.es.trim();

  return (
    <>
      <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl p-6 shadow-sm">

        <Heading level={3} icon='🏷️' title={t('forms.taxonomies.labels.taxonomies', { defaultValue: 'Taxonomies' })} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-6">
          <Controller
            name="categoryIds"
            control={control}
            render={({ field }) => (
              <TaxonomySelector
                label={t('forms.taxonomies.labels.categories', { defaultValue: 'Categories' })}
                placeholder={t('forms.taxonomies.placeholders.search_or_create_categories', { defaultValue: 'Search or create categories...' })}
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
                label={t('forms.taxonomies.labels.tags', { defaultValue: 'Tags' })}
                placeholder={t('forms.taxonomies.placeholders.search_or_create_tags', { defaultValue: 'Search or create tags...' })}
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
        <TaxonomyCreateModal
          closeCreateModal={closeCreateModal}
          handleConfirmCreation={handleConfirmCreation}
          isSaving={isSaving}
          isFormEmpty={isFormEmpty}
          formData={formData}
          setFormData={setFormData}
          modalState={modalState}
        />
      )}
    </>
  );
}
