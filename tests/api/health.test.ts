import { describe, it, expect } from 'vitest';

describe('Health Check API', () => {
  it('should return ok status', () => {
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };

    expect(response.status).toBe('ok');
    expect(response.timestamp).toBeDefined();
  });
});
