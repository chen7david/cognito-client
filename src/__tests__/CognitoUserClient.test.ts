import { CognitoUserClient } from '../lib/CognitoUserClient';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createMockCognitoClient, createMockAuthResult } from '../utils/testUtils';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  return {
    CognitoIdentityProviderClient: jest.fn(),
    InitiateAuthCommand: jest.fn(),
    SignUpCommand: jest.fn(),
    ConfirmSignUpCommand: jest.fn(),
    ForgotPasswordCommand: jest.fn(),
    ConfirmForgotPasswordCommand: jest.fn(),
    RespondToAuthChallengeCommand: jest.fn(),
    ChangePasswordCommand: jest.fn(),
    AuthFlowType: {
      USER_PASSWORD_AUTH: 'USER_PASSWORD_AUTH',
      REFRESH_TOKEN_AUTH: 'REFRESH_TOKEN_AUTH',
    },
    ChallengeNameType: {
      NEW_PASSWORD_REQUIRED: 'NEW_PASSWORD_REQUIRED',
    },
  };
});

describe('CognitoUserClient', () => {
  let client: CognitoUserClient;
  let mockSend: jest.Mock;
  let mockClient: CognitoIdentityProviderClient;

  beforeEach(() => {
    jest.clearAllMocks();
    const { mockClient: mockedClient, mockSend: send } = createMockCognitoClient();
    mockClient = mockedClient;
    mockSend = send;

    client = new CognitoUserClient(
      {
        region: 'us-east-1',
        userPoolId: 'us-east-1_abcdef123',
        clientId: '1234567890abcdef',
      },
      mockClient,
    );
  });

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      // Mock successful authentication response
      const mockAuthResult = createMockAuthResult({
        AccessToken: 'mock-access-token',
        IdToken: 'mock-id-token',
        RefreshToken: 'mock-refresh-token',
        ExpiresIn: 3600,
      });

      mockSend.mockResolvedValueOnce({
        AuthenticationResult: mockAuthResult,
      });

      const result = await client.signIn({
        username: 'testuser',
        password: 'password123',
      });

      // Verify InitiateAuthCommand was called with correct parameters
      expect(InitiateAuthCommand).toHaveBeenCalledWith({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: '1234567890abcdef',
        AuthParameters: {
          USERNAME: 'testuser',
          PASSWORD: 'password123',
        },
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
    });

    it('should throw an error when authentication fails', async () => {
      // Mock failed authentication response
      mockSend.mockRejectedValueOnce({
        name: 'NotAuthorizedException',
        message: 'Incorrect username or password',
        code: 'NotAuthorizedException',
      });

      await expect(
        client.signIn({
          username: 'testuser',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow('SignIn error: Incorrect username or password');

      // Verify InitiateAuthCommand was still called
      expect(InitiateAuthCommand).toHaveBeenCalled();
    });
  });

  describe('registerUser', () => {
    it('should successfully register a user', async () => {
      // Mock successful sign up response
      mockSend.mockResolvedValueOnce({
        UserSub: 'mock-user-sub',
        UserConfirmed: false,
      });

      const result = await client.registerUser({
        username: 'newuser',
        password: 'Password123!',
        email: 'newuser@example.com',
        phone: '+12345678901',
        attributes: {
          custom: 'value',
        },
      });

      // Verify SignUpCommand was called with correct parameters
      expect(SignUpCommand).toHaveBeenCalledWith({
        ClientId: '1234567890abcdef',
        Username: 'newuser',
        Password: 'Password123!',
        UserAttributes: expect.arrayContaining([
          { Name: 'email', Value: 'newuser@example.com' },
          { Name: 'phone_number', Value: '+12345678901' },
          { Name: 'custom', Value: 'value' },
        ]),
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        userId: 'newuser',
        userSub: 'mock-user-sub',
        userConfirmed: false,
      });
    });
  });

  describe('confirmRegistration', () => {
    it('should successfully confirm a user registration', async () => {
      // Mock successful confirmation response
      mockSend.mockResolvedValueOnce({});

      const result = await client.confirmRegistration({
        username: 'newuser',
        confirmationCode: '123456',
      });

      // Verify ConfirmSignUpCommand was called with correct parameters
      expect(ConfirmSignUpCommand).toHaveBeenCalledWith({
        ClientId: '1234567890abcdef',
        Username: 'newuser',
        ConfirmationCode: '123456',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('forgotPassword', () => {
    it('should successfully initiate forgot password flow', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.forgotPassword({
        username: 'someuser',
      });

      // Verify ForgotPasswordCommand was called with correct parameters
      expect(ForgotPasswordCommand).toHaveBeenCalledWith({
        ClientId: '1234567890abcdef',
        Username: 'someuser',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset a password', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.resetPassword({
        username: 'someuser',
        confirmationCode: '123456',
        newPassword: 'NewPassword123!',
      });

      // Verify ConfirmForgotPasswordCommand was called with correct parameters
      expect(ConfirmForgotPasswordCommand).toHaveBeenCalledWith({
        ClientId: '1234567890abcdef',
        Username: 'someuser',
        ConfirmationCode: '123456',
        Password: 'NewPassword123!',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('changePassword', () => {
    it('should successfully change a password', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.changePassword({
        accessToken: 'mock-access-token',
        oldPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      });

      // Verify ChangePasswordCommand was called with correct parameters
      expect(ChangePasswordCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
        PreviousPassword: 'OldPassword123!',
        ProposedPassword: 'NewPassword123!',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });
});
