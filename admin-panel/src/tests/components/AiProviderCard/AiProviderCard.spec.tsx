import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AiProviderCard from '@/components/AiProviderCard';
import type { AIProvider } from '@/typings/AiProvider';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
  }),
}));

vi.mock('@/helpers/aiProviderHelpers', () => ({
  getProviderLogo: vi.fn((provider: string) => `/mock-logo-${provider}.png`),
}));

describe('AiProviderCard Component', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const activeProvider: AIProvider = {
    id: 'provider-123',
    name: 'Main OpenAI',
    provider: 'openai',
    key: 'sk-mock-key',
    isActive: true,
  };

  const inactiveProvider: AIProvider = {
    ...activeProvider,
    id: 'provider-456',
    isActive: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render an active provider correctly', () => {
    render(
      <AiProviderCard
        aiProvider={activeProvider}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('openai')).toBeInTheDocument();
    expect(screen.getByText('Main OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    const logo = screen.getByAltText('Logo openai');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/mock-logo-openai.png');
  });

  it('should render an inactive provider without the active badge', () => {
    render(
      <AiProviderCard
        aiProvider={inactiveProvider}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('openai')).toBeInTheDocument();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('should call onEdit with the provider data when the edit button is clicked', () => {
    render(
      <AiProviderCard
        aiProvider={activeProvider}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByTitle('Edit Provider');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(activeProvider);
  });

  it('should call onDelete with the provider id when the delete button is clicked', () => {
    render(
      <AiProviderCard
        aiProvider={activeProvider}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByTitle('Delete Provider');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith('provider-123');
  });
});
