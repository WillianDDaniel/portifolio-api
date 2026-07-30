import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ServiceService } from '@/services/serviceService';
import { UploadService } from '@/services/uploadService';

import { useImagePreview } from '@/hooks/useImagePreview';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { serviceSchema } from '../../../src/schemas/services.schema';

import type { NewService, Service } from '@/typings/Services';

import toast from 'react-hot-toast';

const initialForm: NewService = {
  link: '',
  imageUrl: '',
  translations: [{ language: 'pt', title: '', description: '' }]
};

export function useServices(options?: { fetchList?: boolean; editId?: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [services, setServices] = useState<Service[]>([]);
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
  } = useForm<NewService>({
    resolver: zodResolver(serviceSchema),
    defaultValues: initialForm
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'translations'
  });

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ServiceService.getAll();
      setServices(data);
    } catch (error) {
      const err = error as ApiError;
      setGlobalError(err.error ? t(err.error) : t('api.error.unknown', { defaultValue: 'Unknown error' }));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadServiceForEdit = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await ServiceService.getById(id);

      const cleanTranslations = data.translations?.length
        ? data.translations.map((tData) => ({
          language: tData.language,
          title: tData.title,
          description: tData.description
        }))
        : initialForm.translations;

      reset({
        link: data.link ?? '',
        imageUrl: data.imageUrl ?? '',
        translations: cleanTranslations,
      });

      setImagePreview(data.imageUrl || null);
    } catch (error) {
      const err = error as ApiError;
      setGlobalError(err.error ? t(err.error) : t('api.error.unknown', { defaultValue: 'Unknown error' }));
    } finally {
      setLoading(false);
    }
  }, [reset, setImagePreview, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (options?.fetchList) loadServices();

    if (options?.editId) loadServiceForEdit(options.editId);
  }, [options?.fetchList, options?.editId, loadServices, loadServiceForEdit]);

  const deleteService = async (id: string) => {
    if (!window.confirm(t('hooks.use_services.messages.confirm_delete', { defaultValue: 'Are you sure you want to delete this service?' }))) return;
    try {
      await ServiceService.delete(id);
      setServices(prev => prev.filter(s => s.id !== id));

      toast.success(t('hooks.use_services.messages.delete_success', { defaultValue: 'Service deleted successfully' }));
    } catch (error) {
      const err = error as ApiError;
      console.error(err);

      toast.error(t('hooks.use_services.messages.delete_error', { defaultValue: 'Error deleting service' }));
    }
  };

  const processFormSubmit = async (data: NewService, id?: string) => {
    setGlobalError(null);
    console.log(data);
    try {
      let finalImageUrl = imagePreview || '';

      if (selectedFile) {
        // eslint-disable-next-line react-hooks/purity
        const fileId = id || Date.now().toString();

        finalImageUrl = await UploadService.uploadImage(selectedFile, 'services', `srv-${fileId}`);
      }

      const payload = { ...data, imageUrl: finalImageUrl };

      if (id) {
        await ServiceService.update(id, payload);
        toast.success(t('hooks.use_services.messages.update_success', { defaultValue: 'Service updated successfully' }));
      } else {
        await ServiceService.create(payload);
        toast.success(t('hooks.use_services.messages.create_success', { defaultValue: 'Service created successfully' }));
      }

      setSelectedFile(null);
      navigate('/services');
    } catch (error) {
      const err = error as ApiError;
      const errorKey = err.error;
      setGlobalError(errorKey ? t(errorKey) : t('api.error.unknown', { defaultValue: 'Unknown error' }));

      toast.error(t('hooks.use_services.messages.save_error', { defaultValue: 'Error saving service' }));
    }
  };

  const createService = handleSubmit((data) => processFormSubmit(data));
  const updateService = (id: string) => handleSubmit((data) => processFormSubmit(data, id));

  return {
    services,
    loading,
    globalError,
    deleteService,
    createService,
    updateService,

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
