import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { CategoryService } from '@/services/categoryService';
import { TagService } from '@/services/tagService';

import { generateSlug } from '@/helpers/taxonomiesHelper';

import toast from 'react-hot-toast';

export function useTaxonomies(type: 'category' | 'tag') {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [items, setItems] = useState<TaxonomyOption[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const service = type === 'category' ? CategoryService : TagService;

  const formatTaxonomy = useCallback((item: TaxonomyItem) => {
    const translation = item.translations?.find((tr: TaxonomyTranslation) => tr.language === currentLang) || item.translations?.[0];

    return {
      id: item.id,
      name: translation ? translation.name : 'Unknown'
    };
  }, [currentLang]);

  const loadItems = useCallback(async () => {
    try {
      const data = await service.getAll();
      setItems(data.map(formatTaxonomy));
    } catch (error) {
      console.error(error);
    }
  }, [service, formatTaxonomy]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadItems();
  }, [loadItems]);

  const handleCreate = async (formData: TaxonomyFormData) => {
    setIsCreating(true);
    try {
      const translations: TaxonomyTranslation[] = [];

      if (formData.pt.trim()) translations.push({ language: 'pt', name: formData.pt.trim(), slug: generateSlug(formData.pt.trim()) });
      if (formData.en.trim()) translations.push({ language: 'en', name: formData.en.trim(), slug: generateSlug(formData.en.trim()) });
      if (formData.es.trim()) translations.push({ language: 'es', name: formData.es.trim(), slug: generateSlug(formData.es.trim()) });

      if (translations.length === 0) return null;

      const payload = { translations };
      const newItem = await service.create(payload);

      setItems(prev => [...prev, formatTaxonomy(newItem)]);

      const successMessage = type === 'category'
        ? t('hooks.use_taxonomies.messages.category_created', { defaultValue: 'Category created successfully' })
        : t('hooks.use_taxonomies.messages.tag_created', { defaultValue: 'Tag created successfully' });

      toast.success(successMessage);

      return newItem.id;
    } catch {
      const errorMessage = type === 'category'
        ? t('hooks.use_taxonomies.messages.category_error', { defaultValue: 'Error creating category' })
        : t('hooks.use_taxonomies.messages.tag_error', { defaultValue: 'Error creating tag' });

      toast.error(errorMessage);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    items,
    isCreating,
    handleCreate
  };
}
