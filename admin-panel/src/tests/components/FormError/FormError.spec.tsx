import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FormError from '@/components/FormError';

describe('FormError Component', () => {
  it('should render the error message when error is true', () => {
    render(<FormError error={true} message="This field is required" />);

    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toBeInTheDocument();
  });

  it('should not render anything when error is false', () => {
    const { container } = render(<FormError error={false} message="This field is required" />);

    expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('should apply the correct CSS classes to the error message', () => {
    render(<FormError error={true} message="Invalid input" />);

    const errorMessage = screen.getByText('Invalid input');
    expect(errorMessage).toHaveClass('mt-1', 'text-sm', 'text-red-500');
  });
});
