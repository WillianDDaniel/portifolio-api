import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { educationSchema } from '../../../src/schemas/educations.schema';

import { EducationService } from '@/services/educationService';
import { UploadService } from '@/services/uploadService';
import { useImagePreview } from '@/hooks/useImagePreview';

import type { NewEducation, Education } from '@/typings/Educations';

import toast from 'react-hot-toast';

const initialForm: NewEducation = {
  type: 'college',
  status: 'completed',
  startDate: '',
  endDate: '',
  durationHours: undefined as unknown as number,
  certificateUrl: '',
  imageUrl: '',
  translations: [{ language: 'pt', institution: '', name: '', description: '' }]
};

export function useEducations(options?: { fetchList?: boolean; editId?: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [educations, setEducations] = useState<Education[]>([]);
  const [loading, setLoading] = useState<boolean>(!!options?.fetchList || !!options?.editId);
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
  } = useForm<NewEducation>({
    resolver: zodResolver(educationSchema) as never,
    defaultValues: initialForm
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'translations'
  });

  const loadEducations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await EducationService.getAll();
      setEducations(data);
    } catch (error) {
      const err = error as ApiError;
      const errorKey = err.error || err.message;
      setGlobalError(errorKey ? t(errorKey) : t('api.error.unknown'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadEducationForEdit = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await EducationService.getById(id);

      const cleanTranslations = data.translations?.length
        ? data.translations.map((tData) => ({
          language: tData.language,
          institution: tData.institution,
          name: tData.name,
          description: tData.description
        }))
        : initialForm.translations;

      reset({
        type: (data.type as NewEducation['type']) ?? 'college',
        status: (data.status as NewEducation['status']) ?? 'completed',
        startDate: data.startDate ? data.startDate.split('T')[0] : '',
        endDate: data.endDate ? data.endDate.split('T')[0] : '',

        durationHours: data.durationHours ? Number(data.durationHours) : undefined,

        certificateUrl: data.certificateUrl ?? '',
        imageUrl: data.imageUrl ?? '',
        translations: cleanTranslations,
      });

      setImagePreview(data.imageUrl || null);
    } catch (error) {
      const err = error as ApiError;
      const errorKey = err.error || err.message;
      setGlobalError(errorKey ? t(errorKey) : t('api.error.unknown'));
    } finally {
      setLoading(false);
    }
  }, [reset, setImagePreview, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (options?.fetchList) loadEducations();

    if (options?.editId) loadEducationForEdit(options.editId);
  }, [options?.fetchList, options?.editId, loadEducations, loadEducationForEdit]);

  const deleteEducation = async (id: string) => {
    if (!window.confirm(t('hooks.use_educations.messages.confirm_delete', { defaultValue: 'Are you sure you want to delete this education?' }))) return;

    try {
      await EducationService.delete(id);
      setEducations(prev => prev.filter(e => e.id !== id));
      toast.success(t('hooks.use_educations.messages.delete_success', { defaultValue: 'Education deleted successfully' }));
    } catch (error) {
      const err = error as ApiError;
      console.error(err);
      toast.error(t('hooks.use_educations.messages.delete_error', { defaultValue: 'Error deleting education' }));
    }
  };

  const processFormSubmit = async (data: NewEducation, id?: string) => {
    setGlobalError(null);
    try {
      if (!selectedFile && !imagePreview) {
        throw { error: 'educations.error.image_required', message: 'Image is required' };
      }

      let finalImageUrl = imagePreview || '';

      if (selectedFile) {
        // eslint-disable-next-line react-hooks/purity
        const fileId = id || Date.now().toString();
        finalImageUrl = await UploadService.uploadImage(selectedFile, 'educations', `edu-${fileId}`);
      }

      const payload = {
        ...data,
        durationHours: data.durationHours ? Number(data.durationHours) : undefined,
        endDate: data.endDate || undefined,
        certificateUrl: data.certificateUrl || undefined,
        imageUrl: finalImageUrl || undefined
      };

      if (id) {
        await EducationService.update(id, payload);
        toast.success(t('hooks.use_educations.messages.update_success', { defaultValue: 'Education updated successfully' }));
      } else {
        await EducationService.create(payload);
        toast.success(t('hooks.use_educations.messages.create_success', { defaultValue: 'Education created successfully' }));
      }

      setSelectedFile(null);
      navigate('/educations');
    } catch (error) {
      const err = error as ApiError;
      const errorKey = err.error || err.message;
      setGlobalError(errorKey ? t(errorKey) : t('api.error.unknown'));
      toast.error(t('hooks.use_educations.messages.save_error', { defaultValue: 'Error saving education' }));
    }
  };

  const createEducation = handleSubmit((data) => processFormSubmit(data));
  const updateEducation = (id: string) => handleSubmit((data) => processFormSubmit(data, id));

  return {
    educations,
    loading,
    globalError,
    deleteEducation,
    createEducation,
    updateEducation,

    register,
    errors,
    isSubmitting,
    fields,
    appendTranslation: () => append({ language: 'en', institution: '', name: '', description: '' }),
    removeTranslation: remove,

    imagePreview,
    handleFileChange
  };
}
