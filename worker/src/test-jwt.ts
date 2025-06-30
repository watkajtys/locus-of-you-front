import { createJWT, validateJWT } from './middleware/auth';

// Test JWT functionality
async function testJWT() {
  const secret = 'test-secret-key-should-be-long-and-secure';
  
  // Create a test payload
  const payload = {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'user',
    subscription: {
      active: true,
      plan: 'premium'
    }
  };

  try {
    // Create JWT
    console.log('Creating JWT...');
    const token = await createJWT(payload, secret, 3600); // 1 hour
    console.log('JWT created:', token);

    // Validate JWT
    console.log('Validating JWT...');
    const decoded = await validateJWT(token, secret);
    console.log('JWT decoded:', decoded);

    console.log('JWT test passed! ✅');
  } catch (error) {
    console.error('JWT test failed:', error);
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testJWT();
}

export { testJWT };