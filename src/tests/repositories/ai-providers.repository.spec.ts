import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    eq: vi.fn(),
  };
});

vi.mock('../../db/index.js', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn(),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    }),
  },
}));

import {
  findAiProviderById,
  createAiProviderRecord,
  updateAiProviderRecord,
  deleteAiProviderRecord,
} from '../../repositories/ai-providers.repository.js';

import { db } from '../../db/index.js';
import { aiProviders } from '../../db/schema.js';

describe('AI Providers Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAiProviderRecord', () => {
    it('should create an AI provider record and return it', async () => {
      const dataInput = {
        settingsId: 'settings-123',
        name: 'OpenAI Test',
        provider: 'openai' as const,
        key: 'sk-test-key',
        isActive: true,
      };

      const mockProvider = {
        id: 'provider-123',
        ...dataInput,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockProvider]);
      const mockInsertChain = {
        values: vi.fn().mockReturnThis(),
        returning: mockReturning,
      };

      vi.mocked(db.insert).mockReturnValue(mockInsertChain as any);

      const result = await createAiProviderRecord(dataInput);

      expect(db.insert).toHaveBeenCalledWith(aiProviders);
      expect(mockInsertChain.values).toHaveBeenCalledWith(dataInput);
      expect(mockReturning).toHaveBeenCalled();
      expect(result).toEqual(mockProvider);
    });

    it('should return null if the provider is not created', async () => {
      const dataInput = {
        settingsId: 'settings-123',
        name: 'OpenAI Test',
        provider: 'openai' as const,
        key: 'sk-test-key',
        isActive: true,
      };

      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockInsertChain = {
        values: vi.fn().mockReturnThis(),
        returning: mockReturning,
      };

      vi.mocked(db.insert).mockReturnValue(mockInsertChain as any);

      const result = await createAiProviderRecord(dataInput);

      expect(result).toBeNull();
    });
  });

  describe('updateAiProviderRecord', () => {
    it('should update and return the updated AI provider record', async () => {
      const id = 'provider-123';
      const dataInput = {
        name: 'OpenAI Test Updated',
        isActive: false,
      };

      const mockUpdatedProvider = {
        id,
        settingsId: 'settings-123',
        name: 'OpenAI Test Updated',
        provider: 'openai' as const,
        key: 'sk-test-key',
        isActive: false,
        createdAt: new Date(),
        updatedAt: expect.any(Date),
      };

      const mockReturning = vi.fn().mockResolvedValue([mockUpdatedProvider]);
      const mockUpdateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: mockReturning,
      };

      vi.mocked(db.update).mockReturnValue(mockUpdateChain as any);

      const result = await updateAiProviderRecord(id, dataInput);

      expect(db.update).toHaveBeenCalledWith(aiProviders);
      expect(mockUpdateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'OpenAI Test Updated',
          isActive: false,
          updatedAt: expect.any(Date),
        })
      );
      expect(mockUpdateChain.where).toHaveBeenCalled();
      expect(mockReturning).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedProvider);
    });

    it('should return null if the record was not updated', async () => {
      const id = 'provider-123';
      const mockReturning = vi.fn().mockResolvedValue([]);
      const mockUpdateChain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: mockReturning,
      };

      vi.mocked(db.update).mockReturnValue(mockUpdateChain as any);

      const result = await updateAiProviderRecord(id, { name: 'New Name' });

      expect(result).toBeNull();
    });
  });

  describe('deleteAiProviderRecord', () => {
    it('should delete the record and return deleted info containing id', async () => {
      const id = 'provider-123';
      const mockDeleteChain = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id }]),
      };

      vi.mocked(db.delete).mockReturnValue(mockDeleteChain as any);

      const result = await deleteAiProviderRecord(id);

      expect(db.delete).toHaveBeenCalledWith(aiProviders);
      expect(mockDeleteChain.where).toHaveBeenCalled();
      expect(result).toEqual({ id });
    });

    it('should return null if no record was deleted', async () => {
      const id = 'provider-123';
      const mockDeleteChain = {
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.delete).mockReturnValue(mockDeleteChain as any);

      const result = await deleteAiProviderRecord(id);

      expect(result).toBeNull();
    });
  });

  describe('findAiProviderById', () => {
    it('should return the provider if found', async () => {
      const id = 'provider-123';
      const mockProvider = {
        id,
        settingsId: 'settings-123',
        name: 'OpenAI Test',
        provider: 'openai',
        key: 'key',
        isActive: true
      };

      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockProvider]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelectChain as any);

      const result = await findAiProviderById(id);

      expect(db.select).toHaveBeenCalled();
      expect(mockSelectChain.from).toHaveBeenCalledWith(aiProviders);
      expect(mockSelectChain.where).toHaveBeenCalled();
      expect(eq).toHaveBeenCalledWith(aiProviders.id, id);
      expect(result).toEqual(mockProvider);
    });

    it('should return null if the provider is not found', async () => {
      const id = 'provider-123';

      const mockSelectChain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db.select).mockReturnValue(mockSelectChain as any);

      const result = await findAiProviderById(id);

      expect(result).toBeNull();
    });
  });
});
