import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useServices } from '@/hooks/useServices';
import { ServiceService } from '@/services/serviceService';
import { UploadService } from '@/services/uploadService';
import { useImagePreview } from '@/hooks/useImagePreview';

import toast from 'react-hot-toast';

let mockFormData: any = {};
const mockNavigate = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
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

vi.mock('@/services/serviceService', () => ({
  ServiceService: {
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

describe('useServices hook', () => {
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
    mockFormData = { link: 'url' };
  });

  it('should load services on mount', async () => {
    vi.mocked(ServiceService.getAll).mockResolvedValue([{ id: '1' }] as any);
    const { result } = renderHook(() => useServices({ fetchList: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(ServiceService.getAll).toHaveBeenCalled();
  });

  it('should handle load services error with error property', async () => {
    vi.mocked(ServiceService.getAll).mockRejectedValueOnce({ error: 'err.1' });
    const { result } = renderHook(() => useServices({ fetchList: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('err.1');
  });

  it('should handle load services error with no property', async () => {
    vi.mocked(ServiceService.getAll).mockRejectedValueOnce({});
    const { result } = renderHook(() => useServices({ fetchList: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('api.error.unknown');
  });

  it('should load service details with full data', async () => {
    vi.mocked(ServiceService.getById).mockResolvedValue({
      id: '1',
      link: 'live',
      imageUrl: 'img',
      translations: [{ language: 'en', title: 't', description: 'd' }]
    } as any);
    const { result } = renderHook(() => useServices({ editId: '1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(ServiceService.getById).toHaveBeenCalledWith('1');
  });

  it('should load service details with minimal data', async () => {
    vi.mocked(ServiceService.getById).mockResolvedValue({ id: '1' } as any);
    const { result } = renderHook(() => useServices({ editId: '1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(ServiceService.getById).toHaveBeenCalledWith('1');
  });

  it('should handle load service details error with error property', async () => {
    vi.mocked(ServiceService.getById).mockRejectedValueOnce({ error: 'err.2' });
    const { result } = renderHook(() => useServices({ editId: '1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('err.2');
  });

  it('should handle load service details error with no property', async () => {
    vi.mocked(ServiceService.getById).mockRejectedValueOnce({});
    const { result } = renderHook(() => useServices({ editId: '1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('api.error.unknown');
  });

  it('should delete service successfully', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(ServiceService.delete).mockResolvedValue({} as any);
    const { result } = renderHook(() => useServices());
    await act(async () => {
      await result.current.deleteService('123');
    });
    expect(ServiceService.delete).toHaveBeenCalledWith('123');
  });

  it('should not delete service if unconfirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = renderHook(() => useServices());
    await act(async () => {
      await result.current.deleteService('123');
    });
    expect(ServiceService.delete).not.toHaveBeenCalled();
  });

  it('should handle delete service error with error property', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(ServiceService.delete).mockRejectedValueOnce({ error: 'err.3' });
    const { result } = renderHook(() => useServices());
    await act(async () => {
      await result.current.deleteService('123');
    });
    expect(toast.error).toHaveBeenCalledWith('hooks.use_services.messages.delete_error');
  });

  it('should handle delete service error with no property', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(ServiceService.delete).mockRejectedValueOnce({});
    const { result } = renderHook(() => useServices());
    await act(async () => {
      await result.current.deleteService('123');
    });
    expect(toast.error).toHaveBeenCalledWith('hooks.use_services.messages.delete_error');
  });

  it('should submit create with minimal payload', async () => {
    vi.mocked(useImagePreview).mockReturnValue({ ...baseImagePreviewState, imagePreview: 'img' } as any);
    vi.mocked(ServiceService.create).mockResolvedValue({} as any);
    const { result } = renderHook(() => useServices());
    await act(async () => {
      await result.current.createService();
    });
    expect(ServiceService.create).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/services');
  });

  it('should submit create with full payload and file upload', async () => {
    vi.mocked(useImagePreview).mockReturnValue({ ...baseImagePreviewState, selectedFile: new File([''], 'file') } as any);
    vi.mocked(UploadService.uploadImage).mockResolvedValue('uploaded_url');
    vi.mocked(ServiceService.create).mockResolvedValue({} as any);
    const { result } = renderHook(() => useServices());
    await act(async () => {
      await result.current.createService();
    });
    expect(UploadService.uploadImage).toHaveBeenCalled();
    expect(ServiceService.create).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/services');
  });

  it('should submit update with file upload', async () => {
    vi.mocked(useImagePreview).mockReturnValue({ ...baseImagePreviewState, selectedFile: new File([''], 'file') } as any);
    vi.mocked(UploadService.uploadImage).mockResolvedValue('uploaded_url');
    vi.mocked(ServiceService.update).mockResolvedValue({} as any);
    const { result } = renderHook(() => useServices());
    await act(async () => {
      await result.current.updateService('123')();
    });
    expect(UploadService.uploadImage).toHaveBeenCalled();
    expect(ServiceService.update).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/services');
  });

  it('should handle submit error with error property', async () => {
    vi.mocked(ServiceService.create).mockRejectedValueOnce({ error: 'err.4' });
    const { result } = renderHook(() => useServices());
    await act(async () => {
      await result.current.createService();
    });
    expect(result.current.globalError).toBe('err.4');
  });

  it('should handle submit error with no property', async () => {
    vi.mocked(ServiceService.create).mockRejectedValueOnce({});
    const { result } = renderHook(() => useServices());
    await act(async () => {
      await result.current.createService();
    });
    expect(result.current.globalError).toBe('api.error.unknown');
  });

  it('should append and remove translations', () => {
    const { result } = renderHook(() => useServices());
    act(() => {
      result.current.appendTranslation();
      result.current.removeTranslation(0);
    });
    expect(typeof result.current.appendTranslation).toBe('function');
  });
});
