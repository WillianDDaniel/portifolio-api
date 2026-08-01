import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { TagService } from '@/services/tagService';
import toast from 'react-hot-toast';

interface TaxonomyOption {
  id: string;
  name: string;
}

export function useTags() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const [tags, setTags] = useState<TaxonomyOption[]>([]);
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const formatTaxonomy = useCallback((item: any) => {
    const translation = item.translations?.find((tr: any) => tr.language === currentLang) || item.translations?.[0];
    return {
      id: item.id,
      name: translation ? translation.name : 'Unknown'
    };
  }, [currentLang]);

  const loadTags = useCallback(async () => {
    try {
      const data = await TagService.getAll();
      setTags(data.map(formatTaxonomy));
    } catch (error) {
      console.error(error);
    }
  }, [formatTaxonomy]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleCreateTag = async (translations: { language: string; name: string; slug: string }[]) => {
    setIsCreatingTag(true);
    try {
      const payload = { translations };
      const newTag = await TagService.create(payload);

      setTags(prev => [...prev, formatTaxonomy(newTag)]);
      toast.success(t('taxonomies.messages.tag_created', { defaultValue: 'Tag created' }));
      return newTag.id;
    } catch (error) {
      toast.error(t('taxonomies.messages.tag_error', { defaultValue: 'Error creating tag' }));
      return null;
    } finally {
      setIsCreatingTag(false);
    }
  };

  return {
    tags,
    isCreatingTag,
    handleCreateTag
  };
}
