import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AiProviderForm from '@/components/AiProviderForm';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
  }),
}));

vi.mock('@/components/Input', () => ({
  default: React.forwardRef(({ label, children, ...props }: any, ref: any) => (
    <div data-testid={`wrapper-${props.id}`}>
      <label htmlFor={props.id}>{label}</label>
      <input ref={ref} data-testid={`input-${props.id}`} {...props} />
      {children}
    </div>
  )),
}));

vi.mock('@/components/Select', () => ({
  default: React.forwardRef(({ label, options, ...props }: any, ref: any) => (
    <div data-testid={`wrapper-${props.id}`}>
      <label htmlFor={props.id}>{label}</label>
      <select ref={ref} data-testid={`select-${props.id}`} {...props}>
        {options?.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )),
}));

vi.mock('@/components/FormError', () => ({
  default: ({ error, message }: any) => error ? <span data-testid={`error-${message}`}>{message}</span> : null,
}));

vi.mock('@/components/IconWrapper', () => ({
  default: ({ children }: any) => <span data-testid="icon-wrapper">{children}</span>,
}));

vi.mock('@/components/Buttons/SaveButton', () => ({
  default: ({ customLabel, isSubmitting }: any) => (
    <button type="submit" disabled={isSubmitting} data-testid="save-button">
      {customLabel}
    </button>
  ),
}));

describe('AiProviderForm Component', () => {
  const mockRegister = vi.fn();
  const mockOnSubmitAction = vi.fn((e) => {
    e?.preventDefault();
    return Promise.resolve();
  });
  const mockOnCancelEdit = vi.fn();

  const defaultProps = {
    register: mockRegister as any,
    errors: {},
    isSubmitting: false,
    onSubmitAction: mockOnSubmitAction,
    isEditing: false,
    onCancelEdit: mockOnCancelEdit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the create form correctly', () => {
    render(<AiProviderForm {...defaultProps} />);

    expect(screen.getByText('Key Name')).toBeInTheDocument();
    expect(screen.getByTestId('input-providerApiKeyName')).toBeInTheDocument();

    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByTestId('select-provider')).toBeInTheDocument();

    expect(screen.getByText('API Key')).toBeInTheDocument();
    expect(screen.getByTestId('input-providerApiKey')).toBeInTheDocument();

    expect(screen.getByLabelText('Active')).toBeInTheDocument();
    expect(screen.getByTestId('save-button')).toHaveTextContent('Save Provider');
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('should render the edit form correctly', () => {
    render(<AiProviderForm {...defaultProps} isEditing={true} />);

    expect(screen.getByTestId('save-button')).toHaveTextContent('Update Provider');
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should disable the save button when isSubmitting is true', () => {
    render(<AiProviderForm {...defaultProps} isSubmitting={true} />);

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeDisabled();
  });

  it('should disable the cancel button when isSubmitting is true', () => {
    render(<AiProviderForm {...defaultProps} isEditing={true} isSubmitting={true} />);

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeDisabled();
  });

  it('should call onCancelEdit when the cancel button is clicked', () => {
    render(<AiProviderForm {...defaultProps} isEditing={true} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancelEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onSubmitAction when the form is submitted', () => {
    render(<AiProviderForm {...defaultProps} />);

    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);

    expect(mockOnSubmitAction).toHaveBeenCalledTimes(1);
  });

  it('should display error messages when errors are provided', () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        name: { type: 'required', message: 'Name is required' },
        provider: { type: 'required', message: 'Provider is required' },
        key: { type: 'required', message: 'API Key is required' },
      } as any,
    };

    render(<AiProviderForm {...propsWithErrors} />);

    expect(screen.getByTestId('error-Name is required')).toBeInTheDocument();
    expect(screen.getByTestId('error-Provider is required')).toBeInTheDocument();
    expect(screen.getByTestId('error-API Key is required')).toBeInTheDocument();
  });
});
