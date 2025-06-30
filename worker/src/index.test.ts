import { describe, it, expect } from 'vitest';
import app from './index';

describe('Worker', () => {
  it('should respond to /health', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, message: 'ok' });
  });
});
