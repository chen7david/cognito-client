# Cognito-IO

A clean, type-safe wrapper around Amazon Cognito providing camel-cased JavaScript structures for easier integration.

## Features

- **TypeScript-First**: Full TypeScript support with comprehensive type definitions.
- **Clean Interfaces**: Simplified and consistent API that abstracts away AWS SDK complexity.
- **Camel-Cased Attributes**: All attributes are automatically converted to camelCase for a more JavaScript-friendly experience.
- **User Operations**: Full support for user authentication, registration, and profile management.
- **Admin Operations**: Complete administrative capabilities for user management in Cognito.
- **Error Handling**: Improved error handling with clear error messages.

## Installation

```bash
npm install cognito-io
```

## Usage

### User Client

The `CognitoUserClient` provides methods for regular user operations (sign in, register, etc.) that don't require AWS admin credentials.

```typescript
import { CognitoUserClient } from 'cognito-io';

// Create a client
const userClient = new CognitoUserClient({
  region: 'us-east-1',
  userPoolId: 'us-east-1_yourPoolId',
  clientId: 'your-app-client-id',
});

// Sign in a user
const signIn = async () => {
  try {
    const authResult = await userClient.signIn({
      username: 'username',
      password: 'password',
    });

    console.log('Access Token:', authResult.accessToken);
    console.log('ID Token:', authResult.idToken);
    console.log('Refresh Token:', authResult.refreshToken);
  } catch (error) {
    console.error('Sign in failed:', error.message);
  }
};

// Register a new user
const registerUser = async () => {
  try {
    const result = await userClient.registerUser({
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
    console.error('Registration failed:', error.message);
  }
};

// Confirm a user registration
const confirmRegistration = async () => {
  try {
    const success = await userClient.confirmRegistration({
      username: 'newuser',
      confirmationCode: '123456',
    });

    if (success) {
      console.log('User confirmed successfully');
    }
  } catch (error) {
    console.error('Confirmation failed:', error.message);
  }
};
```

### Admin Client

The `CognitoAdminClient` provides methods for admin operations that require AWS credentials.

```typescript
import { CognitoAdminClient } from 'cognito-io';

// Create an admin client
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
const createUser = async () => {
  try {
    const result = await adminClient.createUser({
      username: 'newadminuser',
      email: 'admin@example.com',
      password: 'Password123!', // Optional: if provided, sets as permanent password
      phone: '+1234567890', // Optional
      temporaryPassword: 'Temp123!', // Optional: if password not provided
      messageAction: 'SUPPRESS', // Optional: 'RESEND' or 'SUPPRESS'
      attributes: {
        // Optional custom attributes
        customRole: 'admin',
      },
    });

    console.log('User created:', result.userId);
  } catch (error) {
    console.error('User creation failed:', error.message);
  }
};

// List users
const listUsers = async () => {
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
    console.error('Listing users failed:', error.message);
  }
};

// Update user attributes
const updateUserAttributes = async () => {
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
    console.error('Update failed:', error.message);
  }
};

// Disable a user
const disableUser = async () => {
  try {
    const success = await adminClient.disableUser({
      username: 'someuser',
    });

    if (success) {
      console.log('User disabled successfully');
    }
  } catch (error) {
    console.error('Disable failed:', error.message);
  }
};
```

## Error Handling

Both client classes provide a `getErrorInfo` method that returns structured error information:

```typescript
try {
  // Some operation that fails
  await userClient.signIn({
    username: 'wronguser',
    password: 'wrongpassword',
  });
} catch (error) {
  const errorInfo = userClient.getErrorInfo(error);
  console.log('Error code:', errorInfo.code);
  console.log('Error name:', errorInfo.name);
  console.log('Error message:', errorInfo.message);
}
```

## Development

To contribute to this project:

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Build the package: `npm run build`

## License

ISC
