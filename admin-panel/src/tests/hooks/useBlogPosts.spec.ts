import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBlogPosts } from '@/hooks/useBlogPosts';

import { BlogPostService } from '@/services/blogPostService';
import { UploadService } from '@/services/uploadService';
import { useImagePreview } from '@/hooks/useImagePreview';
import { injectTableOfContents } from '@/helpers/blogPostsHelpers';

import toast from 'react-hot-toast';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key
  })
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/services/blogPostService', () => ({
  BlogPostService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    generate: vi.fn(),
    stylize: vi.fn(),
    checkSlug: vi.fn()
  }
}));

vi.mock('@/services/uploadService', () => ({
  UploadService: {
    uploadImage: vi.fn()
  }
}));

const mockSetImagePreview = vi.fn();
const mockSetSelectedFile = vi.fn();
const mockHandleFileChange = vi.fn();
const mockClearImage = vi.fn();

vi.mock('@/hooks/useImagePreview', () => ({
  useImagePreview: vi.fn()
}));

const mockReset = vi.fn();
const mockGetValues = vi.fn();
const mockSetValue = vi.fn();
const mockSetError = vi.fn();
const mockClearErrors = vi.fn();
const mockAppend = vi.fn();
const mockRemove = vi.fn();

vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(),
    control: {},
    handleSubmit: (fn: any) => (data: any) => fn(data),
    reset: mockReset,
    getValues: mockGetValues,
    setValue: mockSetValue,
    setError: mockSetError,
    clearErrors: mockClearErrors,
    formState: { errors: {}, isSubmitting: false }
  }),
  useFieldArray: () => ({
    fields: [],
    append: mockAppend,
    remove: mockRemove
  })
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn()
}));

vi.mock('@/helpers/blogPostsHelpers', () => ({
  injectTableOfContents: vi.fn()
}));

const mockStreamResponse = (chunks: string[]) => {
  let current = 0;
  return {
    body: {
      getReader: () => ({
        read: vi.fn().mockImplementation(() => {
          if (current < chunks.length) {
            return Promise.resolve({
              done: false,
              value: new TextEncoder().encode(chunks[current++])
            });
          }
          return Promise.resolve({ done: true, value: undefined });
        })
      })
    }
  };
};

describe('useBlogPosts Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(useImagePreview).mockReturnValue({
      imagePreview: 'mock-preview-url',
      setImagePreview: mockSetImagePreview,
      selectedFile: null,
      setSelectedFile: mockSetSelectedFile,
      handleFileChange: mockHandleFileChange,
      clearImage: mockClearImage
    } as any);

    vi.mocked(BlogPostService.getAll).mockResolvedValue([]);
    vi.mocked(BlogPostService.getById).mockResolvedValue({} as any);
  });

  it('should initialize and fetch list if options.fetchList is true', async () => {
    const mockPosts = [{
      id: '1',
      coverImageUrl: '',
      isPublished: false,
      translations: [{ language: 'en', slug: 'test', title: 'Test', excerpt: '', content: '' }]
    }];
    vi.mocked(BlogPostService.getAll).mockResolvedValue(mockPosts as any);

    const { result } = renderHook(() => useBlogPosts({ fetchList: true }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(BlogPostService.getAll).toHaveBeenCalled();
    expect(result.current.blogPosts).toEqual(mockPosts);
  });

  it('should handle fetch list error', async () => {
    vi.mocked(BlogPostService.getAll).mockRejectedValue({ error: 'fetch.error' });

    const { result } = renderHook(() => useBlogPosts({ fetchList: true }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.globalError).toBe('fetch.error');
  });

  it('should handle fetch list unknown error', async () => {
    vi.mocked(BlogPostService.getAll).mockRejectedValue(new Error('Unknown'));

    const { result } = renderHook(() => useBlogPosts({ fetchList: true }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.globalError).toBe('api.error.unknown');
  });

  it('should fetch single post for edit and reset form', async () => {
    const mockPost = {
      id: '1',
      coverImageUrl: 'img.jpg',
      isPublished: true,
      translations: [
        { language: 'en', slug: 'slug-en', title: 'title-en', excerpt: 'exc', content: 'cont' }
      ]
    };
    vi.mocked(BlogPostService.getById).mockResolvedValue(mockPost as any);

    const { result } = renderHook(() => useBlogPosts({ editId: '1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(BlogPostService.getById).toHaveBeenCalledWith('1');
    expect(mockReset).toHaveBeenCalledWith({
      coverImageUrl: 'img.jpg',
      isPublished: true,
      translations: [
        { language: 'en', slug: 'slug-en', title: 'title-en', excerpt: 'exc', content: 'cont' }
      ]
    });
    expect(mockSetImagePreview).toHaveBeenCalledWith('img.jpg');
  });

  it('should fallback to defaults when editing a post with missing data', async () => {
    const mockPost = { id: '1', translations: [] };
    vi.mocked(BlogPostService.getById).mockResolvedValue(mockPost as any);

    const { result } = renderHook(() => useBlogPosts({ editId: '1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockReset).toHaveBeenCalledWith({
      coverImageUrl: '',
      isPublished: false,
      translations: [{ language: 'pt', slug: '', title: '', excerpt: '', content: '' }]
    });
    expect(mockSetImagePreview).toHaveBeenCalledWith(null);
  });

  it('should handle edit fetch error', async () => {
    vi.mocked(BlogPostService.getById).mockRejectedValue({ error: 'edit.error' });

    const { result } = renderHook(() => useBlogPosts({ editId: '1' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.globalError).toBe('edit.error');
  });

  it('should delete post successfully', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(BlogPostService.delete).mockResolvedValueOnce({} as any);

    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.deleteBlogPost('1');
    });

    expect(BlogPostService.delete).toHaveBeenCalledWith('1');
    expect(result.current.blogPosts).toEqual([]);
    expect(toast.success).toHaveBeenCalledWith('Post deleted successfully');
  });

  it('should not delete post if confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.deleteBlogPost('1');
    });

    expect(BlogPostService.delete).not.toHaveBeenCalled();
  });

  it('should handle delete post error', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(BlogPostService.getAll).mockResolvedValue([{ id: '1', isPublished: false, coverImageUrl: '', translations: [] } as any]);
    vi.mocked(BlogPostService.delete).mockRejectedValue(new Error('delete failed'));

    const { result } = renderHook(() => useBlogPosts({ fetchList: true }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteBlogPost('1');
    });

    expect(toast.error).toHaveBeenCalledWith('Error deleting post');
  });

  it('should create a post successfully without a file', async () => {
    const mockData = { coverImageUrl: '', isPublished: false, translations: [] };
    vi.mocked(BlogPostService.create).mockResolvedValue({ id: 'new', translations: [] } as any);

    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.createBlogPost(mockData as any);
    });

    expect(BlogPostService.create).toHaveBeenCalledWith({
      ...mockData,
      coverImageUrl: 'mock-preview-url'
    });
    expect(mockSetSelectedFile).toHaveBeenCalledWith(null);
    expect(mockNavigate).toHaveBeenCalledWith('/blog-posts');
    expect(toast.success).toHaveBeenCalledWith('Post created successfully');
  });

  it('should update a post successfully with a file', async () => {
    const mockData = { coverImageUrl: '', isPublished: false, translations: [] };

    vi.mocked(useImagePreview).mockReturnValue({
      imagePreview: 'mock-preview-url',
      setImagePreview: mockSetImagePreview,
      selectedFile: new File([''], 'test.png'),
      setSelectedFile: mockSetSelectedFile,
      handleFileChange: mockHandleFileChange,
      clearImage: mockClearImage
    } as any);

    vi.mocked(UploadService.uploadImage).mockResolvedValue('uploaded-url.png');
    vi.mocked(BlogPostService.update).mockResolvedValue({ id: '123', translations: [] } as any);

    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.updateBlogPost('123')(mockData as any);
    });

    expect(UploadService.uploadImage).toHaveBeenCalledWith(expect.any(File), 'blog-posts', 'post-123');
    expect(BlogPostService.update).toHaveBeenCalledWith('123', {
      ...mockData,
      coverImageUrl: 'uploaded-url.png'
    });
    expect(toast.success).toHaveBeenCalledWith('Post updated successfully');
  });

  it('should handle creation error', async () => {
    const mockData = { coverImageUrl: '', isPublished: false, translations: [] };
    vi.mocked(BlogPostService.create).mockRejectedValue({ error: 'creation.failed' });

    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.createBlogPost(mockData as any);
    });

    expect(result.current.globalError).toBe('creation.failed');
    expect(toast.error).toHaveBeenCalledWith('Error saving post');
  });

  it('should handle creation error with fallback message', async () => {
    const mockData = { coverImageUrl: '', isPublished: false, translations: [] };
    vi.mocked(BlogPostService.create).mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.createBlogPost(mockData as any);
    });

    expect(result.current.globalError).toBe('api.error.unknown');
    expect(toast.error).toHaveBeenCalledWith('Error saving post');
  });

  it('should prevent submission if there are slug conflicts', async () => {
    vi.useFakeTimers();
    mockGetValues.mockReturnValue('en');
    vi.mocked(BlogPostService.checkSlug).mockResolvedValue({ exists: true });

    const { result } = renderHook(() => useBlogPosts());

    act(() => {
      result.current.handleSlugDebounce({ target: { value: 'existing-slug' } } as any, 0);
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('translations.0.slug', {
        type: 'manual',
        message: 'Slug already in use'
      });
    });

    await act(async () => {
      await result.current.createBlogPost({ coverImageUrl: '', isPublished: false, translations: [] } as any);
    });

    expect(BlogPostService.create).not.toHaveBeenCalled();
  });

  it('should handle checkSlugAvailability correctly for non-existing slug', async () => {
    vi.useFakeTimers();
    mockGetValues.mockReturnValue('pt');
    vi.mocked(BlogPostService.checkSlug).mockResolvedValue({ exists: false });

    const { result } = renderHook(() => useBlogPosts());

    act(() => {
      result.current.handleSlugDebounce({ target: { value: 'new-slug' } } as any, 0);
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(mockClearErrors).toHaveBeenCalledWith('translations.0.slug');
    });
  });

  it('should not call checkSlugAvailability if slug is empty in debounce', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useBlogPosts());

    act(() => {
      result.current.handleSlugDebounce({ target: { value: '' } } as any, 0);
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(BlogPostService.checkSlug).not.toHaveBeenCalled();
    });
  });

  it('should return false from checkSlugAvailability if slug is empty', async () => {
    const { result } = renderHook(() => useBlogPosts());
    let exists;

    await act(async () => {
      exists = await result.current.checkSlugAvailability('en', '');
    });

    expect(exists).toBe(false);
  });

  it('should catch error in checkSlugAvailability and return false', async () => {
    vi.mocked(BlogPostService.checkSlug).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useBlogPosts());
    let exists;

    await act(async () => {
      exists = await result.current.checkSlugAvailability('en', 'test');
    });

    expect(exists).toBe(false);
  });

  it('should append and remove translations', () => {
    const { result } = renderHook(() => useBlogPosts());

    act(() => {
      result.current.appendTranslation();
    });

    expect(mockAppend).toHaveBeenCalledWith({ language: 'en', slug: '', title: '', excerpt: '', content: '' });

    act(() => {
      result.current.removeTranslation(1);
    });

    expect(mockRemove).toHaveBeenCalledWith(1);
  });

  it('should successfully generate AI content', async () => {
    mockGetValues.mockReturnValue('test-value');
    vi.mocked(BlogPostService.generate).mockResolvedValue(
      mockStreamResponse(['<p>Hello&nbsp;</p>', '<p>World\n\n</p>']) as any
    );

    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.generateAIContent('prompt', 0, 'provider-1');
    });

    expect(mockSetValue).toHaveBeenCalledWith('translations.0.content', '<p>Hello </p>', expect.any(Object));
    expect(mockSetValue).toHaveBeenCalledWith('translations.0.content', '<p>Hello </p><p>World\n</p>', expect.any(Object));
    expect(toast.success).toHaveBeenCalledWith('Content generated successfully');
  });

  it('should handle AI content generation stream error', async () => {
    vi.mocked(BlogPostService.generate).mockResolvedValue({ body: null } as any);

    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.generateAIContent('prompt', 0, 'provider-1');
    });

    expect(result.current.globalError).toBe('Stream não disponível');
    expect(toast.error).toHaveBeenCalledWith('Error generating content');
  });

  it('should handle AI content generation fetch error', async () => {
    vi.mocked(BlogPostService.generate).mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.generateAIContent('prompt', 0, 'provider-1');
    });

    expect(result.current.globalError).toBe('Fetch failed');
    expect(toast.error).toHaveBeenCalledWith('Error generating content');
  });

  it('should handle AI content generation generic fallback error', async () => {
    vi.mocked(BlogPostService.generate).mockRejectedValue({});

    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.generateAIContent('prompt', 0, 'provider-1');
    });

    expect(result.current.globalError).toBe('Error generating content');
  });

  it('should prevent AI stylization if content is empty', async () => {
    mockGetValues.mockReturnValue('');
    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.stylizeAIContent(0, 'provider-1');
    });

    expect(toast.error).toHaveBeenCalledWith('No content to stylize');
    expect(BlogPostService.stylize).not.toHaveBeenCalled();
  });

  it('should successfully stylize AI content', async () => {
    mockGetValues.mockReturnValue('existing-content');
    vi.mocked(BlogPostService.stylize).mockResolvedValue(
      mockStreamResponse(['<h1>Stylized</h1>']) as any
    );

    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.stylizeAIContent(0, 'provider-1');
    });

    expect(mockSetValue).toHaveBeenCalledWith('translations.0.content', '', { shouldValidate: false });
    expect(mockSetValue).toHaveBeenCalledWith('translations.0.content', '<h1>Stylized</h1>', expect.any(Object));
    expect(toast.success).toHaveBeenCalledWith('Content stylized successfully');
  });

  it('should handle AI stylization stream error', async () => {
    mockGetValues.mockReturnValue('existing-content');
    vi.mocked(BlogPostService.stylize).mockResolvedValue({ body: null } as any);

    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.stylizeAIContent(0, 'provider-1');
    });

    expect(result.current.globalError).toBe('Stream não disponível');
    expect(toast.error).toHaveBeenCalledWith('Error stylizing content');
  });

  it('should handle AI stylization fetch error', async () => {
    mockGetValues.mockReturnValue('existing-content');
    vi.mocked(BlogPostService.stylize).mockRejectedValue(new Error('Stylize failed'));

    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.stylizeAIContent(0, 'provider-1');
    });

    expect(result.current.globalError).toBe('Stylize failed');
    expect(toast.error).toHaveBeenCalledWith('Error stylizing content');
  });

  it('should handle AI stylization generic fallback error', async () => {
    mockGetValues.mockReturnValue('existing-content');
    vi.mocked(BlogPostService.stylize).mockRejectedValue({});

    const { result } = renderHook(() => useBlogPosts());

    await act(async () => {
      await result.current.stylizeAIContent(0, 'provider-1');
    });

    expect(result.current.globalError).toBe('Error stylizing content');
  });

  it('should successfully generate table of contents', () => {
    mockGetValues.mockReturnValue('<h1>Heading</h1>');
    vi.mocked(injectTableOfContents).mockReturnValue('toc-html');

    const { result } = renderHook(() => useBlogPosts());

    act(() => {
      result.current.generateTableOfContents(0);
    });

    expect(injectTableOfContents).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith('translations.0.content', 'toc-html', expect.any(Object));
    expect(toast.success).toHaveBeenCalledWith('Table of contents generated successfully');
  });

  it('should prevent table of contents generation if content is empty', () => {
    mockGetValues.mockReturnValue(null);

    const { result } = renderHook(() => useBlogPosts());

    act(() => {
      result.current.generateTableOfContents(0);
    });

    expect(toast.error).toHaveBeenCalledWith('No content to generate table of contents');
  });

  it('should handle insufficient headings error when generating TOC', () => {
    mockGetValues.mockReturnValue('content');
    vi.mocked(injectTableOfContents).mockImplementation(() => {
      throw new Error('INSUFFICIENT_HEADINGS');
    });

    const { result } = renderHook(() => useBlogPosts());

    act(() => {
      result.current.generateTableOfContents(0);
    });

    expect(toast.error).toHaveBeenCalledWith('Insufficient headings to generate table of contents');
  });

  it('should handle unknown error when generating TOC', () => {
    mockGetValues.mockReturnValue('content');
    vi.mocked(injectTableOfContents).mockImplementation(() => {
      throw new Error('Some other error');
    });

    const { result } = renderHook(() => useBlogPosts());

    act(() => {
      result.current.generateTableOfContents(0);
    });

    expect(toast.error).toHaveBeenCalledWith('Error generating table of contents');
  });
});
