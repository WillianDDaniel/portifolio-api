import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AiProviderService } from '@/services/aiProvidersService';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { aiProviderSchema } from '../../../src/schemas/ai-providers.schema';

import type { AIProvider } from '@/typings/AiProvider';

import toast from 'react-hot-toast';

const initialForm: AIProvider = {
  name: '',
  provider: 'openai',
  key: '',
  isActive: false
};

export function useAiProviders() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<AIProvider>({
    resolver: zodResolver(aiProviderSchema),
    defaultValues: initialForm
  });

  const deleteAiProvider = async (id?: string, onSuccess?: () => void) => {
    if (!id) return;
    if (!window.confirm(t('hooks.use_ai_providers.messages.confirm_delete', { defaultValue: 'Tem certeza que deseja excluir?' }))) return;

    setLoading(true);
    try {
      await AiProviderService.delete(id);
      if (onSuccess) onSuccess();
      toast.success(t('hooks.use_ai_providers.messages.delete_success', { defaultValue: 'Provedor de IA excluido com sucesso' }));
    } catch (error) {
      const err = error as ApiError;
      console.error(err);
      toast.error(t('hooks.use_ai_providers.messages.delete_error', { defaultValue: 'Ocorreu um erro ao excluir o provedor de IA' }));
    } finally {
      setLoading(false);
    }
  };

  const processFormSubmit = async (data: AIProvider, id?: string, onSuccess?: () => void) => {
    setGlobalError(null);
    try {
      const { ...payload } = data;

      if (id) {
        await AiProviderService.update(id, payload);
        toast.success(t('hooks.use_ai_providers.messages.update_success', { defaultValue: 'Provedor de IA atualizado com sucesso' }));
      } else {
        await AiProviderService.create(payload);
        toast.success(t('hooks.use_ai_providers.messages.create_success', { defaultValue: 'Provedor de IA criado com sucesso' }));
      }

      reset(initialForm);
      if (onSuccess) onSuccess();
    } catch (error) {
      const err = error as ApiError;
      const errorKey = err.error;
      setGlobalError(errorKey ? t(errorKey) : t('api.error.unknown', { defaultValue: 'Erro desconhecido' }));
      toast.error(t('hooks.use_ai_providers.messages.save_error', { defaultValue: 'Ocorreu um erro ao salvar o provedor de IA' }));
    }
  };

  const createAiProvider = (onSuccess?: () => void) =>
    handleSubmit((data) => processFormSubmit(data, undefined, onSuccess));

  const updateAiProvider = (id: string, onSuccess?: () => void) =>
    handleSubmit(
      (data) => processFormSubmit(data, id, onSuccess)
    );

  return {
    loading,
    globalError,
    deleteAiProvider,
    createAiProvider,
    updateAiProvider,

    register,
    errors,
    isSubmitting,
    reset
  };
}
