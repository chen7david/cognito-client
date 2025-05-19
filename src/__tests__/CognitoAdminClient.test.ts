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
  AdminRespondToAuthChallengeCommand,
  AdminSetUserPasswordCommand,
  AdminResetUserPasswordCommand,
  AdminConfirmSignUpCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  ListGroupsCommand,
  CreateGroupCommand,
  DeleteGroupCommand,
  GetGroupCommand,
  UpdateGroupCommand,
  ListUsersInGroupCommand,
  AdminSetUserMFAPreferenceCommand,
  AdminLinkProviderForUserCommand,
  AdminGetDeviceCommand,
  AdminForgetDeviceCommand,
  AdminListDevicesCommand,
  AdminListGroupsForUserCommand,
  AdminUserGlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createMockCognitoClient } from '../utils/testUtils';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  return {
    CognitoIdentityProviderClient: jest.fn(),
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
    AdminConfirmSignUpCommand: jest.fn(),
    AdminAddUserToGroupCommand: jest.fn(),
    AdminRemoveUserFromGroupCommand: jest.fn(),
    ListGroupsCommand: jest.fn(),
    CreateGroupCommand: jest.fn(),
    DeleteGroupCommand: jest.fn(),
    GetGroupCommand: jest.fn(),
    UpdateGroupCommand: jest.fn(),
    ListUsersInGroupCommand: jest.fn(),
    AdminSetUserMFAPreferenceCommand: jest.fn(),
    AdminLinkProviderForUserCommand: jest.fn(),
    AdminGetDeviceCommand: jest.fn(),
    AdminForgetDeviceCommand: jest.fn(),
    AdminListDevicesCommand: jest.fn(),
    AdminListGroupsForUserCommand: jest.fn(),
    AdminUserGlobalSignOutCommand: jest.fn(),
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
  let mockClient: CognitoIdentityProviderClient;

  beforeEach(() => {
    jest.clearAllMocks();
    const { mockClient: mockedClient, mockSend: send } = createMockCognitoClient();
    mockClient = mockedClient;
    mockSend = send;

    client = new CognitoAdminClient(
      {
        region: 'us-east-1',
        userPoolId: 'us-east-1_abcdef123',
        clientId: '1234567890abcdef',
        credentials: {
          accessKeyId: 'mock-access-key',
          secretAccessKey: 'mock-secret-key',
        },
      },
      mockClient,
    );
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

  describe('adminConfirmSignUp', () => {
    it('should successfully confirm a user registration', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.adminConfirmSignUp({
        username: 'testuser',
      });

      // Verify AdminConfirmSignUpCommand was called with correct parameters
      expect(AdminConfirmSignUpCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'testuser',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('adminAddUserToGroup', () => {
    it('should successfully add a user to a group', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.adminAddUserToGroup({
        username: 'testuser',
        groupName: 'admin-group',
      });

      // Verify AdminAddUserToGroupCommand was called with correct parameters
      expect(AdminAddUserToGroupCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'testuser',
        GroupName: 'admin-group',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('adminRemoveUserFromGroup', () => {
    it('should successfully remove a user from a group', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.adminRemoveUserFromGroup({
        username: 'testuser',
        groupName: 'admin-group',
      });

      // Verify AdminRemoveUserFromGroupCommand was called with correct parameters
      expect(AdminRemoveUserFromGroupCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'testuser',
        GroupName: 'admin-group',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('listGroups', () => {
    it('should successfully list groups', async () => {
      // Mock successful response
      const mockDate = new Date();
      mockSend.mockResolvedValueOnce({
        Groups: [
          {
            GroupName: 'admin-group',
            Description: 'Admin group',
            UserPoolId: 'us-east-1_abcdef123',
            Precedence: 1,
            RoleArn: 'arn:aws:iam::123456789012:role/AdminRole',
            LastModifiedDate: mockDate,
            CreationDate: mockDate,
          },
          {
            GroupName: 'user-group',
            Description: 'User group',
            UserPoolId: 'us-east-1_abcdef123',
            Precedence: 2,
          },
        ],
        NextToken: 'next-token',
      });

      const result = await client.listGroups({ limit: 10 });

      // Verify ListGroupsCommand was called with correct parameters
      expect(ListGroupsCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Limit: 10,
        NextToken: undefined,
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        groups: [
          {
            groupName: 'admin-group',
            description: 'Admin group',
            userPoolId: 'us-east-1_abcdef123',
            precedence: 1,
            roleArn: 'arn:aws:iam::123456789012:role/AdminRole',
            lastModifiedDate: mockDate,
            creationDate: mockDate,
          },
          {
            groupName: 'user-group',
            description: 'User group',
            userPoolId: 'us-east-1_abcdef123',
            precedence: 2,
            roleArn: undefined,
            lastModifiedDate: undefined,
            creationDate: undefined,
          },
        ],
        nextToken: 'next-token',
      });
    });
  });

  describe('createGroup', () => {
    it('should successfully create a group', async () => {
      // Mock successful response
      const mockDate = new Date();
      mockSend.mockResolvedValueOnce({
        Group: {
          GroupName: 'new-group',
          Description: 'New group',
          UserPoolId: 'us-east-1_abcdef123',
          Precedence: 3,
          RoleArn: 'arn:aws:iam::123456789012:role/NewRole',
          LastModifiedDate: mockDate,
          CreationDate: mockDate,
        },
      });

      const result = await client.createGroup({
        groupName: 'new-group',
        description: 'New group',
        precedence: 3,
        roleArn: 'arn:aws:iam::123456789012:role/NewRole',
      });

      // Verify CreateGroupCommand was called with correct parameters
      expect(CreateGroupCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        GroupName: 'new-group',
        Description: 'New group',
        Precedence: 3,
        RoleArn: 'arn:aws:iam::123456789012:role/NewRole',
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        groupName: 'new-group',
        description: 'New group',
        userPoolId: 'us-east-1_abcdef123',
        precedence: 3,
        roleArn: 'arn:aws:iam::123456789012:role/NewRole',
        lastModifiedDate: mockDate,
        creationDate: mockDate,
      });
    });
  });

  describe('getGroup', () => {
    it('should successfully get a group', async () => {
      // Mock successful response
      const mockDate = new Date();
      mockSend.mockResolvedValueOnce({
        Group: {
          GroupName: 'admin-group',
          Description: 'Admin group',
          UserPoolId: 'us-east-1_abcdef123',
          Precedence: 1,
          RoleArn: 'arn:aws:iam::123456789012:role/AdminRole',
          LastModifiedDate: mockDate,
          CreationDate: mockDate,
        },
      });

      const result = await client.getGroup({
        groupName: 'admin-group',
      });

      // Verify GetGroupCommand was called with correct parameters
      expect(GetGroupCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        GroupName: 'admin-group',
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        groupName: 'admin-group',
        description: 'Admin group',
        userPoolId: 'us-east-1_abcdef123',
        precedence: 1,
        roleArn: 'arn:aws:iam::123456789012:role/AdminRole',
        lastModifiedDate: mockDate,
        creationDate: mockDate,
      });
    });
  });

  describe('adminUserGlobalSignOut', () => {
    it('should successfully sign out a user from all devices', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.adminUserGlobalSignOut({
        username: 'testuser',
      });

      // Verify AdminUserGlobalSignOutCommand was called with correct parameters
      expect(AdminUserGlobalSignOutCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'testuser',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('respondToAuthChallenge', () => {
    it('should successfully respond to an auth challenge', async () => {
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

      const result = await client.respondToAuthChallenge({
        challengeName: 'NEW_PASSWORD_REQUIRED',
        challengeResponses: {
          USERNAME: 'testuser',
          NEW_PASSWORD: 'NewPassword123!',
        },
        session: 'session-token',
      });

      // Verify AdminRespondToAuthChallengeCommand was called with correct parameters
      expect(AdminRespondToAuthChallengeCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        ClientId: '1234567890abcdef',
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        ChallengeResponses: {
          USERNAME: 'testuser',
          NEW_PASSWORD: 'NewPassword123!',
        },
        Session: 'session-token',
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
      // Mock response with another challenge
      mockSend.mockResolvedValueOnce({
        ChallengeName: 'SOFTWARE_TOKEN_MFA',
        Session: 'new-session-token',
        ChallengeParameters: {
          USER_ID_FOR_SRP: 'testuser',
        },
      });

      const result = await client.respondToAuthChallenge({
        challengeName: 'NEW_PASSWORD_REQUIRED',
        challengeResponses: {
          USERNAME: 'testuser',
          NEW_PASSWORD: 'NewPassword123!',
        },
        session: 'session-token',
      });

      // Verify the response includes challenge info
      expect(result).toEqual({
        challengeName: 'SOFTWARE_TOKEN_MFA',
        session: 'new-session-token',
        challengeParameters: {
          USER_ID_FOR_SRP: 'testuser',
        },
        authenticationResult: undefined,
      });
    });
  });

  describe('resetUserPassword', () => {
    it('should successfully reset a user password', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.resetUserPassword({
        username: 'testuser',
      });

      // Verify AdminResetUserPasswordCommand was called with correct parameters
      expect(AdminResetUserPasswordCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'testuser',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('setUserPassword', () => {
    it('should successfully set a user password', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.setUserPassword('testuser', 'NewPassword123!', true);

      // Verify AdminSetUserPasswordCommand was called with correct parameters
      expect(AdminSetUserPasswordCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'testuser',
        Password: 'NewPassword123!',
        Permanent: true,
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('deleteGroup', () => {
    it('should successfully delete a group', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.deleteGroup({
        groupName: 'test-group',
      });

      // Verify DeleteGroupCommand was called with correct parameters
      expect(DeleteGroupCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        GroupName: 'test-group',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('updateGroup', () => {
    it('should successfully update a group', async () => {
      // Mock successful response
      const mockDate = new Date();
      mockSend.mockResolvedValueOnce({
        Group: {
          GroupName: 'test-group',
          Description: 'Updated group description',
          UserPoolId: 'us-east-1_abcdef123',
          Precedence: 5,
          RoleArn: 'arn:aws:iam::123456789012:role/UpdatedRole',
          LastModifiedDate: mockDate,
          CreationDate: mockDate,
        },
      });

      const result = await client.updateGroup({
        groupName: 'test-group',
        description: 'Updated group description',
        precedence: 5,
        roleArn: 'arn:aws:iam::123456789012:role/UpdatedRole',
      });

      // Verify UpdateGroupCommand was called with correct parameters
      expect(UpdateGroupCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        GroupName: 'test-group',
        Description: 'Updated group description',
        Precedence: 5,
        RoleArn: 'arn:aws:iam::123456789012:role/UpdatedRole',
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        groupName: 'test-group',
        description: 'Updated group description',
        userPoolId: 'us-east-1_abcdef123',
        precedence: 5,
        roleArn: 'arn:aws:iam::123456789012:role/UpdatedRole',
        lastModifiedDate: mockDate,
        creationDate: mockDate,
      });
    });

    it('should throw an error when group information is not returned', async () => {
      // Mock response with no group information
      mockSend.mockResolvedValueOnce({
        // No Group field
      });

      await expect(
        client.updateGroup({
          groupName: 'test-group',
        }),
      ).rejects.toThrow('Failed to update group: No group information returned');

      // Verify UpdateGroupCommand was still called
      expect(UpdateGroupCommand).toHaveBeenCalled();
    });
  });

  describe('listUsersInGroup', () => {
    it('should successfully list users in a group', async () => {
      // Mock successful response
      const mockDate = new Date();
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
            Enabled: true,
            UserStatus: 'CONFIRMED',
            Attributes: [
              { Name: 'sub', Value: 'user2-sub' },
              { Name: 'email', Value: 'user2@example.com' },
            ],
          },
        ],
        NextToken: 'next-token',
      });

      const result = await client.listUsersInGroup({
        groupName: 'test-group',
        limit: 10,
      });

      // Verify ListUsersInGroupCommand was called with correct parameters
      expect(ListUsersInGroupCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        GroupName: 'test-group',
        Limit: 10,
        NextToken: undefined,
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
            enabled: true,
            userStatus: 'CONFIRMED',
            userAttributes: {
              sub: 'user2-sub',
              email: 'user2@example.com',
            },
            mfaOptions: undefined,
            preferredMfaSetting: undefined,
            userMfaSettingList: undefined,
          },
        ],
        nextToken: 'next-token',
      });
    });
  });

  describe('adminListGroupsForUser', () => {
    it('should successfully list groups for a user', async () => {
      // Mock successful response
      const mockDate = new Date();
      mockSend.mockResolvedValueOnce({
        Groups: [
          {
            GroupName: 'group1',
            Description: 'First group',
            UserPoolId: 'us-east-1_abcdef123',
            Precedence: 1,
            RoleArn: 'arn:aws:iam::123456789012:role/Group1Role',
            LastModifiedDate: mockDate,
            CreationDate: mockDate,
          },
          {
            GroupName: 'group2',
            Description: 'Second group',
            UserPoolId: 'us-east-1_abcdef123',
            Precedence: 2,
          },
        ],
        NextToken: 'next-token',
      });

      const result = await client.adminListGroupsForUser({
        username: 'testuser',
        limit: 10,
      });

      // Verify AdminListGroupsForUserCommand was called with correct parameters
      expect(AdminListGroupsForUserCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'testuser',
        Limit: 10,
        NextToken: undefined,
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        groups: [
          {
            groupName: 'group1',
            description: 'First group',
            userPoolId: 'us-east-1_abcdef123',
            precedence: 1,
            roleArn: 'arn:aws:iam::123456789012:role/Group1Role',
            lastModifiedDate: mockDate,
            creationDate: mockDate,
          },
          {
            groupName: 'group2',
            description: 'Second group',
            userPoolId: 'us-east-1_abcdef123',
            precedence: 2,
            roleArn: undefined,
            lastModifiedDate: undefined,
            creationDate: undefined,
          },
        ],
        nextToken: 'next-token',
      });
    });
  });

  describe('adminSetUserMFAPreference', () => {
    it('should successfully set MFA preferences for a user', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.adminSetUserMFAPreference({
        username: 'testuser',
        smsMfaSettings: {
          enabled: true,
          preferred: true,
        },
        softwareTokenMfaSettings: {
          enabled: true,
          preferred: false,
        },
      });

      // Verify AdminSetUserMFAPreferenceCommand was called with correct parameters
      expect(AdminSetUserMFAPreferenceCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'testuser',
        SMSMfaSettings: {
          Enabled: true,
          PreferredMfa: true,
        },
        SoftwareTokenMfaSettings: {
          Enabled: true,
          PreferredMfa: false,
        },
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('adminLinkProviderForUser', () => {
    it('should successfully link a provider for a user', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.adminLinkProviderForUser({
        username: 'testuser',
        providerName: 'Facebook',
        providerAttributeName: 'Cognito_Subject',
        providerAttributeValue: 'facebook-user-id',
      });

      // Verify AdminLinkProviderForUserCommand was called with correct parameters
      expect(AdminLinkProviderForUserCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        DestinationUser: {
          ProviderName: 'Cognito',
          ProviderAttributeName: 'Username',
          ProviderAttributeValue: 'testuser',
        },
        SourceUser: {
          ProviderName: 'Facebook',
          ProviderAttributeName: 'Cognito_Subject',
          ProviderAttributeValue: 'facebook-user-id',
        },
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('adminGetDevice', () => {
    it('should successfully get information about a user device', async () => {
      const mockDate = new Date();
      // Mock successful response
      mockSend.mockResolvedValueOnce({
        Device: {
          DeviceKey: 'device-key-123',
          DeviceAttributes: [
            { Name: 'device_name', Value: 'iPhone' },
            { Name: 'device_type', Value: 'mobile' },
          ],
          DeviceCreateDate: mockDate,
          DeviceLastModifiedDate: mockDate,
          DeviceLastAuthenticatedDate: mockDate,
        },
      });

      const result = await client.adminGetDevice({
        username: 'testuser',
        deviceKey: 'device-key-123',
      });

      // Verify AdminGetDeviceCommand was called with correct parameters
      expect(AdminGetDeviceCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'testuser',
        DeviceKey: 'device-key-123',
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        deviceKey: 'device-key-123',
        deviceAttributes: {
          deviceName: 'iPhone',
          deviceType: 'mobile',
        },
        deviceCreateDate: mockDate,
        deviceLastModifiedDate: mockDate,
        deviceLastAuthenticatedDate: mockDate,
      });
    });

    it('should throw an error when no device information is returned', async () => {
      // Mock response with no device information
      mockSend.mockResolvedValueOnce({
        // No Device field
      });

      await expect(
        client.adminGetDevice({
          username: 'testuser',
          deviceKey: 'device-key-123',
        }),
      ).rejects.toThrow('Failed to get device: No device information returned');

      // Verify AdminGetDeviceCommand was still called
      expect(AdminGetDeviceCommand).toHaveBeenCalled();
    });
  });

  describe('adminForgetDevice', () => {
    it('should successfully forget a user device', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.adminForgetDevice({
        username: 'testuser',
        deviceKey: 'device-key-123',
      });

      // Verify AdminForgetDeviceCommand was called with correct parameters
      expect(AdminForgetDeviceCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'testuser',
        DeviceKey: 'device-key-123',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('adminListDevices', () => {
    it('should successfully list user devices', async () => {
      const mockDate = new Date();
      // Mock successful response
      mockSend.mockResolvedValueOnce({
        Devices: [
          {
            DeviceKey: 'device-key-1',
            DeviceAttributes: [{ Name: 'device_name', Value: 'iPhone' }],
            DeviceCreateDate: mockDate,
            DeviceLastModifiedDate: mockDate,
          },
          {
            DeviceKey: 'device-key-2',
            DeviceAttributes: [{ Name: 'device_name', Value: 'Android' }],
            DeviceCreateDate: mockDate,
            DeviceLastModifiedDate: mockDate,
            DeviceLastAuthenticatedDate: mockDate,
          },
        ],
        PaginationToken: 'next-page-token',
      });

      const result = await client.adminListDevices({
        username: 'testuser',
        limit: 10,
      });

      // Verify AdminListDevicesCommand was called with correct parameters
      expect(AdminListDevicesCommand).toHaveBeenCalledWith({
        UserPoolId: 'us-east-1_abcdef123',
        Username: 'testuser',
        Limit: 10,
        PaginationToken: undefined,
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        devices: [
          {
            deviceKey: 'device-key-1',
            deviceAttributes: {
              deviceName: 'iPhone',
            },
            deviceCreateDate: mockDate,
            deviceLastModifiedDate: mockDate,
            deviceLastAuthenticatedDate: undefined,
          },
          {
            deviceKey: 'device-key-2',
            deviceAttributes: {
              deviceName: 'Android',
            },
            deviceCreateDate: mockDate,
            deviceLastModifiedDate: mockDate,
            deviceLastAuthenticatedDate: mockDate,
          },
        ],
        paginationToken: 'next-page-token',
      });
    });
  });
});
