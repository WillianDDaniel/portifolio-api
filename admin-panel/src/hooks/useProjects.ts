import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ProjectService } from '@/services/projectService';
import { UploadService } from '@/services/uploadService';

import { useImagePreview } from '@/hooks/useImagePreview';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { projectSchema } from '../../../src/schemas/projects.schema';
import type { NewProject, Project } from '@/typings/Projects';

import toast from 'react-hot-toast';

const initialForm: NewProject = {
  liveUrl: '',
  repoUrl: '',
  imageUrl: '',
  translations: [{ language: 'pt', title: '', description: '' }]
};

export function useProjects(options?: { fetchList?: boolean; editId?: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(!!options?.fetchList || !!options?.editId);
  const [globalError, setGlobalError] = useState<string | null>(null);

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
    formState: { errors, isSubmitting }
  } = useForm<NewProject>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialForm
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'translations'
  });

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ProjectService.getAll();
      setProjects(data);
    } catch (error) {
      const err = error as ApiError;
      const errorKey = err.error || err.message;
      setGlobalError(errorKey ? t(errorKey) : t('api.error.unknown', { defaultValue: 'Unknown error' }));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadProjectForEdit = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await ProjectService.getById(id);

      const cleanTranslations = data.translations?.length
        ? data.translations.map((tData) => ({
          language: tData.language,
          title: tData.title,
          description: tData.description
        }))
        : initialForm.translations;

      reset({
        liveUrl: data.liveUrl ?? '',
        repoUrl: data.repoUrl ?? '',
        imageUrl: data.imageUrl ?? '',
        translations: cleanTranslations,
      });

      setImagePreview(data.imageUrl || null);
    } catch (error) {
      const err = error as ApiError;
      const errorKey = err.error || err.message;
      setGlobalError(errorKey ? t(errorKey) : t('api.error.unknown', { defaultValue: 'Unknown error' }));
    } finally {
      setLoading(false);
    }
  }, [reset, setImagePreview, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (options?.fetchList) loadProjects();

    if (options?.editId) loadProjectForEdit(options.editId);
  }, [options?.fetchList, options?.editId, loadProjects, loadProjectForEdit]);

  const deleteProject = async (id: string) => {
    if (!window.confirm(t('hooks.use_projects.messages.confirm_delete', { defaultValue: 'Are you sure you want to delete this project?' }))) return;

    try {
      await ProjectService.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));

      toast.success(t('hooks.use_projects.messages.delete_success', { defaultValue: 'Project deleted successfully' }));
    } catch (error) {
      const err = error as ApiError;
      console.log(err);
      toast.error(t('hooks.use_projects.messages.delete_error', { defaultValue: 'Error deleting project' }));
    }
  };

  const processFormSubmit = async (data: NewProject, id?: string) => {
    setGlobalError(null);
    try {
      let finalImageUrl = imagePreview || '';

      if (selectedFile) {
        // eslint-disable-next-line react-hooks/purity
        const fileId = id || Date.now().toString();
        finalImageUrl = await UploadService.uploadImage(selectedFile, 'projects', `proj-${fileId}`);
      }

      const payload = { ...data, imageUrl: finalImageUrl };

      if (id) {
        await ProjectService.update(id, payload);
        toast.success(t('hooks.use_projects.messages.update_success', { defaultValue: 'Project updated successfully' }));
      } else {
        await ProjectService.create(payload);
        toast.success(t('hooks.use_projects.messages.create_success', { defaultValue: 'Project created successfully' }));
      }

      setSelectedFile(null);
      navigate('/projects');
    } catch (error) {
      const err = error as ApiError;

      const errorKey = err.error || err.message;
      setGlobalError(errorKey ? t(errorKey) : t('api.error.unknown', { defaultValue: 'Unknown error' }));

      toast.error(t('hooks.use_projects.messages.save_error', { defaultValue: 'Error saving project' }));
    }
  };

  const createProject = handleSubmit((data) => processFormSubmit(data));
  const updateProject = (id: string) => handleSubmit((data) => processFormSubmit(data, id));

  return {
    projects,
    loading,
    globalError,
    deleteProject,
    createProject,
    updateProject,

    register,
    errors,
    isSubmitting,
    fields,
    appendTranslation: () => append({ language: 'en', title: '', description: '' }),
    removeTranslation: remove,

    imagePreview,
    handleFileChange
  };
}
