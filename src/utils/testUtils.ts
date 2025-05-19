import {
  AuthenticationResultType,
  CognitoIdentityProviderClient,
  AdminGetUserCommandOutput,
  UserType,
} from '@aws-sdk/client-cognito-identity-provider';
import { faker } from '@faker-js/faker';

/**
 * Creates a mock CognitoIdentityProviderClient for testing
 * @returns A mock CognitoIdentityProviderClient instance
 */
export const createMockCognitoClient = (): {
  mockClient: CognitoIdentityProviderClient;
  mockSend: jest.Mock;
} => {
  const mockSend = jest.fn();
  const mockClient = {
    send: mockSend,
  } as unknown as CognitoIdentityProviderClient;

  return { mockClient, mockSend };
};

/**
 * Creates a mock authentication response for testing
 * @param overrides - Optional overrides for the authentication result
 * @returns A mock authentication result
 */
export const createMockAuthResult = (
  overrides?: Partial<AuthenticationResultType>,
): AuthenticationResultType => {
  return {
    AccessToken: overrides?.AccessToken || faker.string.uuid(),
    IdToken: overrides?.IdToken || faker.string.uuid(),
    RefreshToken: overrides?.RefreshToken || faker.string.uuid(),
    ExpiresIn: overrides?.ExpiresIn || 3600,
    TokenType: overrides?.TokenType || 'Bearer',
  };
};

/**
 * Creates a mock user for testing
 * @param username - Optional username, generated if not provided
 * @param overrides - Optional overrides for the user object
 * @returns A mock user object
 */
export const createMockUser = (username?: string, overrides?: Partial<UserType>): UserType => {
  const mockDate = new Date();

  return {
    Username: username || faker.internet.userName(),
    UserCreateDate: overrides?.UserCreateDate || mockDate,
    UserLastModifiedDate: overrides?.UserLastModifiedDate || mockDate,
    Enabled: overrides?.Enabled !== undefined ? overrides.Enabled : true,
    UserStatus: overrides?.UserStatus || 'CONFIRMED',
    Attributes: overrides?.Attributes || [
      { Name: 'sub', Value: faker.string.uuid() },
      { Name: 'email', Value: faker.internet.email() },
    ],
  };
};

/**
 * Creates a mock AdminGetUserCommandOutput response for testing
 * @param username - Optional username, generated if not provided
 * @param overrides - Optional overrides for the response
 * @returns A mock AdminGetUserCommandOutput
 */
export const createMockAdminGetUserResponse = (
  username?: string,
  overrides?: Partial<AdminGetUserCommandOutput>,
): AdminGetUserCommandOutput => {
  const mockUser = createMockUser(username);

  return {
    Username: mockUser.Username,
    UserCreateDate: mockUser.UserCreateDate,
    UserLastModifiedDate: mockUser.UserLastModifiedDate,
    Enabled: mockUser.Enabled,
    UserStatus: mockUser.UserStatus,
    UserAttributes: mockUser.Attributes,
    MFAOptions: overrides?.MFAOptions,
    PreferredMfaSetting: overrides?.PreferredMfaSetting,
    UserMFASettingList: overrides?.UserMFASettingList,
    $metadata: {
      httpStatusCode: 200,
      requestId: faker.string.uuid(),
      attempts: 1,
      totalRetryDelay: 0,
    },
  };
};
