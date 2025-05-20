import { extractAccessToken } from '../utils/tokenUtils';

describe('tokenUtils', () => {
  describe('extractAccessToken', () => {
    it('should extract token from Bearer format', () => {
      const authHeader = 'Bearer token123';
      expect(extractAccessToken(authHeader)).toBe('token123');
    });

    it('should return the token as-is if no Bearer prefix', () => {
      const authHeader = 'token123';
      expect(extractAccessToken(authHeader)).toBe('token123');
    });

    it('should return empty string for empty input', () => {
      expect(extractAccessToken('')).toBe('');
      expect(extractAccessToken(undefined as unknown as string)).toBe('');
    });
  });
});
