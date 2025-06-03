# Cognito-Client

A clean, type-safe wrapper around Amazon Cognito providing camel-cased JavaScript structures for easier integration.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [User Client Usage](#user-client-usage)
- [Admin Client Usage](#admin-client-usage)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [API Reference](#api-reference)
  - [User Client Methods](#user-client-methods)
  - [Admin Client Methods](#admin-client-methods)
- [Development](#development)
- [License](#license)

## Features

- **TypeScript-First**: Full TypeScript support with comprehensive type definitions.
- **Clean Interfaces**: Simplified and consistent API that abstracts away AWS SDK complexity.
- **Camel-Cased Attributes**: All attributes are automatically converted to camelCase for a more JavaScript-friendly experience.
- **User Operations**: Full support for user authentication, registration, and profile management.
- **Admin Operations**: Complete administrative capabilities for user management in Cognito.
- **Direct Error Handling**: Original AWS Cognito errors are passed through for complete control over error handling.
- **Testability**: Designed with testing in mind, allowing for easy mocking and test utilities.

## Installation

```bash
npm install cognito-client
```

## Quick Start

### User Client

```typescript
import { CognitoUserClient } from 'cognito-client';

// Create the user client
const userClient = new CognitoUserClient({
  region: 'us-east-1',
  userPoolId: 'us-east-1_yourPoolId',
  clientId: 'your-app-client-id',
});

// Sign in a user
const authResult = await userClient.signIn({
  username: 'username',
  password: 'password',
});
```

### Admin Client

```typescript
import { CognitoAdminClient } from 'cognito-client';

// Create the admin client with credentials
const adminClient = new CognitoAdminClient({
  region: 'us-east-1',
  userPoolId: 'us-east-1_yourPoolId',
  clientId: 'your-app-client-id',
  credentials: {
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key',
  },
});

// Create a user as admin
const result = await adminClient.createUser({
  username: 'newuser',
  email: 'user@example.com',
  password: 'Password123!',
});
```

## User Client Usage

The `CognitoUserClient` provides methods for regular user operations that don't require AWS admin credentials.

### Creating a Client

```typescript
import { CognitoUserClient } from 'cognito-client';

// Create a client with the required configuration
const userClient = new CognitoUserClient({
  region: 'us-east-1',
  userPoolId: 'us-east-1_yourPoolId',
  clientId: 'your-app-client-id',
});

// For testing, you can provide a mock client
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
const mockClient = /* your mock implementation */;
const testClient = new CognitoUserClient({
  region: 'us-east-1',
  userPoolId: 'us-east-1_yourPoolId',
  clientId: 'your-app-client-id',
}, mockClient);
```

### Authentication Example

```typescript
// Sign in a user
try {
  const authResult = await userClient.signIn({
    username: 'username',
    password: 'password',
  });

  console.log('Access Token:', authResult.accessToken);
  console.log('ID Token:', authResult.idToken);
  console.log('Refresh Token:', authResult.refreshToken);
} catch (error) {
  // AWS Cognito original errors are passed directly
  console.error('Sign in failed:', error);
}
```

### Registration Example

```typescript
// Register a new user
try {
  const result = await userClient.signUp({
    username: 'newuser',
    password: 'Password123!',
    email: 'user@example.com',
    phone: '+1234567890', // Optional
    attributes: {
      // Optional custom attributes
      customAttribute: 'value',
    },
  });

  console.log('User registered, confirmed:', result.userConfirmed);
} catch (error) {
  console.error('Registration failed:', error);
}

// Confirm registration
try {
  const success = await userClient.confirmSignUp({
    username: 'newuser',
    confirmationCode: '123456',
  });

  if (success) {
    console.log('User confirmed successfully');
  }
} catch (error) {
  console.error('Confirmation failed:', error);
}
```

## Admin Client Usage

The `CognitoAdminClient` provides methods for admin operations that require AWS credentials.

### Creating an Admin Client

```typescript
import { CognitoAdminClient } from 'cognito-client';

// Create the admin client with credentials
const adminClient = new CognitoAdminClient({
  region: 'us-east-1',
  userPoolId: 'us-east-1_yourPoolId',
  clientId: 'your-app-client-id',
  credentials: {
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key',
  },
});

// For testing, you can provide a mock client
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
const mockClient = /* your mock implementation */;
const testClient = new CognitoAdminClient({
  region: 'us-east-1',
  userPoolId: 'us-east-1_yourPoolId',
  clientId: 'your-app-client-id',
  credentials: {
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key',
  },
}, mockClient);
```

### User Management Examples

```typescript
// Create a user as admin
try {
  const result = await adminClient.createUser({
    username: 'newadminuser',
    email: 'admin@example.com',
    password: 'Password123!', // Optional
    temporaryPassword: 'Temp123!', // Optional
    messageAction: 'SUPPRESS', // Optional: 'RESEND' or 'SUPPRESS'
    attributes: { customRole: 'admin' }, // Optional
  });

  console.log('User created:', result.userId);
} catch (error) {
  console.error('User creation failed:', error);
}

// List users
try {
  const result = await adminClient.listUsers({
    limit: 10, // Optional
    filter: 'email ^= "user"', // Optional
  });

  console.log('Users:', result.users);

  // If there are more users
  if (result.paginationToken) {
    const nextPage = await adminClient.listUsers({
      limit: 10,
      paginationToken: result.paginationToken,
    });
    console.log('More users:', nextPage.users);
  }
} catch (error) {
  console.error('Listing users failed:', error);
}

// Update user attributes
try {
  const success = await adminClient.updateUserAttributes({
    username: 'someuser',
    attributes: {
      email: 'newemail@example.com',
      customRole: 'supervisor',
    },
  });

  if (success) {
    console.log('User attributes updated successfully');
  }
} catch (error) {
  console.error('Update failed:', error);
}
```

## Error Handling

Both client classes pass through the original AWS Cognito errors directly. This gives you complete control over error handling.

```typescript
try {
  // Some operation that fails
  await userClient.signIn({
    username: 'wronguser',
    password: 'wrongpassword',
  });
} catch (error) {
  // You can access the original AWS error properties
  console.log('Error name:', error.name);
  console.log('Error message:', error.message);

  // Handle specific error types
  if (error.name === 'NotAuthorizedException') {
    console.log('Invalid credentials');
  } else if (error.name === 'UserNotFoundException') {
    console.log('User does not exist');
  }
}
```

## Testing

This library provides utility functions to help with testing your application code that uses the Cognito clients. These testing utilities are available as a separate import:

```typescript
// Import testing utilities from the separate entry point
import { createMockCognitoClient, createMockAuthResult, createMockAwsError } from 'cognito-client/testing';

// Note: You'll need to install @faker-js/faker as a dev dependency in your project
// npm install --save-dev @faker-js/faker

describe('Your Component', () => {
  let userClient;
  let mockSend;

  beforeEach(() => {
    // Create a mock client for testing
    const { mockClient, mockSend: send } = createMockCognitoClient();
    mockSend = send;

    // Pass the mock client to your CognitoUserClient
    userClient = new CognitoUserClient(
      {
        region: 'us-east-1',
        userPoolId: 'us-east-1_abcdef123',
        clientId: '1234567890abcdef',
      },
      mockClient,
    );
  });

  it('should handle sign in', async () => {
    // Create a mock authentication result
    const authResult = createMockAuthResult();

    // Mock the response
    mockSend.mockResolvedValueOnce({
      AuthenticationResult: authResult,
    });

    // Test your code
    const result = await userClient.signIn({
      username: 'testuser',
      password: 'password123',
    });

    // Assertions...
  });

  it('should handle errors', async () => {
    // Create a mock AWS error
    const error = createMockAwsError(
      'NotAuthorizedException',
      'Incorrect username or password.',
      'NotAuthorizedException',
    );

    // Mock the error response
    mockSend.mockRejectedValueOnce(error);

    // Test error handling
    await expect(
      userClient.signIn({
        username: 'testuser',
        password: 'wrongpassword',
      }),
    ).rejects.toThrow(error);
  });
});

## API Reference

For a full list of available methods and their parameters, please refer to the TypeScript type definitions included with the package or check the source code documentation.

## License

ISC
```
