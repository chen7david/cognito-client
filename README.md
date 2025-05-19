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
- **Error Handling**: Improved error handling with clear error messages.
- **Testability**: Designed with testing in mind, allowing for easy mocking and test utilities.

## Installation

```bash
npm install cognito-client
```

## Quick Start

```typescript
// User client
import { CognitoUserClient, CognitoIdentityProviderClient } from 'cognito-client';

// Create the AWS SDK client
const cognitoProvider = new CognitoIdentityProviderClient({
  region: 'us-east-1',
});

// Create the user client
const userClient = new CognitoUserClient(
  {
    region: 'us-east-1',
    userPoolId: 'us-east-1_yourPoolId',
    clientId: 'your-app-client-id',
  },
  cognitoProvider,
);

// Sign in a user
const authResult = await userClient.signIn({
  username: 'username',
  password: 'password',
});

// Admin client
import { CognitoAdminClient, CognitoIdentityProviderClient } from 'cognito-client';

// Create the AWS SDK client with credentials
const cognitoProviderWithCreds = new CognitoIdentityProviderClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key',
  },
});

// Create the admin client
const adminClient = new CognitoAdminClient(
  {
    region: 'us-east-1',
    userPoolId: 'us-east-1_yourPoolId',
    clientId: 'your-app-client-id',
    credentials: {
      accessKeyId: 'your-access-key',
      secretAccessKey: 'your-secret-key',
    },
  },
  cognitoProviderWithCreds,
);

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
import { CognitoUserClient, CognitoIdentityProviderClient } from 'cognito-client';

// First, create a CognitoIdentityProviderClient instance
const cognitoProvider = new CognitoIdentityProviderClient({
  region: 'us-east-1',
});

// Then, create the CognitoUserClient with the provider instance
const userClient = new CognitoUserClient(
  {
    region: 'us-east-1',
    userPoolId: 'us-east-1_yourPoolId',
    clientId: 'your-app-client-id',
  },
  cognitoProvider,
);

// Alternatively, you can use the static createClient method to create the provider
const cognitoProvider = CognitoUserClient.createClient({
  region: 'us-east-1',
});

// Then create the client with the provider
const userClient = new CognitoUserClient(
  {
    region: 'us-east-1',
    userPoolId: 'us-east-1_yourPoolId',
    clientId: 'your-app-client-id',
  },
  cognitoProvider,
);
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
  console.error('Sign in failed:', error.message);
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
  console.error('Registration failed:', error.message);
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
  console.error('Confirmation failed:', error.message);
}
```

## Admin Client Usage

The `CognitoAdminClient` provides methods for admin operations that require AWS credentials.

### Creating an Admin Client

```typescript
import { CognitoAdminClient, CognitoIdentityProviderClient } from 'cognito-client';

// First, create a CognitoIdentityProviderClient instance with credentials
const cognitoProvider = new CognitoIdentityProviderClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key',
  },
});

// Then, create the CognitoAdminClient with the provider instance
const adminClient = new CognitoAdminClient(
  {
    region: 'us-east-1',
    userPoolId: 'us-east-1_yourPoolId',
    clientId: 'your-app-client-id',
    credentials: {
      accessKeyId: 'your-access-key',
      secretAccessKey: 'your-secret-key',
    },
  },
  cognitoProvider,
);

// Alternatively, you can use the static createClient method to create the provider
const cognitoProvider = CognitoAdminClient.createClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key',
  },
});

// Then create the client with the provider
const adminClient = new CognitoAdminClient(
  {
    region: 'us-east-1',
    userPoolId: 'us-east-1_yourPoolId',
    clientId: 'your-app-client-id',
    credentials: {
      accessKeyId: 'your-access-key',
      secretAccessKey: 'your-secret-key',
    },
  },
  cognitoProvider,
);
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
  console.error('User creation failed:', error.message);
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
  console.error('Listing users failed:', error.message);
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
  console.error('Update failed:', error.message);
}
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

## Testing

This library provides utility functions to help with testing your application code that uses the Cognito clients:

```typescript
import {
  createMockCognitoClient,
  createMockAuthResult,
  createMockUser,
  createMockAdminGetUserResponse,
} from 'cognito-client';

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
});
```

## API Reference

### User Client Methods

| Method                          | Description                                     | Parameters                                                                                                           | Return Type                              |
| ------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `constructor`                   | Creates a new instance of `CognitoUserClient`   | `config`: CognitoConfig<br>`client`: CognitoIdentityProviderClient                                                   | -                                        |
| `static createClient`           | Creates a new CognitoIdentityProviderClient     | `options`: CognitoClientOptions                                                                                      | CognitoIdentityProviderClient            |
| `signIn`                        | Authenticates a user with username and password | `params`: { username: string, password: string }                                                                     | Promise\<AuthResponse>                   |
| `signUp`                        | Registers a new user in Cognito                 | `params`: { username: string, password: string, email: string, phone?: string, attributes?: Record<string, string> } | Promise\<SignUpResponse>                 |
| `confirmSignUp`                 | Confirms a user registration                    | `params`: { username: string, confirmationCode: string }                                                             | Promise\<boolean>                        |
| `forgotPassword`                | Initiates the forgot password flow              | `params`: { username: string }                                                                                       | Promise\<boolean>                        |
| `confirmForgotPassword`         | Completes the password reset process            | `params`: { username: string, confirmationCode: string, newPassword: string }                                        | Promise\<boolean>                        |
| `refreshToken`                  | Refreshes the authentication tokens             | `params`: { refreshToken: string }                                                                                   | Promise\<AuthResponse>                   |
| `changePassword`                | Changes the user's password                     | `params`: { accessToken: string, oldPassword: string, newPassword: string }                                          | Promise\<boolean>                        |
| `getUserAttributes`             | Gets the current user's attributes              | `params`: { accessToken: string }                                                                                    | Promise\<GetUserAttributesResponse>      |
| `updateUserAttributes`          | Updates the current user's attributes           | `params`: { accessToken: string, attributes: Record<string, string> }                                                | Promise\<boolean>                        |
| `getAttributeVerificationCode`  | Sends a verification code for an attribute      | `accessToken`: string<br>`attributeName`: string                                                                     | Promise\<boolean>                        |
| `verifyUserAttribute`           | Verifies a user attribute with a code           | `params`: { accessToken: string, attributeName: string, code: string }                                               | Promise\<boolean>                        |
| `getMFAOptions`                 | Gets MFA options for a user                     | `params`: { accessToken: string }                                                                                    | Promise\<MFAOption[]>                    |
| `associateSoftwareToken`        | Associates a software token for MFA             | `params`: { accessToken: string }                                                                                    | Promise\<AssociateSoftwareTokenResponse> |
| `verifySoftwareToken`           | Verifies a software token for MFA               | `params`: { accessToken: string, userCode: string, friendlyDeviceName?: string, session?: string }                   | Promise\<boolean>                        |
| `setUserMFAPreference`          | Sets MFA preferences for a user                 | `params`: { accessToken: string, smsMfaSettings?: {...}, softwareTokenMfaSettings?: {...} }                          | Promise\<boolean>                        |
| `getDevice`                     | Gets information about a device                 | `params`: { accessToken: string, deviceKey: string }                                                                 | Promise\<DeviceType>                     |
| `forgetDevice`                  | Forgets a device                                | `params`: { accessToken: string, deviceKey: string }                                                                 | Promise\<boolean>                        |
| `listDevices`                   | Lists remembered devices                        | `params`: { accessToken: string, limit?: number, paginationToken?: string }                                          | Promise\<ListDevicesResponse>            |
| `globalSignOut`                 | Signs out from all devices                      | `params`: { accessToken: string }                                                                                    | Promise\<boolean>                        |
| `respondToNewPasswordChallenge` | Responds to a new password required challenge   | `challengeName`: string<br>`username`: string<br>`newPassword`: string<br>`session`: string                          | Promise\<AuthResponse>                   |
| `getErrorInfo`                  | Gets formatted error information                | `error`: unknown                                                                                                     | CognitoErrorInfo                         |

### Common Return Types

#### AuthResponse

| Property       | Type   | Description                                 |
| -------------- | ------ | ------------------------------------------- |
| `accessToken`  | string | The access token for authenticated requests |
| `idToken`      | string | The ID token containing user attributes     |
| `refreshToken` | string | The refresh token for obtaining new tokens  |
| `expiresIn`    | number | Token expiration time in seconds            |
| `tokenType`    | string | The token type (e.g., "Bearer")             |

#### SignUpResponse

| Property        | Type    | Description                                         |
| --------------- | ------- | --------------------------------------------------- |
| `userId`        | string  | The username of the registered user                 |
| `userSub`       | string  | The unique identifier for the user                  |
| `userConfirmed` | boolean | Whether the user is confirmed or needs confirmation |

### Admin Client Methods

| Method                      | Description                                     | Parameters                                                                                                          | Return Type                                   |
| --------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `constructor`               | Creates a new instance of `CognitoAdminClient`  | `config`: CognitoAdminConfig<br>`client`: CognitoIdentityProviderClient                                             | -                                             |
| `static createClient`       | Creates a new CognitoIdentityProviderClient     | `options`: CognitoClientOptions                                                                                     | CognitoIdentityProviderClient                 |
| `createUser`                | Creates a new user as an admin                  | `params`: AdminCreateUserParams                                                                                     | Promise\<AdminCreateUserResponse>             |
| `getUser`                   | Gets user information as an admin               | `params`: { username: string }                                                                                      | Promise\<AdminGetUserResponse>                |
| `updateUserAttributes`      | Updates user attributes as an admin             | `params`: { username: string, attributes: Record<string, string> }                                                  | Promise\<boolean>                             |
| `disableUser`               | Disables a user as an admin                     | `params`: { username: string }                                                                                      | Promise\<boolean>                             |
| `enableUser`                | Enables a user as an admin                      | `params`: { username: string }                                                                                      | Promise\<boolean>                             |
| `deleteUser`                | Deletes a user as an admin                      | `params`: { username: string }                                                                                      | Promise\<boolean>                             |
| `listUsers`                 | Lists users in the user pool as an admin        | `params?`: { limit?: number, paginationToken?: string, filter?: string }                                            | Promise\<AdminListUsersResponse>              |
| `initiateAuth`              | Initiates authentication as an admin            | `params`: { username: string, password: string, clientMetadata?: Record<string, string> }                           | Promise\<AdminInitiateAuthResponse>           |
| `respondToAuthChallenge`    | Responds to an auth challenge as an admin       | `params`: AdminRespondToAuthChallengeParams                                                                         | Promise\<AdminRespondToAuthChallengeResponse> |
| `resetUserPassword`         | Resets a user's password as an admin            | `params`: { username: string }                                                                                      | Promise\<boolean>                             |
| `setUserPassword`           | Sets a user's password as an admin              | `username`: string<br>`password`: string<br>`permanent?`: boolean (default: true)                                   | Promise\<boolean>                             |
| `adminConfirmSignUp`        | Confirms a user's registration as an admin      | `params`: { username: string }                                                                                      | Promise\<boolean>                             |
| `adminAddUserToGroup`       | Adds a user to a group                          | `params`: { username: string, groupName: string }                                                                   | Promise\<boolean>                             |
| `adminRemoveUserFromGroup`  | Removes a user from a group                     | `params`: { username: string, groupName: string }                                                                   | Promise\<boolean>                             |
| `listGroups`                | Lists groups in the user pool                   | `params?`: { limit?: number, nextToken?: string }                                                                   | Promise\<ListGroupsResponse>                  |
| `createGroup`               | Creates a new group in the user pool            | `params`: { groupName: string, description?: string, precedence?: number, roleArn?: string }                        | Promise\<GroupType>                           |
| `getGroup`                  | Gets information about a group                  | `params`: { groupName: string }                                                                                     | Promise\<GroupType>                           |
| `updateGroup`               | Updates a group in the user pool                | `params`: { groupName: string, description?: string, precedence?: number, roleArn?: string }                        | Promise\<GroupType>                           |
| `deleteGroup`               | Deletes a group from the user pool              | `params`: { groupName: string }                                                                                     | Promise\<boolean>                             |
| `listUsersInGroup`          | Lists users in a specific group                 | `params`: { groupName: string, limit?: number, nextToken?: string }                                                 | Promise\<ListUsersInGroupResponse>            |
| `adminListGroupsForUser`    | Lists groups that a user belongs to             | `params`: { username: string, limit?: number, nextToken?: string }                                                  | Promise\<AdminListGroupsForUserResponse>      |
| `adminSetUserMFAPreference` | Sets MFA preferences for a user                 | `params`: { username: string, smsMfaSettings?: {...}, softwareTokenMfaSettings?: {...} }                            | Promise\<boolean>                             |
| `adminLinkProviderForUser`  | Links a user to a third-party identity provider | `params`: { username: string, providerName: string, providerAttributeName: string, providerAttributeValue: string } | Promise\<boolean>                             |
| `adminGetDevice`            | Gets information about a user's device          | `params`: { username: string, deviceKey: string }                                                                   | Promise\<DeviceType>                          |
| `adminForgetDevice`         | Forgets a user's device                         | `params`: { username: string, deviceKey: string }                                                                   | Promise\<boolean>                             |
| `adminListDevices`          | Lists a user's devices                          | `params`: { username: string, limit?: number, paginationToken?: string }                                            | Promise\<ListDevicesResponse>                 |
| `adminUserGlobalSignOut`    | Signs out a user from all devices               | `params`: { username: string }                                                                                      | Promise\<boolean>                             |
| `getErrorInfo`              | Gets formatted error information                | `error`: unknown                                                                                                    | CognitoErrorInfo                              |

#### AdminCreateUserParams

| Parameter           | Type                   | Required | Description                         |
| ------------------- | ---------------------- | -------- | ----------------------------------- |
| `username`          | string                 | Yes      | The username of the new user        |
| `email`             | string                 | Yes      | The email address of the new user   |
| `password`          | string                 | No       | The permanent password for the user |
| `phone`             | string                 | No       | The phone number of the new user    |
| `temporaryPassword` | string                 | No       | A temporary password for the user   |
| `messageAction`     | 'RESEND' \| 'SUPPRESS' | No       | How to handle welcome message       |
| `attributes`        | Record<string, string> | No       | Additional user attributes          |

#### AdminCreateUserResponse

| Property               | Type              | Description                         |
| ---------------------- | ----------------- | ----------------------------------- |
| `userId`               | string            | The username of the created user    |
| `userSub`              | string            | The unique identifier for the user  |
| `userCreateDate`       | Date              | The date the user was created       |
| `userLastModifiedDate` | Date              | The date the user was last modified |
| `enabled`              | boolean           | Whether the user is enabled         |
| `userStatus`           | string            | The status of the user              |
| `temporaryPassword`    | string (optional) | The temporary password if provided  |

## Development

To contribute to this project:

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Build the package: `npm run build`

## License

ISC
