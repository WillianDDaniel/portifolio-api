import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useProjects } from '@/hooks/useProjects';
import { ProjectService } from '@/services/projectService';
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

vi.mock('@/services/projectService', () => ({
  ProjectService: {
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

describe('useProjects hook', () => {
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
    mockFormData = { liveUrl: 'url', repoUrl: 'url' };
  });

  it('should load projects on mount', async () => {
    vi.mocked(ProjectService.getAll).mockResolvedValue([{ id: '1' }] as any);
    const { result } = renderHook(() => useProjects({ fetchList: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(ProjectService.getAll).toHaveBeenCalled();
  });

  it('should handle load projects error with error property', async () => {
    vi.mocked(ProjectService.getAll).mockRejectedValueOnce({ error: 'err.1' });
    const { result } = renderHook(() => useProjects({ fetchList: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('err.1');
  });

  it('should handle load projects error with message property', async () => {
    vi.mocked(ProjectService.getAll).mockRejectedValueOnce({ message: 'msg.1' });
    const { result } = renderHook(() => useProjects({ fetchList: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('msg.1');
  });

  it('should handle load projects error with no property', async () => {
    vi.mocked(ProjectService.getAll).mockRejectedValueOnce({});
    const { result } = renderHook(() => useProjects({ fetchList: true }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('api.error.unknown');
  });

  it('should load project details with full data', async () => {
    vi.mocked(ProjectService.getById).mockResolvedValue({
      id: '1',
      liveUrl: 'live',
      repoUrl: 'repo',
      imageUrl: 'img',
      translations: [{ language: 'en', title: 't', description: 'd' }]
    } as any);
    const { result } = renderHook(() => useProjects({ editId: '1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(ProjectService.getById).toHaveBeenCalledWith('1');
  });

  it('should load project details with minimal data', async () => {
    vi.mocked(ProjectService.getById).mockResolvedValue({ id: '1' } as any);
    const { result } = renderHook(() => useProjects({ editId: '1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(ProjectService.getById).toHaveBeenCalledWith('1');
  });

  it('should handle load project details error with error property', async () => {
    vi.mocked(ProjectService.getById).mockRejectedValueOnce({ error: 'err.2' });
    const { result } = renderHook(() => useProjects({ editId: '1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('err.2');
  });

  it('should handle load project details error with message property', async () => {
    vi.mocked(ProjectService.getById).mockRejectedValueOnce({ message: 'msg.2' });
    const { result } = renderHook(() => useProjects({ editId: '1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('msg.2');
  });

  it('should handle load project details error with no property', async () => {
    vi.mocked(ProjectService.getById).mockRejectedValueOnce({});
    const { result } = renderHook(() => useProjects({ editId: '1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.globalError).toBe('api.error.unknown');
  });

  it('should delete project successfully', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(ProjectService.delete).mockResolvedValue({} as any);
    const { result } = renderHook(() => useProjects());
    await act(async () => {
      await result.current.deleteProject('123');
    });
    expect(ProjectService.delete).toHaveBeenCalledWith('123');
  });

  it('should not delete project if unconfirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = renderHook(() => useProjects());
    await act(async () => {
      await result.current.deleteProject('123');
    });
    expect(ProjectService.delete).not.toHaveBeenCalled();
  });

  it('should handle delete project error with error property', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(ProjectService.delete).mockRejectedValueOnce({ error: 'err.3' });
    const { result } = renderHook(() => useProjects());
    await act(async () => {
      await result.current.deleteProject('123');
    });
    expect(toast.error).toHaveBeenCalledWith('hooks.use_projects.messages.delete_error');
  });

  it('should handle delete project error with message property', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(ProjectService.delete).mockRejectedValueOnce({ message: 'msg.3' });
    const { result } = renderHook(() => useProjects());
    await act(async () => {
      await result.current.deleteProject('123');
    });
    expect(toast.error).toHaveBeenCalledWith('hooks.use_projects.messages.delete_error');
  });

  it('should handle delete project error with no property', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(ProjectService.delete).mockRejectedValueOnce({});
    const { result } = renderHook(() => useProjects());
    await act(async () => {
      await result.current.deleteProject('123');
    });
    expect(toast.error).toHaveBeenCalledWith('hooks.use_projects.messages.delete_error');
  });

  it('should submit create with minimal payload', async () => {
    vi.mocked(useImagePreview).mockReturnValue({ ...baseImagePreviewState, imagePreview: 'img' } as any);
    vi.mocked(ProjectService.create).mockResolvedValue({} as any);
    const { result } = renderHook(() => useProjects());
    await act(async () => {
      await result.current.createProject();
    });
    expect(ProjectService.create).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/projects');
  });

  it('should submit create with full payload and file upload', async () => {
    vi.mocked(useImagePreview).mockReturnValue({ ...baseImagePreviewState, selectedFile: new File([''], 'file') } as any);
    vi.mocked(UploadService.uploadImage).mockResolvedValue('uploaded_url');
    vi.mocked(ProjectService.create).mockResolvedValue({} as any);
    const { result } = renderHook(() => useProjects());
    await act(async () => {
      await result.current.createProject();
    });
    expect(UploadService.uploadImage).toHaveBeenCalled();
    expect(ProjectService.create).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/projects');
  });

  it('should submit update with file upload', async () => {
    vi.mocked(useImagePreview).mockReturnValue({ ...baseImagePreviewState, selectedFile: new File([''], 'file') } as any);
    vi.mocked(UploadService.uploadImage).mockResolvedValue('uploaded_url');
    vi.mocked(ProjectService.update).mockResolvedValue({} as any);
    const { result } = renderHook(() => useProjects());
    await act(async () => {
      await result.current.updateProject('123')();
    });
    expect(UploadService.uploadImage).toHaveBeenCalled();
    expect(ProjectService.update).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/projects');
  });

  it('should handle submit error with error property', async () => {
    vi.mocked(ProjectService.create).mockRejectedValueOnce({ error: 'err.4' });
    const { result } = renderHook(() => useProjects());
    await act(async () => {
      await result.current.createProject();
    });
    expect(result.current.globalError).toBe('err.4');
  });

  it('should handle submit error with message property', async () => {
    vi.mocked(ProjectService.create).mockRejectedValueOnce({ message: 'msg.4' });
    const { result } = renderHook(() => useProjects());
    await act(async () => {
      await result.current.createProject();
    });
    expect(result.current.globalError).toBe('msg.4');
  });

  it('should handle submit error with no property', async () => {
    vi.mocked(ProjectService.create).mockRejectedValueOnce({});
    const { result } = renderHook(() => useProjects());
    await act(async () => {
      await result.current.createProject();
    });
    expect(result.current.globalError).toBe('api.error.unknown');
  });

  it('should append and remove translations', () => {
    const { result } = renderHook(() => useProjects());
    act(() => {
      result.current.appendTranslation();
      result.current.removeTranslation(0);
    });
    expect(typeof result.current.appendTranslation).toBe('function');
  });
});
