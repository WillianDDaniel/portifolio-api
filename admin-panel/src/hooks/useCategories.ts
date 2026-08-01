import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CategoryService } from '@/services/categoryService';
import toast from 'react-hot-toast';

interface TaxonomyOption {
  id: string;
  name: string;
}

export function useCategories() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [categories, setCategories] = useState<TaxonomyOption[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const formatTaxonomy = useCallback((item: any) => {
    const translation = item.translations?.find((tr: any) => tr.language === currentLang) || item.translations?.[0];
    return {
      id: item.id,
      name: translation ? translation.name : 'Unknown'
    };
  }, [currentLang]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await CategoryService.getAll();
      setCategories(data.map(formatTaxonomy));
    } catch (error) {
      console.error(error);
    }
  }, [formatTaxonomy]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreateCategory = async (translations: { language: string; name: string; slug: string }[]) => {
    setIsCreatingCategory(true);
    try {
      const payload = { translations };
      const newCategory = await CategoryService.create(payload);

      setCategories(prev => [...prev, formatTaxonomy(newCategory)]);
      toast.success(t('taxonomies.messages.category_created', { defaultValue: 'Category created' }));
      return newCategory.id;
    } catch (error) {
      toast.error(t('taxonomies.messages.category_error', { defaultValue: 'Error creating category' }));
      return null;
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return {
    categories,
    isCreatingCategory,
    handleCreateCategory
  };
}
