import { CognitoAdminClient } from '../lib/CognitoAdminClient';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminDeleteUserCommand,
  ListUsersCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  const mockSend = jest.fn();
  return {
    CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    AdminCreateUserCommand: jest.fn(),
    AdminGetUserCommand: jest.fn(),
    AdminUpdateUserAttributesCommand: jest.fn(),
    AdminDisableUserCommand: jest.fn(),
    AdminEnableUserCommand: jest.fn(),
    AdminDeleteUserCommand: jest.fn(),
    ListUsersCommand: jest.fn(),
    AdminInitiateAuthCommand: jest.fn(),
    AdminRespondToAuthChallengeCommand: jest.fn(),
    AdminSetUserPasswordCommand: jest.fn(),
    AdminResetUserPasswordCommand: jest.fn(),
    AuthFlowType: {
      ADMIN_USER_PASSWORD_AUTH: 'ADMIN_USER_PASSWORD_AUTH',
    },
    ChallengeNameType: {
      NEW_PASSWORD_REQUIRED: 'NEW_PASSWORD_REQUIRED',
    },
    MessageActionType: {
      RESEND: 'RESEND',
      SUPPRESS: 'SUPPRESS',
    },
    DeliveryMediumType: {
      SMS: 'SMS',
      EMAIL: 'EMAIL',
    },
  };
});

describe('CognitoAdminClient', () => {
  let client: CognitoAdminClient;
  let mockSend: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new CognitoAdminClient({
      region: 'us-east-1',
      userPoolId: 'us-east-1_abcdef123',
      clientId: '1234567890abcdef',
      credentials: {
        accessKeyId: 'mock-access-key',
        secretAccessKey: 'mock-secret-key',
      },
    });
    // Get the mocked send function
    mockSend = (CognitoIdentityProviderClient as jest.Mock).mock.results[0].value.send;
  });

  describe('createUser', () => {
    it('should successfully create a user', async () => {
      // Mock successful responses for both createUser and setPassword
      mockSend.mockResolvedValueOnce({
        User: {
          Username: 'newadminuser',
          UserCreateDate: new Date(),
          UserLastModifiedDate: new Date(),
          Enabled: true,
          UserStatus: 'FORCE_CHANGE_PASSWORD',
          Attributes: [
            { Name: 'sub', Value: 'mock-user-sub' },
            { Name: 'email', Value: 'newadminuser@example.com' },
          ],
        },
      });

      // Mock response for setPassword
      mockSend.mockResolvedValueOnce({});

      const result = await client.createUser({
        username: 'newadminuser',
        password: 'Password123!',
        email: 'newadminuser@example.com',
        messageAction: 'SUPPRESS',
        attributes: {
          custom: 'admin',
        },
      });

      // Verify AdminCreateUserCommand was called with correct parameters
      expect(AdminCreateUserCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'newadminuser',
        TemporaryPassword: undefined,
        UserAttributes: expect.arrayContaining([
          { Name: 'email', Value: 'newadminuser@example.com' },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom', Value: 'admin' },
        ]),
        MessageAction: 'SUPPRESS',
      });

      // Verify AdminSetUserPasswordCommand was called for permanent password
      expect(AdminSetUserPasswordCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'newadminuser',
        Password: 'Password123!',
        Permanent: true,
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        userId: 'newadminuser',
        userSub: 'mock-user-sub',
        userCreateDate: expect.any(Date),
        userLastModifiedDate: expect.any(Date),
        enabled: true,
        userStatus: 'FORCE_CHANGE_PASSWORD',
        temporaryPassword: undefined,
      });
    });
  });

  describe('getUser', () => {
    it('should successfully get user information', async () => {
      // Mock successful response
      const mockDate = new Date();
      mockSend.mockResolvedValueOnce({
        Username: 'adminuser',
        UserCreateDate: mockDate,
        UserLastModifiedDate: mockDate,
        Enabled: true,
        UserStatus: 'CONFIRMED',
        UserAttributes: [
          { Name: 'sub', Value: 'mock-user-sub' },
          { Name: 'email', Value: 'adminuser@example.com' },
          { Name: 'custom:role', Value: 'admin' },
        ],
      });

      const result = await client.getUser({
        username: 'adminuser',
      });

      // Verify AdminGetUserCommand was called with correct parameters
      expect(AdminGetUserCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'adminuser',
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        username: 'adminuser',
        userCreateDate: mockDate,
        userLastModifiedDate: mockDate,
        enabled: true,
        userStatus: 'CONFIRMED',
        userAttributes: {
          sub: 'mock-user-sub',
          email: 'adminuser@example.com',
          customRole: 'admin',
        },
        mfaOptions: undefined,
        preferredMfaSetting: undefined,
        userMfaSettingList: undefined,
      });
    });
  });

  describe('updateUserAttributes', () => {
    it('should successfully update user attributes', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.updateUserAttributes({
        username: 'adminuser',
        attributes: {
          email: 'newemail@example.com',
          custom: 'superadmin',
        },
      });

      // Verify AdminUpdateUserAttributesCommand was called with correct parameters
      expect(AdminUpdateUserAttributesCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'adminuser',
        UserAttributes: expect.arrayContaining([
          { Name: 'email', Value: 'newemail@example.com' },
          { Name: 'custom', Value: 'superadmin' },
        ]),
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('disableUser', () => {
    it('should successfully disable a user', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.disableUser({
        username: 'adminuser',
      });

      // Verify AdminDisableUserCommand was called with correct parameters
      expect(AdminDisableUserCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'adminuser',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('enableUser', () => {
    it('should successfully enable a user', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.enableUser({
        username: 'adminuser',
      });

      // Verify AdminEnableUserCommand was called with correct parameters
      expect(AdminEnableUserCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'adminuser',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('deleteUser', () => {
    it('should successfully delete a user', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.deleteUser({
        username: 'adminuser',
      });

      // Verify AdminDeleteUserCommand was called with correct parameters
      expect(AdminDeleteUserCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'adminuser',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('listUsers', () => {
    it('should successfully list users', async () => {
      const mockDate = new Date();
      // Mock successful response
      mockSend.mockResolvedValueOnce({
        Users: [
          {
            Username: 'user1',
            UserCreateDate: mockDate,
            UserLastModifiedDate: mockDate,
            Enabled: true,
            UserStatus: 'CONFIRMED',
            Attributes: [
              { Name: 'sub', Value: 'user1-sub' },
              { Name: 'email', Value: 'user1@example.com' },
            ],
          },
          {
            Username: 'user2',
            UserCreateDate: mockDate,
            UserLastModifiedDate: mockDate,
            Enabled: false,
            UserStatus: 'DISABLED',
            Attributes: [
              { Name: 'sub', Value: 'user2-sub' },
              { Name: 'email', Value: 'user2@example.com' },
            ],
          },
        ],
        PaginationToken: 'next-page-token',
      });

      const result = await client.listUsers({
        limit: 10,
        filter: 'email ^= "user"',
      });

      // Verify ListUsersCommand was called with correct parameters
      expect(ListUsersCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Limit: 10,
        PaginationToken: undefined,
        Filter: 'email ^= "user"',
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        users: [
          {
            username: 'user1',
            userCreateDate: mockDate,
            userLastModifiedDate: mockDate,
            enabled: true,
            userStatus: 'CONFIRMED',
            userAttributes: {
              sub: 'user1-sub',
              email: 'user1@example.com',
            },
            mfaOptions: undefined,
            preferredMfaSetting: undefined,
            userMfaSettingList: undefined,
          },
          {
            username: 'user2',
            userCreateDate: mockDate,
            userLastModifiedDate: mockDate,
            enabled: false,
            userStatus: 'DISABLED',
            userAttributes: {
              sub: 'user2-sub',
              email: 'user2@example.com',
            },
            mfaOptions: undefined,
            preferredMfaSetting: undefined,
            userMfaSettingList: undefined,
          },
        ],
        paginationToken: 'next-page-token',
      });
    });
  });

  describe('initiateAuth', () => {
    it('should successfully initiate auth and return tokens', async () => {
      // Mock successful response with tokens
      mockSend.mockResolvedValueOnce({
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          IdToken: 'mock-id-token',
          RefreshToken: 'mock-refresh-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer',
        },
      });

      const result = await client.initiateAuth({
        username: 'adminuser',
        password: 'Password123!',
      });

      // Verify AdminInitiateAuthCommand was called with correct parameters
      expect(AdminInitiateAuthCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        ClientId: '1234567890abcdef',
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: 'adminuser',
          PASSWORD: 'Password123!',
        },
        ClientMetadata: undefined,
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        challengeName: undefined,
        session: undefined,
        challengeParameters: undefined,
        authenticationResult: {
          accessToken: 'mock-access-token',
          idToken: 'mock-id-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
      });
    });

    it('should handle a challenge response correctly', async () => {
      // Mock response with a challenge
      mockSend.mockResolvedValueOnce({
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        Session: 'mock-session-token',
        ChallengeParameters: {
          USER_ID_FOR_SRP: 'adminuser',
        },
      });

      const result = await client.initiateAuth({
        username: 'adminuser',
        password: 'TempPassword123!',
      });

      // Verify the response includes challenge info
      expect(result).toEqual({
        challengeName: 'NEW_PASSWORD_REQUIRED',
        session: 'mock-session-token',
        challengeParameters: {
          USER_ID_FOR_SRP: 'adminuser',
        },
        authenticationResult: undefined,
      });
    });
  });
});
