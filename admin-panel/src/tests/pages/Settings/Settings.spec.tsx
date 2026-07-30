import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import Settings from '@/pages/Settings';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { useSettings } from '@/hooks/useSettings';
import { useAiProviders } from '@/hooks/useAiProviders';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue: string }) => options?.defaultValue || key,
  }),
}));

vi.mock('@/contexts/SettingsContext', () => ({
  useSettingsContext: vi.fn(),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: vi.fn(),
}));

vi.mock('@/hooks/useAiProviders', () => ({
  useAiProviders: vi.fn(),
}));

vi.mock('@/components/Background', () => ({
  default: () => <div data-testid="mock-background" />
}));

vi.mock('@/components/Heading', () => ({
  default: ({ title }: any) => <h1 data-testid="mock-heading">{title}</h1>
}));

vi.mock('@/components/SubTitle', () => ({
  default: ({ content }: any) => <p data-testid="mock-subtitle">{content}</p>
}));

vi.mock('@/components/Buttons/BackButton', () => ({
  default: ({ to, label }: any) => <a href={to.pathname} data-testid="mock-back-button">{label}</a>
}));

vi.mock('@/components/PageLoader', () => ({
  default: () => <div data-testid="mock-page-loader" />
}));

vi.mock('@/components/SettingsSection', () => ({
  default: ({ onSubmitAction }: any) => (
    <form
      data-testid="mock-settings-section"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitAction();
      }}
    >
      <button type="submit" data-testid="form-submit-btn">Submit Settings</button>
    </form>
  )
}));

vi.mock('@/components/AiProviderSection', () => ({
  default: ({ onSubmitAction, isEditing, onCancelEdit, children }: any) => (
    <div data-testid="mock-ai-section">
      <span data-testid="ai-is-editing">{isEditing ? 'true' : 'false'}</span>
      <button type="button" onClick={onCancelEdit} data-testid="cancel-ai-btn">Cancel AI</button>
      <form
        data-testid="mock-ai-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitAction();
        }}
      >
        <button type="submit" data-testid="ai-submit-btn">Submit AI</button>
      </form>
      {children}
    </div>
  )
}));

vi.mock('@/components/AiProviderList', () => ({
  default: ({ onEdit, onDelete }: any) => (
    <div data-testid="mock-ai-list">
      <button type="button" onClick={() => onEdit({ id: 'provider-123', name: 'OpenAI' })} data-testid="edit-provider-btn">Edit</button>
      <button type="button" onClick={() => onDelete('provider-123')} data-testid="delete-provider-btn">Delete</button>
    </div>
  )
}));

describe('Settings Page Component', () => {
  const mockApplyNewSettings = vi.fn();
  const mockRefreshSettings = vi.fn();
  const mockReset = vi.fn();
  const mockSetImagePreview = vi.fn();

  const mockUpdateSettings = vi.fn((callback) => () => callback({ siteUrl: 'https://new-url.com' }));
  const mockCreateAiProvider = vi.fn((callback) => () => callback());
  const mockUpdateAiProvider = vi.fn((id, callback) => () => callback());
  const mockDeleteAiProvider = vi.fn();
  const mockResetAi = vi.fn();

  const mockGlobalSettings = {
    siteUrl: 'https://example.com',
    publicEmail: 'admin@example.com',
    logoUrl: 'https://example.com/logo.png',
    theme: 'dark',
    panelLanguage: 'pt',
    customConfig: { key: 'value' },
    aiKeys: [{ id: '1', provider: 'openai' }]
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useSettingsContext).mockReturnValue({
      globalSettings: mockGlobalSettings,
      isLoadingSettings: false,
      applyNewSettings: mockApplyNewSettings,
      refreshSettings: mockRefreshSettings,
    } as any);

    vi.mocked(useSettings).mockReturnValue({
      register: vi.fn() as any,
      errors: {},
      isSubmitting: false,
      globalError: null,
      updateSettings: mockUpdateSettings,
      imagePreview: null,
      handleFileChange: vi.fn(),
      reset: mockReset,
      setImagePreview: mockSetImagePreview,
    } as any);

    vi.mocked(useAiProviders).mockReturnValue({
      register: vi.fn() as any,
      errors: {},
      isSubmitting: false,
      globalError: null,
      createAiProvider: mockCreateAiProvider,
      updateAiProvider: mockUpdateAiProvider,
      deleteAiProvider: mockDeleteAiProvider,
      reset: mockResetAi,
    } as any);
  });

  it('should render loading spinner when isLoadingSettings is true', () => {
    vi.mocked(useSettingsContext).mockReturnValue({
      globalSettings: null,
      isLoadingSettings: true,
      applyNewSettings: mockApplyNewSettings,
      refreshSettings: mockRefreshSettings,
    } as any);

    render(<Settings />);

    expect(screen.getByTestId('mock-page-loader')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-settings-section')).not.toBeInTheDocument();
  });

  it('should render the page and its sections when loaded', () => {
    render(<Settings />);

    expect(screen.getByTestId('mock-background')).toBeInTheDocument();
    expect(screen.getByTestId('mock-back-button')).toBeInTheDocument();
    expect(screen.getByTestId('mock-settings-section')).toBeInTheDocument();
    expect(screen.getByTestId('mock-ai-section')).toBeInTheDocument();
    expect(screen.getByTestId('mock-ai-list')).toBeInTheDocument();
  });

  it('should reset form values when globalSettings is loaded with full data', () => {
    render(<Settings />);

    expect(mockReset).toHaveBeenCalledWith({
      theme: 'dark',
      panelLanguage: 'pt',
      customConfig: { key: 'value' },
      siteUrl: 'https://example.com',
      publicEmail: 'admin@example.com',
      logoUrl: 'https://example.com/logo.png',
    });
    expect(mockSetImagePreview).toHaveBeenCalledWith('https://example.com/logo.png');
  });

  it('should reset form values with defaults when globalSettings has missing fields', () => {
    vi.mocked(useSettingsContext).mockReturnValue({
      globalSettings: {},
      isLoadingSettings: false,
      applyNewSettings: mockApplyNewSettings,
      refreshSettings: mockRefreshSettings,
    } as any);

    render(<Settings />);

    expect(mockReset).toHaveBeenCalledWith({
      theme: 'system',
      panelLanguage: 'en',
      customConfig: {},
      siteUrl: '',
      publicEmail: '',
      logoUrl: '',
    });
    expect(mockSetImagePreview).toHaveBeenCalledWith(null);
  });

  it('should not call reset when globalSettings is null', () => {
    vi.mocked(useSettingsContext).mockReturnValue({
      globalSettings: null,
      isLoadingSettings: false,
      applyNewSettings: mockApplyNewSettings,
      refreshSettings: mockRefreshSettings,
    } as any);

    render(<Settings />);

    expect(mockReset).not.toHaveBeenCalled();
    expect(mockSetImagePreview).not.toHaveBeenCalled();
  });

  it('should call applyNewSettings when settings form is submitted', () => {
    render(<Settings />);

    fireEvent.submit(screen.getByTestId('mock-settings-section'));

    expect(mockUpdateSettings).toHaveBeenCalled();
    expect(mockApplyNewSettings).toHaveBeenCalledWith({ siteUrl: 'https://new-url.com' });
  });

  it('should call createAiProvider and refresh settings when submitting AI form without editing id', () => {
    render(<Settings />);

    fireEvent.submit(screen.getByTestId('mock-ai-form'));

    expect(mockCreateAiProvider).toHaveBeenCalled();
    expect(mockRefreshSettings).toHaveBeenCalled();
    expect(mockResetAi).toHaveBeenCalled();
  });

  it('should handle edit AI provider flow correctly', () => {
    render(<Settings />);

    expect(screen.getByTestId('ai-is-editing')).toHaveTextContent('false');

    fireEvent.click(screen.getByTestId('edit-provider-btn'));

    expect(mockResetAi).toHaveBeenCalledWith({ id: 'provider-123', name: 'OpenAI' });
    expect(screen.getByTestId('ai-is-editing')).toHaveTextContent('true');

    fireEvent.submit(screen.getByTestId('mock-ai-form'));

    expect(mockUpdateAiProvider).toHaveBeenCalled();
    expect(mockRefreshSettings).toHaveBeenCalled();
    expect(mockResetAi).toHaveBeenCalled();
    expect(screen.getByTestId('ai-is-editing')).toHaveTextContent('false');
  });

  it('should handle cancel edit AI provider flow correctly', () => {
    render(<Settings />);

    fireEvent.click(screen.getByTestId('edit-provider-btn'));
    expect(screen.getByTestId('ai-is-editing')).toHaveTextContent('true');

    fireEvent.click(screen.getByTestId('cancel-ai-btn'));

    expect(screen.getByTestId('ai-is-editing')).toHaveTextContent('false');
    expect(mockResetAi).toHaveBeenCalled();
  });

  it('should pass delete handler to AiProviderList', () => {
    render(<Settings />);

    fireEvent.click(screen.getByTestId('delete-provider-btn'));

    expect(mockDeleteAiProvider).toHaveBeenCalledWith('provider-123');
  });
});
