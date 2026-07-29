import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockModel = { mockModelId: 'mock-model-instance' };
const mockModelProvider = vi.fn().mockReturnValue(mockModel);

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => mockModelProvider),
}));

vi.mock('ai', () => ({
  streamText: vi.fn(),
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogle: vi.fn(() => mockModelProvider),
}));

import { AiService } from '../../services/ai.service.js';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogle } from '@ai-sdk/google';
import { streamText } from 'ai';

describe('AiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize successfully with openai provider', () => {
      const service = new AiService('openai', 'gpt-4o', 'sk-openai-key');

      expect(createOpenAI).toHaveBeenCalledWith({
        apiKey: 'sk-openai-key',
      });
      expect(mockModelProvider).toHaveBeenCalledWith('gpt-4o');
      expect(service['model']).toBe(mockModel);
    });

    it('should initialize successfully with groq provider', () => {
      const service = new AiService('groq', 'llama-3-70b', 'gsk_groq-key');

      expect(createOpenAI).toHaveBeenCalledWith({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: 'gsk_groq-key',
      });
      expect(mockModelProvider).toHaveBeenCalledWith('llama-3-70b');
      expect(service['model']).toBe(mockModel);
    });

    it('should throw error when provider is unsupported', () => {
      expect(() => {
        new AiService('unsupported' as any, 'some-model', 'some-key');
      }).toThrow('Provedor não suportado: unsupported');
    });

    it('should initialize successfully with gemini provider', () => {
      const service = new AiService('gemini', 'gemini-1.5-pro', 'gemini-api-key-123');

      expect(createGoogle).toHaveBeenCalledWith({
        apiKey: 'gemini-api-key-123',
      });
      expect(mockModelProvider).toHaveBeenCalledWith('gemini-1.5-pro');
      expect(service['model']).toBe(mockModel);
    });
  });

  describe('streamHtmlContent', () => {
    it('should call streamText with correct parameters', async () => {
      const service = new AiService('openai', 'gpt-4o', 'sk-key');
      const systemPrompt = 'you are a helpful assistant';
      const userPrompt = 'generate html content';
      const mockResult = { textStream: {} };

      vi.mocked(streamText).mockReturnValue(mockResult as any);

      const result = await service.streamHtmlContent(systemPrompt, userPrompt);

      expect(streamText).toHaveBeenCalledWith({
        model: mockModel,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.1,
      });
      expect(result).toBe(mockResult);
    });
  });
});
