import { zodResolver } from '@hookform/resolvers/zod';
import { settingsSchema } from '../../../src/schemas/settings.schema';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsService } from '@/services/settingsService';
import { UploadService } from '@/services/uploadService';

import { useImagePreview } from '@/hooks/useImagePreview';

import { useForm } from 'react-hook-form';

import type { GlobalSettings, Settings } from '@/typings/Settings';

import toast from 'react-hot-toast';

const initialForm: Settings = {
  theme: 'system',
  panelLanguage: 'en',
  siteUrl: '',
  publicEmail: '',
  logoUrl: '',
  customConfig: {}
};

export function useSettings(options?: { fetchOnMount?: boolean }) {
  const { t } = useTranslation();

  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(!!options?.fetchOnMount);
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
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialForm
  });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SettingsService.get();

      const parsedData = {
        theme: data.theme ?? 'system',
        panelLanguage: data.panelLanguage ?? 'en',
        customConfig: data.customConfig ?? {},
        siteUrl: data.siteUrl ?? '',
        publicEmail: data.publicEmail ?? '',
        logoUrl: data.logoUrl ?? '',
      };

      setSettings(data);
      reset(parsedData);
      setImagePreview(parsedData.logoUrl ?? null);

      return parsedData;
    } catch (error) {
      const err = error as ApiError;
      setGlobalError(err.error ? t(err.error) : t('api.error.unknown', { defaultValue: 'Unknown error' }));
      return null;
    } finally {
      setLoading(false);
    }
  }, [reset, setImagePreview, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (options?.fetchOnMount) loadSettings();

  }, [options?.fetchOnMount, loadSettings]);

  const processFormSubmit = async (data: Settings, onSuccess?: (updated: Settings) => void) => {
    setGlobalError(null);
    try {
      let finalLogoUrl = imagePreview || '';

      if (selectedFile) {
        finalLogoUrl = await UploadService.uploadImage(selectedFile, 'settings', 'panel-logo');
      }

      const payload = {
        ...data,
        logoUrl: finalLogoUrl,
        customConfig: typeof data.customConfig === 'string'
          ? JSON.parse(data.customConfig || '{}')
          : data.customConfig,
      };

      const updatedSettings = await SettingsService.update(payload);

      const settedSettings = {
        theme: updatedSettings.theme ?? 'system',
        panelLanguage: updatedSettings.panelLanguage ?? 'en',
        customConfig: updatedSettings.customConfig ?? {},
        siteUrl: updatedSettings.siteUrl ?? '',
        publicEmail: updatedSettings.publicEmail ?? '',
        logoUrl: updatedSettings.logoUrl ?? '',
      };

      setSettings((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          ...updatedSettings,
          id: prev.id,
          aiKeys: prev.aiKeys
        };
      });

      reset(settedSettings);
      setSelectedFile(null);
      setImagePreview(settedSettings.logoUrl ?? null);

      if (onSuccess) onSuccess(updatedSettings);
      toast.success(t('hooks.use_settings.messages.update_success', { defaultValue: 'Settings updated successfully' }));

    } catch (error) {
      const err = error as ApiError;
      setGlobalError(err.message || t('settings.error.update'));

      toast.error(t('hooks.use_settings.messages.update_error', { defaultValue: 'Error updating settings' }));
    }
  };

  const updateSettings = (onSuccess?: (updated: Settings) => void) =>
    handleSubmit(
      (data) => processFormSubmit(data, onSuccess),
      (validationErrors) => console.error('❌ Zod barrou o formulário de configurações:', validationErrors)
    );

  return {
    settings,
    loading,
    isSubmitting,
    loadSettings,
    updateSettings,
    setImagePreview,

    handleFileChange,
    register,
    reset,
    globalError,
    errors,

    imagePreview
  };
}
