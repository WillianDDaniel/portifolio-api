import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SaveButton from '@/components/Buttons/SaveButton';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
  }),
}));

describe('SaveButton Component', () => {
  it('should render the default save label when not submitting', () => {
    render(<SaveButton isSubmitting={false} />);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('should render the custom label when provided and not submitting', () => {
    render(<SaveButton isSubmitting={false} customLabel="Create Project" />);

    const button = screen.getByRole('button', { name: 'Create Project' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('should render the saving label and be disabled when submitting', () => {
    render(<SaveButton isSubmitting={true} />);

    const button = screen.getByRole('button', { name: 'Saving...' });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('should render the saving label when submitting even if a custom label is provided', () => {
    render(<SaveButton isSubmitting={true} customLabel="Update User" />);

    const button = screen.getByRole('button', { name: 'Saving...' });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(screen.queryByText('Update User')).not.toBeInTheDocument();
  });

  it('should have submit type attribute', () => {
    render(<SaveButton isSubmitting={false} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });
});
