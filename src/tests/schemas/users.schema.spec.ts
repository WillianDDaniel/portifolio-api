import { describe, it, expect } from 'vitest'

import {
  updateProfileSchema,
  changePasswordSchema,
  passwordFormSchema
} from '../../schemas/users.schema.js'

describe('Users Zod Schemas', () => {
  describe('updateProfileSchema', () => {
    const validProfilePayload = {
      name: 'John Doe',
      email: 'john@example.com',
      avatarUrl: 'https://site.com/avatar.png',
    }

    it('should validate a complete and correct payload successfully', () => {
      const result = updateProfileSchema.safeParse(validProfilePayload)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validProfilePayload)
      }
    })

    it('should validate successfully when avatarUrl is null', () => {
      const payloadWithNullAvatar = {
        ...validProfilePayload,
        avatarUrl: null,
      }

      const result = updateProfileSchema.safeParse(payloadWithNullAvatar)

      expect(result.success).toBe(true)
    })

    it('should validate successfully when avatarUrl is an empty string', () => {
      const payloadWithEmptyAvatar = {
        ...validProfilePayload,
        avatarUrl: '',
      }

      const result = updateProfileSchema.safeParse(payloadWithEmptyAvatar)

      expect(result.success).toBe(true)
    })

    it('should validate block when all fields are omitted', () => {
      const emptyPayload = {}

      const result = updateProfileSchema.safeParse(emptyPayload)

      expect(result.success).toBe(false)
    })

    it('should fail and block the request if unallowed fields are sent', () => {
      const payloadWithExtraFields = {
        ...validProfilePayload,
        role: 'admin',
      }

      const result = updateProfileSchema.safeParse(payloadWithExtraFields)

      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues[0]
        expect(issue.code).toBe('unrecognized_keys')

        if (issue.code === 'unrecognized_keys') {
          expect(issue.keys).toContain('role')
        }
      }
    })

    it('should fail if name does not meet the minimum length', () => {
      const shortNamePayload = {
        ...validProfilePayload,
        name: 'J',
      }

      const result = updateProfileSchema.safeParse(shortNamePayload)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('errors.users.name')
      }
    })

    it('should fail if email has an invalid format', () => {
      const invalidEmailPayload = {
        ...validProfilePayload,
        email: 'john-at-example.com',
      }

      const result = updateProfileSchema.safeParse(invalidEmailPayload)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('errors.users.email')
      }
    })

    it('should fail if avatarUrl has an invalid format', () => {
      const invalidUrlPayload = {
        ...validProfilePayload,
        avatarUrl: 'not-a-valid-url',
      }

      const result = updateProfileSchema.safeParse(invalidUrlPayload)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('errors.users.avatar_url')
      }
    })
  })

  describe('changePasswordSchema', () => {
    const validPasswordPayload = {
      oldPassword: 'securePassword123',
      newPassword: 'newSecurePassword456',
    }

    it('should validate a correct payload successfully', () => {
      const result = changePasswordSchema.safeParse(validPasswordPayload)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validPasswordPayload)
      }
    })

    it('should fail and block the request if unallowed fields are sent', () => {
      const payloadWithExtraFields = {
        ...validPasswordPayload,
        token: 'fake-jwt-token',
      }

      const result = changePasswordSchema.safeParse(payloadWithExtraFields)

      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues[0]
        expect(issue.code).toBe('unrecognized_keys')

        if (issue.code === 'unrecognized_keys') {
          expect(issue.keys).toContain('token')
        }
      }
    })

    it('should fail if oldPassword is missing', () => {
      const { oldPassword, ...missingOldPasswordPayload } = validPasswordPayload

      const result = changePasswordSchema.safeParse(missingOldPasswordPayload)

      expect(result.success).toBe(false)
      if (!result.success) {
        const issuePaths = result.error.issues.map(issue => issue.path[0])
        expect(issuePaths).toContain('oldPassword')
      }
    })

    it('should fail if newPassword is missing', () => {
      const { newPassword, ...missingNewPasswordPayload } = validPasswordPayload

      const result = changePasswordSchema.safeParse(missingNewPasswordPayload)

      expect(result.success).toBe(false)
      if (!result.success) {
        const issuePaths = result.error.issues.map(issue => issue.path[0])
        expect(issuePaths).toContain('newPassword')
      }
    })

    it('should fail if oldPassword does not meet the minimum length', () => {
      const shortOldPasswordPayload = {
        ...validPasswordPayload,
        oldPassword: '12345',
      }

      const result = changePasswordSchema.safeParse(shortOldPasswordPayload)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('errors.users.old_password')
      }
    })

    it('should fail if newPassword does not meet the minimum length', () => {
      const shortNewPasswordPayload = {
        ...validPasswordPayload,
        newPassword: '12345',
      }

      const result = changePasswordSchema.safeParse(shortNewPasswordPayload)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('errors.users.new_password')
      }
    })
  })

  describe('passwordFormSchema', () => {
    const validPasswordFormPayload = {
      oldPassword: 'securePassword123',
      newPassword: 'newSecurePassword456',
      confirmPassword: 'newSecurePassword456',
    }

    it('should validate successfully when newPassword and confirmPassword match', () => {
      const result = passwordFormSchema.safeParse(validPasswordFormPayload)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validPasswordFormPayload)
      }
    })

    it('should fail if newPassword and confirmPassword do not match', () => {
      const mismatchedPayload = {
        ...validPasswordFormPayload,
        confirmPassword: 'differentPassword789',
      }

      const result = passwordFormSchema.safeParse(mismatchedPayload)

      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('confirmPassword'))

        expect(issue).toBeDefined()
        expect(issue?.message).toBe('errors.profile.password_mismatch')
      }
    })

    it('should fail if confirmPassword does not meet the minimum length', () => {
      const shortConfirmPasswordPayload = {
        ...validPasswordFormPayload,
        confirmPassword: '12345',
      }

      const result = passwordFormSchema.safeParse(shortConfirmPasswordPayload)

      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('confirmPassword'))
        expect(issue?.message).toBe('errors.users.new_password')
      }
    })
  })
})
