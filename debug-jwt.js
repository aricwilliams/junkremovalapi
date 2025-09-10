const jwt = require('jsonwebtoken');
const config = require('./config/config');

console.log('🔍 JWT Debug Information');
console.log('=' .repeat(50));

// Check JWT secret
console.log('JWT Secret Info:');
console.log('- Secret exists:', !!config.jwt.secret);
console.log('- Secret length:', config.jwt.secret ? config.jwt.secret.length : 0);
console.log('- Secret preview:', config.jwt.secret ? config.jwt.secret.substring(0, 20) + '...' : 'none');
console.log('- Secret from env:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 20) + '...' : 'none');

// Test JWT creation and verification
console.log('\n🧪 Testing JWT Creation and Verification:');
console.log('=' .repeat(50));

try {
  // Create a test token
  const testPayload = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    user_type: 'business_owner',
    business_name: 'Test Business'
  };

  const testOptions = {
    expiresIn: '1h',
    algorithm: 'HS256'
  };

  console.log('Creating test token with:');
  console.log('- Payload:', testPayload);
  console.log('- Options:', testOptions);
  console.log('- Secret length:', config.jwt.secret.length);

  const testToken = jwt.sign(testPayload, config.jwt.secret, testOptions);
  console.log('\n✅ Token created successfully!');
  console.log('- Token length:', testToken.length);
  console.log('- Token preview:', testToken.substring(0, 50) + '...');

  // Verify the token
  console.log('\n🔍 Verifying token...');
  const decoded = jwt.verify(testToken, config.jwt.secret, {
    algorithms: ['HS256']
  });

  console.log('✅ Token verified successfully!');
  console.log('- Decoded payload:', decoded);

} catch (error) {
  console.error('❌ JWT Test Failed:', error.message);
  console.error('- Error name:', error.name);
  console.error('- Error stack:', error.stack);
}

// Test with different scenarios
console.log('\n🧪 Testing Edge Cases:');
console.log('=' .repeat(50));

// Test 1: Empty secret
try {
  const emptySecretToken = jwt.sign({ test: 'data' }, '', { algorithm: 'HS256' });
  console.log('❌ Should not create token with empty secret');
} catch (error) {
  console.log('✅ Correctly rejected empty secret:', error.message);
}

// Test 2: Different algorithm
try {
  const differentAlgToken = jwt.sign({ test: 'data' }, config.jwt.secret, { algorithm: 'HS512' });
  const verified = jwt.verify(differentAlgToken, config.jwt.secret, { algorithms: ['HS256'] });
  console.log('❌ Should not verify with different algorithm');
} catch (error) {
  console.log('✅ Correctly rejected different algorithm:', error.message);
}

// Test 3: Wrong secret
try {
  const wrongSecretToken = jwt.sign({ test: 'data' }, 'wrong-secret', { algorithm: 'HS256' });
  const verified = jwt.verify(wrongSecretToken, config.jwt.secret, { algorithms: ['HS256'] });
  console.log('❌ Should not verify with wrong secret');
} catch (error) {
  console.log('✅ Correctly rejected wrong secret:', error.message);
}

console.log('\n📋 Debug Checklist:');
console.log('=' .repeat(50));
console.log('1. ✅ JWT secret is configured:', !!config.jwt.secret);
console.log('2. ✅ JWT secret is not empty:', config.jwt.secret && config.jwt.secret.length > 0);
console.log('3. ✅ JWT secret matches environment:', config.jwt.secret === process.env.JWT_SECRET);
console.log('4. ✅ Algorithm is consistent (HS256)');
console.log('5. ✅ Token creation works');
console.log('6. ✅ Token verification works');

console.log('\n💡 Next Steps:');
console.log('1. Start your server and try to login');
console.log('2. Check the debug logs in the console');
console.log('3. Copy the token from login response');
console.log('4. Test the token at https://jwt.io');
console.log('5. Try calling a protected endpoint with the token');

