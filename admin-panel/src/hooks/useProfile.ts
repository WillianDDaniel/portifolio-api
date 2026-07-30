import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/contexts/AuthContext';
import { UploadService } from '@/services/uploadService';
import { UserService } from '@/services/userService';
import { useImagePreview } from '@/hooks/useImagePreview';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, passwordFormSchema } from '../../../src/schemas/users.schema';

import type { ChangePassword, Profile } from '@/typings/Profile';

import toast from 'react-hot-toast';

export function useProfile() {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();

  const {
    imagePreview, setImagePreview,
    selectedFile, setSelectedFile,
    handleFileChange
  } = useImagePreview();

  const [loading, setLoading] = useState<boolean>(true);

  const [globalErrorProfile, setGlobalErrorProfile] = useState<string | null>(null);
  const [globalErrorPassword, setGlobalErrorPassword] = useState<string | null>(null);
  const [successProfile, setSuccessProfile] = useState<boolean>(false);
  const [successPassword, setSuccessPassword] = useState<boolean>(false);

  const profileForm = useForm<Profile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: '', email: '' }
  });

  const passwordForm = useForm<ChangePassword>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' }
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        email: user.email || '',
      });
      setImagePreview(user.avatarUrl || null);

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, [user, profileForm, setImagePreview]);

  const processProfileSubmit = async (data: Profile) => {
    setGlobalErrorProfile(null);
    setSuccessProfile(false);

    try {
      let finalAvatarUrl = user?.avatarUrl;

      if (selectedFile) {
        finalAvatarUrl = await UploadService.uploadImage(selectedFile, 'users', `avatar-${user?.name}`);
      }

      const payload = {
        ...data,
        avatarUrl: finalAvatarUrl || undefined
      };

      const updatedUser = await UserService.updateProfile(payload);

      setUser(updatedUser);
      setSuccessProfile(true);
      setSelectedFile(null);

      toast.success(t('hooks.use_profile.messages.update_profile_success', { defaultValue: 'Profile updated successfully' }));
    } catch (error) {
      const err = error as ApiError;
      const errorKey = err.error || err.message;
      setGlobalErrorProfile(errorKey ? t(errorKey) : t('api.error.unknown', { defaultValue: 'Unknown error' }));

      toast.error(t('hooks.use_profile.messages.update_profile_error', { defaultValue: 'Error updating profile' }));
    }
  };

  const processPasswordSubmit = async (data: ChangePassword) => {
    setGlobalErrorPassword(null);
    setSuccessPassword(false);

    try {
      await UserService.updatePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });

      setSuccessPassword(true);
      passwordForm.reset();

      toast.success(t('hooks.use_profile.messages.update_password_success', { defaultValue: 'Password updated successfully' }));
    } catch (error) {
      const err = error as ApiError;
      const errorKey = err.error || err.message;
      setGlobalErrorPassword(errorKey ? t(errorKey) : t('api.error.unknown', { defaultValue: 'Unknown error' }));

      toast.error(t('hooks.use_profile.messages.update_password_error', { defaultValue: 'Error updating password' }));
    }
  };

  return {
    profileRegister: profileForm.register,
    profileErrors: profileForm.formState.errors,
    isSubmittingProfile: profileForm.formState.isSubmitting,
    updateProfileSubmit: profileForm.handleSubmit(processProfileSubmit),
    globalErrorProfile,
    successProfile,

    passwordRegister: passwordForm.register,
    passwordErrors: passwordForm.formState.errors,
    isSubmittingPassword: passwordForm.formState.isSubmitting,
    updatePasswordSubmit: passwordForm.handleSubmit(processPasswordSubmit),
    globalErrorPassword,
    successPassword,

    imagePreview,
    handleFileChange,
    loading,
  };
}
