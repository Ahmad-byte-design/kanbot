import { describe, expect, it } from 'vitest';
import { loginSchema, registerPayloadSchema, signupSchema } from '../schema/auth.schema';

const validSignup = {
  name: 'Ahmad Hasan',
  email: 'ahmad@example.com',
  password: 'Password123',
  confirmPassword: 'Password123',
};

describe('auth schemas', () => {
  describe('signupSchema', () => {
    it('accepts a valid signup payload', () => {
      expect(signupSchema.safeParse(validSignup).success).toBe(true);
    });

    it('rejects mismatched passwords', () => {
      const result = signupSchema.safeParse({ ...validSignup, confirmPassword: 'Different123' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Passwords do not match');
      }
    });

    it('rejects a password shorter than 8 characters', () => {
      const result = signupSchema.safeParse({ ...validSignup, password: 'short', confirmPassword: 'short' });
      expect(result.success).toBe(false);
    });

    it('trims the name and email', () => {
      const result = signupSchema.safeParse({
        ...validSignup,
        name: '  Ahmad Hasan  ',
        email: '  ahmad@example.com  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Ahmad Hasan');
        expect(result.data.email).toBe('ahmad@example.com');
      }
    });
  });

  describe('loginSchema', () => {
    it('accepts valid credentials', () => {
      expect(loginSchema.safeParse({ email: 'ahmad@example.com', password: 'Password123' }).success).toBe(true);
    });

    it('rejects an empty password', () => {
      expect(loginSchema.safeParse({ email: 'ahmad@example.com', password: '' }).success).toBe(false);
    });

    it('rejects an invalid email', () => {
      expect(loginSchema.safeParse({ email: 'not-an-email', password: 'Password123' }).success).toBe(false);
    });
  });

  describe('registerPayloadSchema', () => {
    it('does not include confirmPassword', () => {
      const result = registerPayloadSchema.safeParse(validSignup);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('confirmPassword');
      }
    });
  });
});
