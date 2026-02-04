import { describe, expect, it } from 'bun:test';
import { app } from './index';

describe('BREE AI Gateway', () => {
  it('should return welcome message at root', async () => {
    const response = await app.handle(new Request('http://localhost/'));
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.message).toBe('Welcome to BREE AI Gateway');
  });

  it('should return health status', async () => {
    const response = await app.handle(new Request('http://localhost/health'));
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeDefined();
  });

  describe('Knowledge endpoints', () => {
    // Note: These endpoints call external services, so in a real CI environment
    // we would mock the fetch calls. For now, we are testing the routing/validation.
    
    it('should return 200 for collections (even if external service fails, route is valid)', async () => {
      // This might fail if the external service is down and not handled, 
      // but we are testing that Elysia routes it correctly.
      const response = await app.handle(new Request('http://localhost/api/knowledge/collections?org_id=test'));
      expect(response.status).toBe(200);
    });
  });
});
