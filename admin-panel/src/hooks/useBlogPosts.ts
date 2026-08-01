import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { BlogPostService } from '@/services/blogPostService';
import { UploadService } from '@/services/uploadService';

import { useImagePreview } from '@/hooks/useImagePreview';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { blogPostSchema } from '../../../src/schemas/blog-posts.schema';

import type { NewBlogPost, BlogPost } from '@/typings/BlogPosts';

import { injectTableOfContents } from '@/helpers/blogPostsHelpers'

import toast from 'react-hot-toast';

const initialForm: NewBlogPost = {
  coverImageUrl: '',
  ogImageUrl: '',
  status: 'draft',
  isFeatured: false,
  publishedAt: null,
  categoryIds: [],
  tagIds: [],
  translations: [{ language: 'pt', slug: '', title: '', excerpt: '', content: '', metaTitle: '', metaDescription: '' }]
};

export function useBlogPosts(options?: { fetchList?: boolean; editId?: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(!!options?.fetchList || !!options?.editId);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [slugConflicts, setSlugConflicts] = useState<Record<number, boolean>>({});
  const hasConflict = Object.values(slugConflicts).some(Boolean);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isStylizing, setIsStylizing] = useState(false);

  const {
    imagePreview,
    setImagePreview,
    selectedFile,
    setSelectedFile,
    handleFileChange
  } = useImagePreview();

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm<NewBlogPost>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: initialForm
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'translations'
  });

  const loadBlogPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await BlogPostService.getAll();
      setBlogPosts(data as BlogPost[]);
    } catch (error) {
      const err = error as ApiError;
      setGlobalError(err.error ? t(err.error) : t('api.error.unknown'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadBlogPostForEdit = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await BlogPostService.getById(id);

      const cleanTranslations = data.translations?.length
        ? data.translations.map((tData) => ({
          language: tData.language,
          slug: tData.slug,
          title: tData.title,
          excerpt: tData.excerpt,
          content: tData.content,
          metaTitle: tData.metaTitle || '',
          metaDescription: tData.metaDescription || ''
        }))
        : initialForm.translations;

      reset({
        coverImageUrl: data.coverImageUrl ?? '',
        ogImageUrl: data.ogImageUrl ?? '',
        status: data.status ?? 'draft',
        isFeatured: data.isFeatured ?? false,
        publishedAt: data.publishedAt ?? null,
        categoryIds: data.categories?.map(c => c.category.id) || [],
        tagIds: data.tags?.map(t => t.tag.id) || [],
        translations: cleanTranslations,
      });

      setImagePreview(data.coverImageUrl || null);
    } catch (error) {
      const err = error as ApiError;
      setGlobalError(err.error ? t(err.error) : t('api.error.unknown'));
    } finally {
      setLoading(false);
    }
  }, [reset, setImagePreview, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (options?.fetchList) loadBlogPosts();

    if (options?.editId) loadBlogPostForEdit(options.editId);
  }, [options?.fetchList, options?.editId, loadBlogPosts, loadBlogPostForEdit]);

  const deleteBlogPost = async (id: string) => {
    if (!window.confirm(t('blog_posts.action.confirm_delete'))) return;
    try {
      await BlogPostService.delete(id);
      setBlogPosts(prev => prev.filter(post => post.id !== id));
      toast.success(t('hooks.use_blog_posts.messages.delete_success', { defaultValue: 'Post deleted successfully' }));
    } catch (error) {
      const err = error as ApiError;
      console.error(err);
      toast.error(t('hooks.use_blog_posts.messages.delete_error', { defaultValue: 'Error deleting post' }));
    }
  };

  const processFormSubmit = async (data: NewBlogPost, id?: string) => {
    if (hasConflict) {
      Object.entries(slugConflicts).forEach(([index, isConflict]) => {
        if (isConflict) {
          const message = t('hooks.use_blog_posts.messages.slug_in_use', { defaultValue: 'Slug already in use' });
          setError(`translations.${index}.slug` as `translations.${number}.slug`, {
            type: 'manual',
            message: message
          });
        }
      });
      return;
    }

    setGlobalError(null);
    try {
      let finalImageUrl = imagePreview || '';

      if (selectedFile) {
        // eslint-disable-next-line react-hooks/purity
        const fileId = id || Date.now().toString();
        finalImageUrl = await UploadService.uploadImage(selectedFile, 'blog-posts', `post-${fileId}`);
      }

      const payload = { ...data, coverImageUrl: finalImageUrl };

      if (id) {
        await BlogPostService.update(id, payload);
        toast.success(t('hooks.use_blog_posts.messages.update_success', { defaultValue: 'Post updated successfully' }));
      } else {
        await BlogPostService.create(payload);
        toast.success(t('hooks.use_blog_posts.messages.create_success', { defaultValue: 'Post created successfully' }));
      }

      setSelectedFile(null);
      navigate('/blog-posts');
    } catch (error) {
      const err = error as ApiError;
      const errorKey = err.error;
      setGlobalError(errorKey ? t(errorKey) : t('api.error.unknown'));
      toast.error(t('hooks.use_blog_posts.messages.save_error', { defaultValue: 'Error saving post' }));
    }
  };

  const createBlogPost = handleSubmit((data) => processFormSubmit(data));
  const updateBlogPost = (id: string) => handleSubmit((data) => processFormSubmit(data, id));

  const generateAIContent = async (prompt: string, index: number, providerId: string) => {
    setIsGenerating(true);
    setGlobalError(null);

    try {
      const currentTitle = getValues(`translations.${index}.title` as `translations.${number}.title`);
      const currentExcerpt = getValues(`translations.${index}.excerpt` as `translations.${number}.excerpt`);
      const currentSlug = getValues(`translations.${index}.slug` as `translations.${number}.slug`);
      const currentLanguage = getValues(`translations.${index}.language` as `translations.${number}.language`) || 'en';

      const response = await BlogPostService.generate({
        providerId,
        prompt,
        postPartialData: {
          language: currentLanguage,
          title: currentTitle,
          excerpt: currentExcerpt,
          slug: currentSlug,
        }
      });

      if (!response.body) throw new Error('Stream não disponível');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let html = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        html += chunk;

        const cleanHtml = html.replace(/&nbsp;/g, ' ').replace(/\n+/g, '\n');

        setValue(`translations.${index}.content` as `translations.${number}.content`, cleanHtml, {
          shouldValidate: true,
          shouldDirty: true
        });
      }

      toast.success(t('hooks.use_blog_posts.messages.generate_success', { defaultValue: 'Content generated successfully' }));

    } catch (error) {
      const err = error as Error;
      setGlobalError(err.message || t('hooks.use_blog_posts.messages.generate_ai_fallback_error', { defaultValue: 'Error generating content' }));
      toast.error(t('hooks.use_blog_posts.messages.generate_error', { defaultValue: 'Error generating content' }));
    } finally {
      setIsGenerating(false);
    }
  };

  const stylizeAIContent = async (index: number, providerId: string) => {
    setIsStylizing(true);
    setGlobalError(null);

    try {
      const currentContent = getValues(`translations.${index}.content` as `translations.${number}.content`);
      const currentLanguage = getValues(`translations.${index}.language` as `translations.${number}.language`) || 'en';

      if (!currentContent || currentContent.trim() === '') {
        toast.error(t('hooks.use_blog_posts.messages.stylize_no_content', { defaultValue: 'No content to stylize' }));
        return;
      }

      const response = await BlogPostService.stylize({
        htmlContent: currentContent,
        language: currentLanguage,
        providerId
      });

      if (!response.body) throw new Error('Stream não disponível');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let newHtml = '';

      setValue(`translations.${index}.content` as `translations.${number}.content`, '', {
        shouldValidate: false
      });

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        newHtml += chunk;

        const cleanHtml = newHtml.replace(/&nbsp;/g, ' ').replace(/\n+/g, '\n');

        setValue(`translations.${index}.content` as `translations.${number}.content`, cleanHtml, {
          shouldValidate: true,
          shouldDirty: true
        });
      }

      toast.success(t('hooks.use_blog_posts.messages.stylize_success', { defaultValue: 'Content stylized successfully' }));

    } catch (error) {
      const err = error as Error;
      setGlobalError(err.message || t('hooks.use_blog_posts.messages.stylize_ai_fallback_error', { defaultValue: 'Error stylizing content' }));
      toast.error(t('hooks.use_blog_posts.messages.stylize_error', { defaultValue: 'Error stylizing content' }));
    } finally {
      setIsStylizing(false);
    }
  };

  const checkSlugAvailability = async (language: string, slug: string) => {
    if (!slug) return false;

    try {
      const response = await BlogPostService.checkSlug(language, slug, options?.editId);
      return response.exists;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const generateTableOfContents = (index: number) => {
    const currentContent = getValues(`translations.${index}.content` as `translations.${number}.content`);
    const currentLang = getValues(`translations.${index}.language` as `translations.${number}.language`);

    if (!currentContent) {
      toast.error(t('hooks.use_blog_posts.messages.toc_no_content', { defaultValue: 'No content to generate table of contents' }));
      return;
    }

    const label = t('forms.blog_posts.labels.toc_label', {
      defaultValue: 'Neste artigo:',
      lng: currentLang
    });

    try {
      const newHtml = injectTableOfContents(currentContent, label);

      setValue(`translations.${index}.content` as `translations.${number}.content`, newHtml, {
        shouldValidate: true,
        shouldDirty: true
      });

      toast.success(t('hooks.use_blog_posts.messages.toc_success', { defaultValue: 'Table of contents generated successfully' }));

    } catch (error: unknown) {

      if (error instanceof Error && error.message === 'INSUFFICIENT_HEADINGS') {
        toast.error(t('hooks.use_blog_posts.messages.toc_insufficient_headings', { defaultValue: 'Insufficient headings to generate table of contents' }));
      } else {
        toast.error(t('hooks.use_blog_posts.messages.toc_error', { defaultValue: 'Error generating table of contents' }));
        console.error(error);
      }
    }
  };

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSlugDebounce = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
    const currentSlug = e.target.value;
    const currentLang = getValues(`translations.${index}.language`);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      if (currentSlug) {
        const exists = await checkSlugAvailability(currentLang, currentSlug);

        if (exists) {
          setSlugConflicts(prev => ({ ...prev, [index]: true }));
          const message = t('hooks.use_blog_posts.messages.slug_in_use', { defaultValue: 'Slug already in use' })
          setError(`translations.${index}.slug`, {
            type: 'manual',
            message: message
          });
        } else {
          setSlugConflicts(prev => ({ ...prev, [index]: false }));
          clearErrors(`translations.${index}.slug`);
        }
      }
    }, 500);
  };

  return {
    blogPosts,
    loading,
    globalError,
    deleteBlogPost,
    createBlogPost,
    updateBlogPost,

    register,
    control,
    errors,
    isSubmitting,
    fields,
    appendTranslation: () => append({ language: 'en', slug: '', title: '', excerpt: '', content: '', metaTitle: '', metaDescription: '' }),
    removeTranslation: remove,

    imagePreview,
    handleFileChange,

    isGenerating,
    generateAIContent,

    isStylizing,
    stylizeAIContent,

    generateTableOfContents,

    checkSlugAvailability,
    handleSlugDebounce
  };
}
