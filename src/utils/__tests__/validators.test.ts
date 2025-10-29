import { validators } from '../index';

describe('Validators', () => {
  describe('email validator', () => {
    it('should validate correct email addresses', () => {
      expect(validators.email('test@example.com')).toBe(true);
      expect(validators.email('user.name@domain.co.uk')).toBe(true);
      expect(validators.email('test+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validators.email('invalid-email')).toBe(false);
      expect(validators.email('test@')).toBe(false);
      expect(validators.email('@example.com')).toBe(false);
      expect(validators.email('test.example.com')).toBe(false);
      expect(validators.email('')).toBe(false);
    });
  });

  describe('phone validator', () => {
    it('should validate correct phone numbers', () => {
      expect(validators.phone('+1234567890')).toBe(true);
      expect(validators.phone('1234567890')).toBe(true);
      expect(validators.phone('+1 (234) 567-8900')).toBe(true);
      expect(validators.phone('123-456-7890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validators.phone('123')).toBe(false);
      expect(validators.phone('abc1234567')).toBe(false);
      expect(validators.phone('')).toBe(false);
      expect(validators.phone('12345')).toBe(false);
    });
  });

  describe('password validator', () => {
    it('should validate passwords with 8+ characters', () => {
      expect(validators.password('password123')).toBe(true);
      expect(validators.password('12345678')).toBe(true);
      expect(validators.password('verylongpassword')).toBe(true);
    });

    it('should reject passwords with less than 8 characters', () => {
      expect(validators.password('1234567')).toBe(false);
      expect(validators.password('short')).toBe(false);
      expect(validators.password('')).toBe(false);
    });
  });
});