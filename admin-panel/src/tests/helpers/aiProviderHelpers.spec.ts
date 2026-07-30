import { describe, it, expect } from 'vitest';
import { getProviderLogo } from '@/helpers/aiProviderHelpers';

describe('getProviderLogo', () => {
  it('should return the openai logo path when providerType is openai', () => {
    const result = getProviderLogo('openai');
    expect(result).toBe('/public/openai.png');
  });

  it('should return the gemini logo path when providerType is gemini', () => {
    const result = getProviderLogo('gemini');
    expect(result).toBe('/public/gemini.png');
  });

  it('should return the groq logo path when providerType is groq', () => {
    const result = getProviderLogo('groq');
    expect(result).toBe('/public/groq-ai.png');
  });

  it('should return the default logo path when providerType is unknown', () => {
    const result = getProviderLogo('unknown');
    expect(result).toBe('default.svg');
  });

  it('should return the default logo path when providerType is an empty string', () => {
    const result = getProviderLogo('');
    expect(result).toBe('default.svg');
  });
});
