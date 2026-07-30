import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import ProjectForm from '@/components/ProjectForm';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue: string }) => options?.defaultValue || key
  })
}));

vi.mock('@/components/Input', () => ({
  default: React.forwardRef(({ label, children, ...props }: any, ref: any) => (
    <div>
      <label>{label}</label>
      <input {...props} ref={ref} data-testid={`mock-input-${props.id}`} />
      {children}
    </div>
  ))
}));

vi.mock('@/components/Select', () => ({
  default: React.forwardRef(({ label, ...props }: any, ref: any) => (
    <div>
      <label>{label}</label>
      <select {...props} ref={ref} data-testid={`mock-select-${props.id}`} />
    </div>
  ))
}));

vi.mock('@/components/Textarea', () => ({
  default: React.forwardRef(({ label, ...props }: any, ref: any) => (
    <div>
      <label>{label}</label>
      <textarea {...props} ref={ref} data-testid={`mock-textarea-${props.id}`} />
    </div>
  ))
}));

vi.mock('@/components/FormError', () => ({
  default: ({ error, message }: any) => error ? <span data-testid="mock-form-error">{message}</span> : null
}));

vi.mock('@/components/ImageSelector', () => ({
  default: () => <div data-testid="mock-image-selector" />
}));

vi.mock('@/components/IconWrapper', () => ({
  default: ({ children }: any) => <span data-testid="mock-icon-wrapper">{children}</span>
}));

vi.mock('@/components/Buttons/SaveButton', () => ({
  default: ({ isSubmitting, customLabel }: any) => (
    <button type="submit" disabled={isSubmitting}>{customLabel}</button>
  )
}));

const mockFields = [
  { id: 'uuid-1', language: 'en', title: 'React Project', description: 'Advanced Project' }
];

const mockRegister = vi.fn().mockReturnValue({
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
  name: 'test'
});

const mockProps = {
  register: mockRegister,
  errors: {} as any,
  fields: mockFields as any,
  appendTranslation: vi.fn(),
  removeTranslation: vi.fn(),
  imagePreview: null,
  isSubmitting: false,
  globalError: null,
  handleFileChange: vi.fn(),
  onSubmitAction: vi.fn((e) => e.preventDefault())
};

describe('ProjectForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the form and its elements correctly', async () => {
    render(<ProjectForm {...mockProps} />);


    expect(await screen.findByText('Content & Translations')).toBeInTheDocument();

    expect(screen.getByTestId('mock-image-selector')).toBeInTheDocument();
    expect(screen.getByTestId('mock-input-liveUrl')).toBeInTheDocument();
    expect(screen.getByTestId('mock-input-repoUrl')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Save Project' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add Language' })).toBeInTheDocument();
  });

  it('should display an error message if globalError prop is provided', () => {
    render(<ProjectForm {...mockProps} globalError="An unexpected error occurred" />);

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('should disable the submit button when isSubmitting is true', () => {
    render(<ProjectForm {...mockProps} isSubmitting={true} />);

    const submitButton = screen.getByRole('button', { name: 'Save Project' });
    expect(submitButton).toBeDisabled();
  });

  it('should call onSubmitAction when the form is submitted', async () => {
    const user = userEvent.setup();
    render(<ProjectForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: 'Save Project' });
    await user.click(submitButton);

    expect(mockProps.onSubmitAction).toHaveBeenCalledTimes(1);
  });

  it('should call appendTranslation when add language button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProjectForm {...mockProps} />);

    const addLanguageButton = screen.getByRole('button', { name: '+ Add Language' });
    await user.click(addLanguageButton);

    expect(mockProps.appendTranslation).toHaveBeenCalledTimes(1);
  });

  it('should call removeTranslation when the delete button is clicked on secondary translation', async () => {
    const fieldsWithMultiple = [
      ...mockFields,
      { id: 'uuid-2', language: 'pt', title: 'Projeto PT', description: 'Descrição PT' }
    ];

    const user = userEvent.setup();
    render(<ProjectForm {...mockProps} fields={fieldsWithMultiple as any} />);

    const removeButtons = screen.getAllByTitle('Delete');
    await user.click(removeButtons[0]);

    expect(mockProps.removeTranslation).toHaveBeenCalledTimes(1);
    expect(mockProps.removeTranslation).toHaveBeenCalledWith(1);
  });

  it('should render form errors when validation errors exist for main fields', () => {
    const mockErrors = {
      liveUrl: { message: 'errors.invalid_url', type: 'pattern' },
      repoUrl: { message: 'errors.invalid_url', type: 'pattern' }
    };

    render(<ProjectForm {...mockProps} errors={mockErrors as any} />);

    const errorMessages = screen.getAllByText('errors.invalid_url');
    expect(errorMessages).toHaveLength(2);
  });

  it('should render form errors when validation errors exist for translation fields', () => {
    const mockErrorsWithTranslations = {
      translations: [
        { title: { message: 'errors.title_required', type: 'required' } }
      ]
    };

    render(<ProjectForm {...mockProps} errors={mockErrorsWithTranslations as any} />);

    expect(screen.getByText('errors.title_required')).toBeInTheDocument();
  });

  it('should NOT render delete button for the first translation', () => {
    render(<ProjectForm {...mockProps} fields={[mockFields[0]] as any} />);

    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
  });

  it('should NOT render form errors when fields are valid', () => {
    render(<ProjectForm {...mockProps} errors={{}} />);

    expect(screen.queryByTestId('mock-form-error')).not.toBeInTheDocument();
  });
});
