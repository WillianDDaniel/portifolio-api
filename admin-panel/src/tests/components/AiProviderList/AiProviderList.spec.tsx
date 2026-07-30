import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import AiProvidersList from '@/components/AiProviderList';
import type { AIProvider } from '@/typings/AiProvider';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
  }),
}));

vi.mock('@/components/Heading', () => ({
  default: ({ title }: any) => <h3 data-testid="heading">{title}</h3>,
}));

vi.mock('@/components/AiProviderCard', () => ({
  default: ({ aiProvider, onEdit, onDelete }: any) => (
    <div data-testid={`provider-card-${aiProvider.id}`}>
      <span>{aiProvider.name}</span>
      <button onClick={() => onEdit(aiProvider)} data-testid={`edit-${aiProvider.id}`}>Edit</button>
      <button onClick={() => onDelete(aiProvider.id)} data-testid={`delete-${aiProvider.id}`}>Delete</button>
    </div>
  ),
}));

describe('AiProvidersList Component', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const mockProviders: AIProvider[] = [
    {
      id: '1',
      name: 'First Provider',
      provider: 'openai',
      key: 'key-1',
      isActive: true,
    },
    {
      id: '2',
      name: 'Second Provider',
      provider: 'groq',
      key: 'key-2',
      isActive: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render anything when providers array is empty', () => {
    const { container } = render(
      <AiProvidersList providers={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should not render anything when providers is undefined', () => {
    const { container } = render(
      <AiProvidersList providers={undefined as unknown as AIProvider[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should render the heading and provider cards correctly', () => {
    render(
      <AiProvidersList providers={mockProviders} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByTestId('heading')).toHaveTextContent('Registered Providers');

    expect(screen.getByTestId('provider-card-1')).toBeInTheDocument();
    expect(screen.getByText('First Provider')).toBeInTheDocument();

    expect(screen.getByTestId('provider-card-2')).toBeInTheDocument();
    expect(screen.getByText('Second Provider')).toBeInTheDocument();
  });

  it('should pass the correct props to the provider cards', () => {
    render(
      <AiProvidersList providers={mockProviders} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    fireEvent.click(screen.getByTestId('edit-1'));
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockProviders[0]);

    fireEvent.click(screen.getByTestId('delete-2'));
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith('2');
  });
});
