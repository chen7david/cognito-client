// Export the main client classes
export { CognitoUserClient } from './lib/CognitoUserClient';
export { CognitoAdminClient } from './lib/CognitoAdminClient';

// Export types for consumers to use
export * from './types';

// Export utilities
export * from './utils/tokenUtils';

// Testing utilities are not exported for production use
