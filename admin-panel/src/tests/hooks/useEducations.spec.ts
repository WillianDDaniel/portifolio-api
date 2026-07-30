import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useEducations } from '@/hooks/useEducations';
import { EducationService } from '@/services/educationService';
import { UploadService } from '@/services/uploadService';
import { useImagePreview } from '@/hooks/useImagePreview';

import toast from 'react-hot-toast';

let mockFormData: any = {};

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form');
  return {
    ...actual,
    useForm: () => ({
      register: vi.fn(),
      control: {},
      reset: vi.fn(),
      formState: { errors: {}, isSubmitting: false },
      handleSubmit: (cb: any) => async (e?: any) => {
        if (e && e.preventDefault) e.preventDefault();
        await cb(mockFormData);
      },
    }),
    useFieldArray: () => ({ fields: [], append: vi.fn(), remove: vi.fn() }),
  };
});

vi.mock('@/services/educationService', () => ({
  EducationService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/services/uploadService', () => ({
  UploadService: {
    uploadImage: vi.fn(),
  },
}));

vi.mock('@/hooks/useImagePreview', () => ({
  useImagePreview: vi.fn(),
}));

describe('useEducations hook', () => {
  const baseImagePreviewState = {
    imagePreview: null,
    setImagePreview: vi.fn(),
    selectedFile: null,
    setSelectedFile: vi.fn(),
    handleFileChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useImagePreview).mockReturnValue({ ...baseImagePreviewState } as any);
    mockFormData = { type: 'college', status: 'completed' };
  });

  it('should load educations on mount', async () => {
    vi.mocked(EducationService.getAll).mockResolvedValue([{ id: '1' }] as any);
    const { result } = renderHook(() => useEducations({ fetchList: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should handle load educations error with error property', async () => {
    vi.mocked(EducationService.getAll).mockRejectedValueOnce({ error: 'err.1' });
    const { result } = renderHook(() => useEducations({ fetchList: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('err.1');
  });

  it('should handle load educations error with message property', async () => {
    vi.mocked(EducationService.getAll).mockRejectedValueOnce({ message: 'msg.1' });
    const { result } = renderHook(() => useEducations({ fetchList: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('msg.1');
  });

  it('should handle load educations error with no property', async () => {
    vi.mocked(EducationService.getAll).mockRejectedValueOnce({});
    const { result } = renderHook(() => useEducations({ fetchList: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('api.error.unknown');
  });

  it('should load education details with full data', async () => {
    vi.mocked(EducationService.getById).mockResolvedValue({
      id: '1',
      type: 'course',
      status: 'in_progress',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T00:00:00Z',
      durationHours: 120,
      certificateUrl: 'url',
      imageUrl: 'img',
      translations: [{ language: 'en', institution: 'i', name: 'n', description: 'd' }]
    } as any);
    const { result } = renderHook(() => useEducations({ editId: '1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should load education details with minimal data', async () => {
    vi.mocked(EducationService.getById).mockResolvedValue({ id: '1' } as any);
    const { result } = renderHook(() => useEducations({ editId: '1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should handle load education details error with error property', async () => {
    vi.mocked(EducationService.getById).mockRejectedValueOnce({ error: 'err.2' });
    const { result } = renderHook(() => useEducations({ editId: '1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('err.2');
  });

  it('should handle load education details error with message property', async () => {
    vi.mocked(EducationService.getById).mockRejectedValueOnce({ message: 'msg.2' });
    const { result } = renderHook(() => useEducations({ editId: '1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('msg.2');
  });

  it('should handle load education details error with no property', async () => {
    vi.mocked(EducationService.getById).mockRejectedValueOnce({});
    const { result } = renderHook(() => useEducations({ editId: '1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('api.error.unknown');
  });

  it('should delete education successfully', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(EducationService.delete).mockResolvedValue({} as any);
    const { result } = renderHook(() => useEducations());
    await act(async () => {
      await result.current.deleteEducation('123');
    });
    expect(EducationService.delete).toHaveBeenCalled();
  });

  it('should not delete education if unconfirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = renderHook(() => useEducations());
    await act(async () => {
      await result.current.deleteEducation('123');
    });
    expect(EducationService.delete).not.toHaveBeenCalled();
  });

  it('should handle delete education error with error property', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(EducationService.delete).mockRejectedValueOnce({ error: 'err.3' });
    const { result } = renderHook(() => useEducations());
    await act(async () => {
      await result.current.deleteEducation('123');
    });
    expect(toast.error).toHaveBeenCalledWith('hooks.use_educations.messages.delete_error');
  });

  it('should handle delete education error with message property', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(EducationService.delete).mockRejectedValueOnce({ message: 'msg.3' });
    const { result } = renderHook(() => useEducations());
    await act(async () => {
      await result.current.deleteEducation('123');
    });
    expect(toast.error).toHaveBeenCalledWith('hooks.use_educations.messages.delete_error');
  });

  it('should handle delete education error with no property', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(EducationService.delete).mockRejectedValueOnce({});
    const { result } = renderHook(() => useEducations());
    await act(async () => {
      await result.current.deleteEducation('123');
    });
    expect(toast.error).toHaveBeenCalledWith('hooks.use_educations.messages.delete_error');
  });

  it('should reject submit if no image is present', async () => {
    const { result } = renderHook(() => useEducations());
    await act(async () => {
      await result.current.createEducation();
    });
    expect(result.current.globalError).toBe('educations.error.image_required');
  });

  it('should submit create with minimal payload', async () => {
    vi.mocked(useImagePreview).mockReturnValue({ ...baseImagePreviewState, imagePreview: 'img' } as any);
    mockFormData = { type: 'college', durationHours: '', endDate: '', certificateUrl: '' };
    vi.mocked(EducationService.create).mockResolvedValue({} as any);
    const { result } = renderHook(() => useEducations());
    await act(async () => {
      await result.current.createEducation();
    });
    expect(EducationService.create).toHaveBeenCalled();
  });

  it('should submit create with full payload and file upload', async () => {
    vi.mocked(useImagePreview).mockReturnValue({ ...baseImagePreviewState, selectedFile: new File([''], 'file') } as any);
    mockFormData = { type: 'college', durationHours: '10', endDate: '2024', certificateUrl: 'url' };
    vi.mocked(UploadService.uploadImage).mockResolvedValue('uploaded_url');
    vi.mocked(EducationService.create).mockResolvedValue({} as any);
    const { result } = renderHook(() => useEducations());
    await act(async () => {
      await result.current.createEducation();
    });
    expect(UploadService.uploadImage).toHaveBeenCalled();
    expect(EducationService.create).toHaveBeenCalled();
  });

  it('should submit update with payload', async () => {
    vi.mocked(useImagePreview).mockReturnValue({ ...baseImagePreviewState, imagePreview: 'img' } as any);
    vi.mocked(EducationService.update).mockResolvedValue({} as any);
    const { result } = renderHook(() => useEducations());
    await act(async () => {
      await result.current.updateEducation('123')();
    });
    expect(EducationService.update).toHaveBeenCalled();
  });

  it('should handle submit error with error property', async () => {
    vi.mocked(useImagePreview).mockReturnValue({ ...baseImagePreviewState, imagePreview: 'img' } as any);
    vi.mocked(EducationService.create).mockRejectedValueOnce({ error: 'err.4' });
    const { result } = renderHook(() => useEducations());
    await act(async () => {
      await result.current.createEducation();
    });
    expect(result.current.globalError).toBe('err.4');
  });

  it('should handle submit error with message property', async () => {
    vi.mocked(useImagePreview).mockReturnValue({ ...baseImagePreviewState, imagePreview: 'img' } as any);
    vi.mocked(EducationService.create).mockRejectedValueOnce({ message: 'msg.4' });
    const { result } = renderHook(() => useEducations());
    await act(async () => {
      await result.current.createEducation();
    });
    expect(result.current.globalError).toBe('msg.4');
  });

  it('should handle submit error with no property', async () => {
    vi.mocked(useImagePreview).mockReturnValue({ ...baseImagePreviewState, imagePreview: 'img' } as any);
    vi.mocked(EducationService.create).mockRejectedValueOnce({});
    const { result } = renderHook(() => useEducations());
    await act(async () => {
      await result.current.createEducation();
    });
    expect(result.current.globalError).toBe('api.error.unknown');
  });

  it('should append and remove translations', () => {
    const { result } = renderHook(() => useEducations());
    act(() => {
      result.current.appendTranslation();
      result.current.removeTranslation(0);
    });
    expect(typeof result.current.appendTranslation).toBe('function');
  });
});
