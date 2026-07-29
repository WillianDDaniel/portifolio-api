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
  isPublished: false,
  translations: [{ language: 'pt', slug: '', title: '', excerpt: '', content: '' }]
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
          content: tData.content
        }))
        : initialForm.translations;

      reset({
        coverImageUrl: data.coverImageUrl ?? '',
        isPublished: data.isPublished ?? false,
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
      toast.success('Post excluido com sucesso');
    } catch (error) {
      const err = error as ApiError;
      console.error(err);
      toast.error('Ocorreu um erro ao excluir o post');
    }
  };

  const processFormSubmit = async (data: NewBlogPost, id?: string) => {
    if (hasConflict) {
      Object.entries(slugConflicts).forEach(([index, isConflict]) => {
        if (isConflict) {
          setError(`translations.${index}.slug` as `translations.${number}.slug`, {
            type: 'manual',
            message: 'Este slug já está em uso'
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
        toast.success('Post atualizado com sucesso');
      } else {
        await BlogPostService.create(payload);
        toast.success('Post criado com sucesso');
      }

      setSelectedFile(null);
      navigate('/blog-posts');
    } catch (error) {
      const err = error as ApiError;
      const errorKey = err.error;
      setGlobalError(errorKey ? t(errorKey) : t('api.error.unknown'));
      toast.error('Ocorreu um erro ao criar o post');
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

      toast.success('Conteúdo gerado com sucesso');

    } catch (error) {
      console.error("Erro na IA:", error);
      const err = error as Error;
      setGlobalError(err.message || 'Falha ao gerar conteúdo com IA');
      toast.error('Ocorreu um erro ao gerar o conteúdo');
    } finally {
      setIsGenerating(false);
    }
  };

  const stylizeAIContent = async (index: number, providerId: string) => {
    setIsStylizing(true);
    setGlobalError(null);

    try {
      // 1. Pega o conteúdo atual (cru) e o idioma
      const currentContent = getValues(`translations.${index}.content` as `translations.${number}.content`);
      const currentLanguage = getValues(`translations.${index}.language` as `translations.${number}.language`) || 'en';

      if (!currentContent || currentContent.trim() === '') {
        toast.error('Não há conteúdo para estilizar.');
        return;
      }

      // 2. Faz a chamada para a nossa nova rota
      const response = await BlogPostService.stylize({
        htmlContent: currentContent,
        language: currentLanguage,
        providerId
      });

      if (!response.body) throw new Error('Stream não disponível');

      // 3. Prepara para ler a resposta da IA e limpa o campo para a nova injeção
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let newHtml = '';

      setValue(`translations.${index}.content` as `translations.${number}.content`, '', {
        shouldValidate: false
      });

      // 4. Loop de leitura do stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        newHtml += chunk;

        // Limpeza básica para evitar bugs no editor
        const cleanHtml = newHtml.replace(/&nbsp;/g, ' ').replace(/\n+/g, '\n');

        // Atualiza o formulário (e a tela) em tempo real
        setValue(`translations.${index}.content` as `translations.${number}.content`, cleanHtml, {
          shouldValidate: true,
          shouldDirty: true
        });
      }

      toast.success('Conteúdo estilizado com sucesso!');

    } catch (error) {
      console.error("Erro ao estilizar com IA:", error);
      const err = error as Error;
      setGlobalError(err.message || 'Falha ao estilizar conteúdo com IA');
      toast.error('Ocorreu um erro ao estilizar o conteúdo');
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
      console.error("Erro ao checar slug:", error);
      return false;
    }
  };

  const generateTableOfContents = (index: number) => {
    const currentContent = getValues(`translations.${index}.content` as `translations.${number}.content`);
    const currentLang = getValues(`translations.${index}.language` as `translations.${number}.language`);

    if (!currentContent) {
      toast.error('Gere o conteúdo primeiro!');
      return;
    }

    let label = 'Neste artigo:';
    if (currentLang === 'en') label = 'In this article:';
    if (currentLang === 'es') label = 'En este artículo:';

    try {
      // Tenta injetar o sumário
      const newHtml = injectTableOfContents(currentContent, label);

      // Se passou, atualiza o formulário
      setValue(`translations.${index}.content` as `translations.${number}.content`, newHtml, {
        shouldValidate: true,
        shouldDirty: true
      });

      toast.success('Sumário gerado com sucesso!');

    } catch (error: any) {

      // 👇 Captura a nossa validação personalizada
      if (error.message === 'INSUFFICIENT_HEADINGS') {
        toast.error('O texto precisa ter pelo menos 3 subtítulos para gerar um sumário.');
      } else {
        toast.error('Ocorreu um erro ao gerar o sumário.');
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
          setError(`translations.${index}.slug`, {
            type: 'manual',
            message: 'Este slug já está em uso'
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
    appendTranslation: () => append({ language: 'en', slug: '', title: '', excerpt: '', content: '' }),
    removeTranslation: remove,

    imagePreview,
    handleFileChange,

    // AI Generation
    isGenerating,
    generateAIContent,

    // AI Stylization
    isStylizing,
    stylizeAIContent,

    // Table of Contents
    generateTableOfContents,

    // Utils
    checkSlugAvailability,
    handleSlugDebounce
  };
}
