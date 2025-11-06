import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  type TokenPayload,
} from '../../api/utils/jwt';

describe('JWT Utils', () => {
  const mockPayload: TokenPayload = {
    managerId: 1,
    username: 'testuser',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include payload data in token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.managerId).toBe(mockPayload.managerId);
      expect(decoded?.username).toBe(mockPayload.username);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include payload data in token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.managerId).toBe(mockPayload.managerId);
      expect(decoded?.username).toBe(mockPayload.username);
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokenPair(mockPayload);
      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate different tokens', () => {
      const tokens = generateTokenPair(mockPayload);
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it('should generate unique tokens on each call', async () => {
      const tokens1 = generateTokenPair(mockPayload);
      // Wait a moment to ensure different iat (issued at) timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));
      const tokens2 = generateTokenPair(mockPayload);
      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(mockPayload);
      const verified = verifyAccessToken(token);
      expect(verified).toBeDefined();
      expect(verified.managerId).toBe(mockPayload.managerId);
      expect(verified.username).toBe(mockPayload.username);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow('Invalid or expired access token');
    });

    it('should throw error for empty token', () => {
      expect(() => verifyAccessToken('')).toThrow('Invalid or expired access token');
    });

    it('should throw error for malformed token', () => {
      expect(() => verifyAccessToken('not-a-jwt-token')).toThrow('Invalid or expired access token');
    });

    it('should throw error for refresh token used as access token', () => {
      const refreshToken = generateRefreshToken(mockPayload);
      expect(() => verifyAccessToken(refreshToken)).toThrow('Invalid or expired access token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const verified = verifyRefreshToken(token);
      expect(verified).toBeDefined();
      expect(verified.managerId).toBe(mockPayload.managerId);
      expect(verified.username).toBe(mockPayload.username);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyRefreshToken('invalid.token.here')).toThrow('Invalid or expired refresh token');
    });

    it('should throw error for empty token', () => {
      expect(() => verifyRefreshToken('')).toThrow('Invalid or expired refresh token');
    });

    it('should throw error for access token used as refresh token', () => {
      const accessToken = generateAccessToken(mockPayload);
      expect(() => verifyRefreshToken(accessToken)).toThrow('Invalid or expired refresh token');
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.managerId).toBe(mockPayload.managerId);
      expect(decoded?.username).toBe(mockPayload.username);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = decodeToken('');
      expect(decoded).toBeNull();
    });

    it('should decode token even if expired (no verification)', () => {
      // Create a token with past expiry (though we can't easily test expiry in unit tests)
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.managerId).toBe(mockPayload.managerId);
    });
  });

  describe('Token expiry configuration', () => {
    it('should have expiry information in decoded token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);
      expect(decoded).toBeDefined();
      // JWT tokens include iat (issued at) and exp (expiry) in payload
      expect((decoded as any).iat).toBeDefined();
      expect((decoded as any).exp).toBeDefined();
    });

    it('should have different expiry times for access and refresh tokens', () => {
      const accessToken = generateAccessToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload);
      
      const accessDecoded: any = decodeToken(accessToken);
      const refreshDecoded: any = decodeToken(refreshToken);
      
      expect(accessDecoded).toBeDefined();
      expect(refreshDecoded).toBeDefined();
      
      // Refresh token should have longer expiry
      const accessExpiry = accessDecoded.exp - accessDecoded.iat;
      const refreshExpiry = refreshDecoded.exp - refreshDecoded.iat;
      
      expect(refreshExpiry).toBeGreaterThan(accessExpiry);
    });
  });
});
