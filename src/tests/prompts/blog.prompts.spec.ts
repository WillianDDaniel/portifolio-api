import { describe, it, expect } from 'vitest';
import { BlogPrompts, BlogPostPromptContext } from '../../prompts/blog.prompts.js';

describe('BlogPrompts', () => {
  const context: BlogPostPromptContext = {
    title: 'Meu Post Incrível',
    slug: 'meu-post-incrivel',
    excerpt: 'Um resumo de teste sobre o post.',
    language: 'pt',
  };

  describe('buildHtmlSystemPrompt', () => {
    it('should return Portuguese prompt when language is pt', () => {
      const result = BlogPrompts.buildHtmlSystemPrompt({
        ...context,
        language: 'pt',
      });

      expect(result).toContain('Você é um redator sênior especialista em SEO');
      expect(result).toContain('PORTUGUÊS (BR)');
      expect(result).toContain(`Título: ${context.title}`);
      expect(result).toContain(`Resumo/Direção (Excerpt): ${context.excerpt}`);
      expect(result).toContain(`Slug (URL - Use para entender as palavras-chave principais): ${context.slug}`);
    });

    it('should return Spanish prompt when language is es', () => {
      const result = BlogPrompts.buildHtmlSystemPrompt({
        ...context,
        language: 'es',
      });

      expect(result).toContain('Eres un redactor senior experto en SEO');
      expect(result).toContain('ESPAÑOL');
      expect(result).toContain(`Título: ${context.title}`);
      expect(result).toContain(`Resumen/Dirección (Excerpt): ${context.excerpt}`);
      expect(result).toContain(`Slug (URL - Úsalo para entender las palabras clave principales): ${context.slug}`);
    });

    it('should return English prompt when language is en', () => {
      const result = BlogPrompts.buildHtmlSystemPrompt({
        ...context,
        language: 'en',
      });

      expect(result).toContain('You are a senior SEO and Copywriting expert');
      expect(result).toContain('ENGLISH');
      expect(result).toContain(`Title: ${context.title}`);
      expect(result).toContain(`Summary/Direction (Excerpt): ${context.excerpt}`);
      expect(result).toContain(`Slug (URL - Use to understand main keywords): ${context.slug}`);
    });

    it('should default to English prompt when language is unsupported or default', () => {
      const result = BlogPrompts.buildHtmlSystemPrompt({
        ...context,
        language: 'fr' as any, // force unsupported language
      });

      expect(result).toContain('You are a senior SEO and Copywriting expert');
      expect(result).toContain('ENGLISH');
      expect(result).toContain(`Title: ${context.title}`);
    });
  });

  describe('getUserPrompt', () => {
    it('should return Portuguese user prompt for pt', () => {
      const result = BlogPrompts.getUserPrompt('pt');
      expect(result).toBe('Desenvolva o texto principal com alta qualidade e profundidade.');
    });

    it('should return Spanish user prompt for es', () => {
      const result = BlogPrompts.getUserPrompt('es');
      expect(result).toBe('Escriba el texto principal con alta calidad y profundidad.');
    });

    it('should return English user prompt for en', () => {
      const result = BlogPrompts.getUserPrompt('en');
      expect(result).toBe('Write the main text with high quality and depth.');
    });

    it('should return English user prompt for unsupported or default language', () => {
      const result = BlogPrompts.getUserPrompt('fr');
      expect(result).toBe('Write the main text with high quality and depth.');
    });
  });

  describe('handleContent', () => {
    it('should return content if provided', () => {
      expect(BlogPrompts.handleContent('My valid content', 'pt')).toBe('My valid content');
    });

    it('should return Portuguese default string if content is missing and language is pt', () => {
      expect(BlogPrompts.handleContent(undefined, 'pt')).toBe('Não informado');
      expect(BlogPrompts.handleContent(null, 'pt')).toBe('Não informado');
      expect(BlogPrompts.handleContent('', 'pt')).toBe('Não informado');
    });

    it('should return Spanish default string if content is missing and language is es', () => {
      expect(BlogPrompts.handleContent(undefined, 'es')).toBe('No informado');
    });

    it('should return English default string if content is missing and language is en', () => {
      expect(BlogPrompts.handleContent(undefined, 'en')).toBe('Not Informed');
    });

    it('should return English default string if content is missing and language is unsupported', () => {
      expect(BlogPrompts.handleContent(undefined, 'fr')).toBe('Not Informed');
    });
  });

  describe('buildStylingSystemPrompt', () => {
    it('should return Portuguese styling prompt for pt', () => {
      const result = BlogPrompts.buildStylingSystemPrompt('pt');
      expect(result).toContain('Você é um Engenheiro Front-end especialista em Tailwind CSS.');
      expect(result).toContain('Sua ÚNICA função é atuar como um injetor de Tailwind CSS.');
    });

    it('should return Spanish styling prompt for es', () => {
      const result = BlogPrompts.buildStylingSystemPrompt('es');
      expect(result).toContain('Eres un Ingeniero Front-end experto en Tailwind CSS.');
      expect(result).toContain('Sua ÚNICA função é atuar como um injetor de Tailwind CSS.'); // As commonRules estão em PT no seu código
    });

    it('should return English styling prompt for en', () => {
      const result = BlogPrompts.buildStylingSystemPrompt('en');
      expect(result).toContain('You are a Frontend Engineer expert in Tailwind CSS.');
      expect(result).toContain('Sua ÚNICA função é atuar como um injetor de Tailwind CSS.');
    });

    it('should return English styling prompt as default for unsupported language', () => {
      const result = BlogPrompts.buildStylingSystemPrompt('fr' as any);
      expect(result).toContain('You are a Frontend Engineer expert in Tailwind CSS.');
    });
  });

  describe('getStylingUserPrompt', () => {
    const mockHtml = '<p>Test paragraph</p>';

    it('should return Portuguese instruction for pt', () => {
      const result = BlogPrompts.getStylingUserPrompt(mockHtml, 'pt');
      expect(result).toContain('Reescreva o HTML abaixo injetando as classes Tailwind nas tags:');
      expect(result).toContain(mockHtml);
    });

    it('should return Spanish instruction for es', () => {
      const result = BlogPrompts.getStylingUserPrompt(mockHtml, 'es');
      expect(result).toContain('Reescribe el HTML a continuación inyectando las clases Tailwind en las etiquetas:');
      expect(result).toContain(mockHtml);
    });

    it('should return English instruction for en', () => {
      const result = BlogPrompts.getStylingUserPrompt(mockHtml, 'en');
      expect(result).toContain('Rewrite the HTML below by injecting Tailwind classes into the tags:');
      expect(result).toContain(mockHtml);
    });

    it('should return English instruction as default for unsupported language', () => {
      const result = BlogPrompts.getStylingUserPrompt(mockHtml, 'fr' as any);
      expect(result).toContain('Rewrite the HTML below by injecting Tailwind classes into the tags:');
      expect(result).toContain(mockHtml);
    });
  });
});
