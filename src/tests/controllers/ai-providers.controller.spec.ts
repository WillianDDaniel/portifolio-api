import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  createAiProvider,
  updateAiProvider,
  deleteAiProvider,
} from '../../controllers/ai-providers.controller.js';

import { findGlobalSettings } from '../../repositories/settings.repository.js';
import {
  createAiProviderRecord,
  updateAiProviderRecord,
  deleteAiProviderRecord,
} from '../../repositories/ai-providers.repository.js';

vi.mock('../../repositories/settings.repository.js', () => ({
  findGlobalSettings: vi.fn(),
}));

vi.mock('../../repositories/ai-providers.repository.js', () => ({
  createAiProviderRecord: vi.fn(),
  updateAiProviderRecord: vi.fn(),
  deleteAiProviderRecord: vi.fn(),
}));

describe('AI Providers Controller', () => {
  let mockContext: any;

  const validPayload = {
    name: 'OpenAI Provider',
    provider: 'openai' as const,
    key: 'sk-test-key-1234567890',
    isActive: true,
  };

  beforeEach(() => {
    vi.resetAllMocks();

    mockContext = {
      req: {
        json: vi.fn(),
        param: vi.fn(),
      },
      json: vi.fn((data, status = 200) => ({ data, status })),
    };
  });

  describe('createAiProvider', () => {
    it('should create an AI provider and return 201 with the created record', async () => {
      const mockSettings = { id: 'settings-123' };
      const mockCreatedProvider = { id: 'provider-123', ...validPayload, settingsId: 'settings-123' };

      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findGlobalSettings).mockResolvedValue(mockSettings as any);
      vi.mocked(createAiProviderRecord).mockResolvedValue(mockCreatedProvider as any);

      const result = await createAiProvider(mockContext);

      expect(findGlobalSettings).toHaveBeenCalled();
      expect(createAiProviderRecord).toHaveBeenCalledWith({
        ...validPayload,
        settingsId: 'settings-123',
      });
      expect(mockContext.json).toHaveBeenCalledWith(mockCreatedProvider, 201);
      expect(result.status).toBe(201);
    });

    it('should return 404 if global settings do not exist', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findGlobalSettings).mockResolvedValue(null as any);

      const result = await createAiProvider(mockContext);

      expect(findGlobalSettings).toHaveBeenCalled();
      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'settings.error.not_found', message: 'Settings not found' },
        404
      );
      expect(result.status).toBe(404);
    });

    it('should return 422 if repository fail to create the record', async () => {
      const mockSettings = { id: 'settings-123' };
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findGlobalSettings).mockResolvedValue(mockSettings as any);
      vi.mocked(createAiProviderRecord).mockResolvedValue(null as any);

      const result = await createAiProvider(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'ai_providers.error.create', message: 'AI Provider not created' },
        422
      );
      expect(result.status).toBe(422);
    });

    it('should return 500 if an error occurs during execution', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(findGlobalSettings).mockRejectedValue(new Error('Unexpected error'));

      const result = await createAiProvider(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'ai_providers.error.create', message: 'Unexpected error' },
        500
      );
      expect(result.status).toBe(500);
    });

    it('should return 400 if the key is empty or missing', async () => {
      const invalidPayload = { ...validPayload, key: '   ' };
      mockContext.req.json.mockResolvedValue(invalidPayload);

      const result = await createAiProvider(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        {
          error: 'settings.error.ai_provider_key_required',
          message: 'Key is required for new providers'
        },
        400
      );
      expect(result.status).toBe(400);
    });
  });

  describe('updateAiProvider', () => {
    beforeEach(() => {
      mockContext.req.param.mockReturnValue('provider-123');
    });

    it('should update the AI provider and return 200 with the updated record', async () => {
      const mockUpdatedProvider = { id: 'provider-123', ...validPayload, settingsId: 'settings-123' };

      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(updateAiProviderRecord).mockResolvedValue(mockUpdatedProvider as any);

      const result = await updateAiProvider(mockContext);

      expect(mockContext.req.param).toHaveBeenCalledWith('id');
      expect(updateAiProviderRecord).toHaveBeenCalledWith('provider-123', validPayload);
      expect(mockContext.json).toHaveBeenCalledWith(mockUpdatedProvider, 200);
      expect(result.status).toBe(200);
    });

    it('should return 422 if repository fails to update the record', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(updateAiProviderRecord).mockResolvedValue(null as any);

      const result = await updateAiProvider(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'ai_providers.error.update', message: 'AI Provider not updated' },
        422
      );
      expect(result.status).toBe(422);
    });

    it('should return 500 if repository throws an error', async () => {
      mockContext.req.json.mockResolvedValue(validPayload);
      vi.mocked(updateAiProviderRecord).mockRejectedValue(new Error('DB failure'));

      const result = await updateAiProvider(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'ai_providers.error.update', message: 'DB failure' },
        500
      );
      expect(result.status).toBe(500);
    });
  });

  describe('deleteAiProvider', () => {
    beforeEach(() => {
      mockContext.req.param.mockReturnValue('provider-123');
    });

    it('should delete the AI provider and return 200 with the deleted record info', async () => {
      const mockDeletedProvider = { id: 'provider-123' };

      vi.mocked(deleteAiProviderRecord).mockResolvedValue(mockDeletedProvider as any);

      const result = await deleteAiProvider(mockContext);

      expect(mockContext.req.param).toHaveBeenCalledWith('id');
      expect(deleteAiProviderRecord).toHaveBeenCalledWith('provider-123');
      expect(mockContext.json).toHaveBeenCalledWith(mockDeletedProvider, 200);
      expect(result.status).toBe(200);
    });

    it('should return 422 if repository fails to delete the record', async () => {
      vi.mocked(deleteAiProviderRecord).mockResolvedValue(null as any);

      const result = await deleteAiProvider(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'ai_providers.error.delete', message: 'AI Provider not deleted' },
        422
      );
      expect(result.status).toBe(422);
    });

    it('should return 500 if repository throws an error during deletion', async () => {
      vi.mocked(deleteAiProviderRecord).mockRejectedValue(new Error('Deletion failed'));

      const result = await deleteAiProvider(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: 'ai_providers.error.delete', message: 'Deletion failed' },
        500
      );
      expect(result.status).toBe(500);
    });
  });
});
