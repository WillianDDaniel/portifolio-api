import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import Heading from '@/components/Heading';

describe('Componente Heading', () => {
  it('deve renderizar o nivel 1 corretamente sem icone', () => {
    render(<Heading level={1} title="Titulo Nivel Um" />);

    const elemento = screen.getByRole('heading', { level: 1 });
    expect(elemento).toBeInTheDocument();
    expect(elemento).toHaveTextContent('Titulo Nivel Um');
    expect(elemento).toHaveClass('text-2xl', 'font-bold', 'text-gray-900', 'dark:text-white');
  });

  it('deve renderizar o nivel 1 corretamente com icone', () => {
    render(<Heading level={1} title="Titulo Nivel Um" icon="🚀" />);

    const elemento = screen.getByRole('heading', { level: 1 });
    expect(elemento).toBeInTheDocument();
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('deve renderizar o nivel 2 corretamente sem icone', () => {
    render(<Heading level={2} title="Titulo Nivel Dois" />);

    const elemento = screen.getByRole('heading', { level: 2 });
    expect(elemento).toBeInTheDocument();
    expect(elemento).toHaveTextContent('Titulo Nivel Dois');
    expect(elemento).toHaveClass('text-xl', 'font-semibold', 'text-gray-800', 'dark:text-gray-100');
  });

  it('deve renderizar o nivel 2 corretamente com icone', () => {
    render(<Heading level={2} title="Titulo Nivel Dois" icon="⭐" />);

    const elemento = screen.getByRole('heading', { level: 2 });
    expect(elemento).toBeInTheDocument();
    expect(screen.getByText('⭐')).toBeInTheDocument();
  });

  it('deve renderizar o nivel 3 corretamente sem icone', () => {
    render(<Heading level={3} title="Titulo Nivel Tres" />);

    const elemento = screen.getByRole('heading', { level: 3 });
    expect(elemento).toBeInTheDocument();
    expect(elemento).toHaveTextContent('Titulo Nivel Tres');
    expect(elemento).toHaveClass('text-lg', 'font-medium', 'text-gray-700', 'dark:text-gray-200');
  });

  it('deve renderizar o nivel 3 corretamente com icone', () => {
    render(<Heading level={3} title="Titulo Nivel Tres" icon="🔥" />);

    const elemento = screen.getByRole('heading', { level: 3 });
    expect(elemento).toBeInTheDocument();
    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  it('deve renderizar o padrao para niveis invalidos sem icone', () => {
    render(<Heading level={99} title="Titulo Padrao" />);

    const elemento = screen.getByRole('heading', { level: 1 });
    expect(elemento).toBeInTheDocument();
    expect(elemento).toHaveTextContent('Titulo Padrao');
    expect(elemento).toHaveClass('text-2xl', 'font-bold', 'text-gray-900', 'dark:text-white');
  });

  it('deve renderizar o padrao para niveis invalidos com icone', () => {
    render(<Heading level={99} title="Titulo Padrao" icon="⚠️" />);

    const elemento = screen.getByRole('heading', { level: 1 });
    expect(elemento).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });
});
