import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AiProviderSection from '@/components/AiProviderSection';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const enTranslations: Record<string, string> = {
        'pages.settings.sections.ai_provider.title': 'Artificial Intelligence',
        'pages.settings.sections.ai_provider.description': 'Register and manage your API keys for content generation.',
        'pages.settings.buttons.new_provider': '+ Add Provider'
      };
      return enTranslations[key] || options?.defaultValue || key;
    },
  }),
}));

vi.mock('@/components/Heading', () => ({
  default: ({ title }: any) => <h2 data-testid="heading">{title}</h2>,
}));

vi.mock('@/components/SubTitle', () => ({
  default: ({ content }: any) => <p data-testid="subtitle">{content}</p>,
}));

vi.mock('@/components/GlobalError', () => ({
  default: ({ error, message }: any) => error ? <div data-testid="global-error">{message}</div> : null,
}));

vi.mock('@/components/AiProviderForm', () => ({
  default: ({ isEditing, onCancelEdit }: any) => (
    <div data-testid="ai-provider-form">
      <span data-testid="form-mode">{isEditing ? 'editing' : 'adding'}</span>
      <button onClick={onCancelEdit} data-testid="cancel-button">Cancel</button>
    </div>
  ),
}));

describe('AiProviderSection Component', () => {
  const mockRegister = vi.fn();
  const mockOnSubmitAction = vi.fn();
  const mockOnCancelEdit = vi.fn();

  const defaultProps = {
    register: mockRegister as any,
    errors: {},
    isSubmitting: false,
    globalError: null,
    onSubmitAction: mockOnSubmitAction,
    isEditing: false,
    onCancelEdit: mockOnCancelEdit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render heading, subtitle, children, and add button correctly', () => {
    render(
      <AiProviderSection {...defaultProps}>
        <div data-testid="child-element">Provider List</div>
      </AiProviderSection>
    );

    expect(screen.getByTestId('heading')).toHaveTextContent('Artificial Intelligence');
    expect(screen.getByTestId('subtitle')).toHaveTextContent('Register and manage your API keys for content generation.');
    expect(screen.getByTestId('child-element')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: '+ Add Provider' })).toBeInTheDocument();
    expect(screen.queryByTestId('ai-provider-form')).not.toBeInTheDocument();
  });

  it('should display the GlobalError component when there is a global error', () => {
    render(
      <AiProviderSection {...defaultProps} globalError="Something went wrong">
        <div />
      </AiProviderSection>
    );

    expect(screen.getByTestId('global-error')).toHaveTextContent('Something went wrong');
  });

  it('should show the AiProviderForm and hide the add button when + Add Provider is clicked', () => {
    render(
      <AiProviderSection {...defaultProps}>
        <div />
      </AiProviderSection>
    );

    const addButton = screen.getByRole('button', { name: '+ Add Provider' });
    fireEvent.click(addButton);

    expect(screen.queryByRole('button', { name: '+ Add Provider' })).not.toBeInTheDocument();
    expect(screen.getByTestId('ai-provider-form')).toBeInTheDocument();
    expect(screen.getByTestId('form-mode')).toHaveTextContent('adding');
  });

  it('should automatically show the AiProviderForm in editing mode when isEditing is true', () => {
    render(
      <AiProviderSection {...defaultProps} isEditing={true}>
        <div />
      </AiProviderSection>
    );

    expect(screen.queryByRole('button', { name: '+ Add Provider' })).not.toBeInTheDocument();
    expect(screen.getByTestId('ai-provider-form')).toBeInTheDocument();
    expect(screen.getByTestId('form-mode')).toHaveTextContent('editing');
  });

  it('should call onCancelEdit and close the local form when cancel button is clicked', () => {
    render(
      <AiProviderSection {...defaultProps}>
        <div />
      </AiProviderSection>
    );

    const addButton = screen.getByRole('button', { name: '+ Add Provider' });
    fireEvent.click(addButton);

    expect(screen.getByTestId('ai-provider-form')).toBeInTheDocument();

    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);

    expect(mockOnCancelEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('ai-provider-form')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add Provider' })).toBeInTheDocument();
  });
});
