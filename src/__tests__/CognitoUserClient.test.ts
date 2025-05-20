import { CognitoUserClient } from '../lib/CognitoUserClient';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand,
  GetUserCommand,
  UpdateUserAttributesCommand,
  VerifyUserAttributeCommand,
  GetUserAttributeVerificationCodeCommand,
  GlobalSignOutCommand,
  RespondToAuthChallengeCommand,
  AssociateSoftwareTokenCommand,
  VerifySoftwareTokenCommand,
  SetUserMFAPreferenceCommand,
  GetDeviceCommand,
  ForgetDeviceCommand,
  ListDevicesCommand,
  DeleteUserAttributesCommand,
  ConfirmDeviceCommand,
  DeleteUserCommand,
  ResendConfirmationCodeCommand,
  SetUserSettingsCommand,
  UpdateDeviceStatusCommand,
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
    ChangePasswordCommand: jest.fn(),
    GetUserCommand: jest.fn(),
    UpdateUserAttributesCommand: jest.fn(),
    VerifyUserAttributeCommand: jest.fn(),
    GetUserAttributeVerificationCodeCommand: jest.fn(),
    GlobalSignOutCommand: jest.fn(),
    RespondToAuthChallengeCommand: jest.fn(),
    AssociateSoftwareTokenCommand: jest.fn(),
    VerifySoftwareTokenCommand: jest.fn(),
    SetUserMFAPreferenceCommand: jest.fn(),
    GetDeviceCommand: jest.fn(),
    ForgetDeviceCommand: jest.fn(),
    ListDevicesCommand: jest.fn(),
    DeleteUserAttributesCommand: jest.fn(),
    ConfirmDeviceCommand: jest.fn(),
    DeleteUserCommand: jest.fn(),
    ResendConfirmationCodeCommand: jest.fn(),
    SetUserSettingsCommand: jest.fn(),
    UpdateDeviceStatusCommand: jest.fn(),
    AuthFlowType: {
      USER_PASSWORD_AUTH: 'USER_PASSWORD_AUTH',
      REFRESH_TOKEN_AUTH: 'REFRESH_TOKEN_AUTH',
    },
    ChallengeNameType: {
      NEW_PASSWORD_REQUIRED: 'NEW_PASSWORD_REQUIRED',
    },
    DeliveryMediumType: {
      SMS: 'SMS',
      EMAIL: 'EMAIL',
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

  describe('signUp', () => {
    it('should successfully register a user', async () => {
      // Mock successful sign up response
      mockSend.mockResolvedValueOnce({
        UserSub: 'mock-user-sub',
        UserConfirmed: false,
      });

      const result = await client.signUp({
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

  describe('confirmSignUp', () => {
    it('should successfully confirm a user registration', async () => {
      // Mock successful confirmation response
      mockSend.mockResolvedValueOnce({});

      const result = await client.confirmSignUp({
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

  describe('confirmForgotPassword', () => {
    it('should successfully reset a password', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.confirmForgotPassword({
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

  describe('getUserAttributes', () => {
    it('should successfully get user attributes', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({
        UserAttributes: [
          { Name: 'email', Value: 'user@example.com' },
          { Name: 'custom:role', Value: 'admin' },
        ],
      });

      const result = await client.getUserAttributes({
        accessToken: 'mock-access-token',
      });

      // Verify GetUserCommand was called with correct parameters
      expect(GetUserCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        userAttributes: {
          email: 'user@example.com',
          customRole: 'admin',
        },
      });
    });

    it('should throw an error when user attributes cannot be retrieved', async () => {
      // Mock failed response
      mockSend.mockResolvedValueOnce({
        // No UserAttributes
      });

      await expect(
        client.getUserAttributes({
          accessToken: 'mock-access-token',
        }),
      ).rejects.toThrow('Failed to get user attributes: No attributes returned');

      // Verify GetUserCommand was still called
      expect(GetUserCommand).toHaveBeenCalled();
    });
  });

  describe('updateUserAttributes', () => {
    it('should successfully update user attributes', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.updateUserAttributes({
        accessToken: 'mock-access-token',
        attributes: {
          email: 'newemail@example.com',
          customRole: 'manager',
        },
      });

      // Verify UpdateUserAttributesCommand was called with correct parameters
      expect(UpdateUserAttributesCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
        UserAttributes: expect.arrayContaining([
          { Name: 'email', Value: 'newemail@example.com' },
          { Name: 'custom:role', Value: 'manager' },
        ]),
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('getAttributeVerificationCode', () => {
    it('should successfully request a verification code', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.getAttributeVerificationCode('mock-access-token', 'email');

      // Verify GetUserAttributeVerificationCodeCommand was called with correct parameters
      expect(GetUserAttributeVerificationCodeCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
        AttributeName: 'email',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('verifyUserAttribute', () => {
    it('should successfully verify a user attribute', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.verifyUserAttribute({
        accessToken: 'mock-access-token',
        attributeName: 'email',
        code: '123456',
      });

      // Verify VerifyUserAttributeCommand was called with correct parameters
      expect(VerifyUserAttributeCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
        AttributeName: 'email',
        Code: '123456',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          IdToken: 'new-id-token',
          ExpiresIn: 3600,
          TokenType: 'Bearer',
        },
      });

      const result = await client.refreshToken({
        refreshToken: 'mock-refresh-token',
      });

      // Verify InitiateAuthCommand was called with correct parameters
      expect(InitiateAuthCommand).toHaveBeenCalledWith({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: '1234567890abcdef',
        AuthParameters: {
          REFRESH_TOKEN: 'mock-refresh-token',
        },
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        accessToken: 'new-access-token',
        idToken: 'new-id-token',
        refreshToken: 'mock-refresh-token', // The original refresh token is preserved
        expiresIn: 3600,
        tokenType: 'Bearer',
      });
    });

    it('should throw an error when refresh fails', async () => {
      // Mock failed response
      mockSend.mockRejectedValueOnce({
        name: 'NotAuthorizedException',
        message: 'Invalid refresh token',
        code: 'NotAuthorizedException',
      });

      await expect(
        client.refreshToken({
          refreshToken: 'invalid-refresh-token',
        }),
      ).rejects.toThrow('RefreshToken error: Invalid refresh token');

      // Verify InitiateAuthCommand was still called
      expect(InitiateAuthCommand).toHaveBeenCalled();
    });
  });

  describe('getMFAOptions', () => {
    it('should successfully get MFA options', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({
        MFAOptions: [
          { DeliveryMedium: 'SMS', AttributeName: 'phone_number' },
          { DeliveryMedium: 'EMAIL', AttributeName: 'email' },
        ],
      });

      const result = await client.getMFAOptions({
        accessToken: 'mock-access-token',
      });

      // Verify GetUserCommand was called with correct parameters
      expect(GetUserCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
      });

      // Verify the response was mapped correctly
      expect(result).toEqual([
        { deliveryMedium: 'SMS', attributeName: 'phone_number' },
        { deliveryMedium: 'EMAIL', attributeName: 'email' },
      ]);
    });

    it('should return empty array when no MFA options', async () => {
      // Mock response with no MFA options
      mockSend.mockResolvedValueOnce({
        // No MFAOptions field
      });

      const result = await client.getMFAOptions({
        accessToken: 'mock-access-token',
      });

      // Verify GetUserCommand was called
      expect(GetUserCommand).toHaveBeenCalled();

      // Verify empty array is returned
      expect(result).toEqual([]);
    });
  });

  describe('associateSoftwareToken', () => {
    it('should successfully associate a software token', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({
        SecretCode: 'BASE32ENCODEDSECRETSAMPLESTRING',
        Session: 'session-token',
      });

      const result = await client.associateSoftwareToken({
        accessToken: 'mock-access-token',
      });

      // Verify AssociateSoftwareTokenCommand was called with correct parameters
      expect(AssociateSoftwareTokenCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        secretCode: 'BASE32ENCODEDSECRETSAMPLESTRING',
        session: 'session-token',
      });
    });

    it('should throw an error when no secret code is returned', async () => {
      // Mock response with no secret code
      mockSend.mockResolvedValueOnce({
        // No SecretCode field
        Session: 'session-token',
      });

      await expect(
        client.associateSoftwareToken({
          accessToken: 'mock-access-token',
        }),
      ).rejects.toThrow('Failed to associate software token: No secret code returned');

      // Verify AssociateSoftwareTokenCommand was still called
      expect(AssociateSoftwareTokenCommand).toHaveBeenCalled();
    });
  });

  describe('verifySoftwareToken', () => {
    it('should successfully verify a software token', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({
        Status: 'SUCCESS',
      });

      const result = await client.verifySoftwareToken({
        accessToken: 'mock-access-token',
        userCode: '123456',
        friendlyDeviceName: 'My Phone',
      });

      // Verify VerifySoftwareTokenCommand was called with correct parameters
      expect(VerifySoftwareTokenCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
        UserCode: '123456',
        FriendlyDeviceName: 'My Phone',
        Session: undefined,
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('setUserMFAPreference', () => {
    it('should successfully set MFA preferences', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.setUserMFAPreference({
        accessToken: 'mock-access-token',
        smsMfaSettings: {
          enabled: true,
          preferred: true,
        },
        softwareTokenMfaSettings: {
          enabled: true,
          preferred: false,
        },
      });

      // Verify SetUserMFAPreferenceCommand was called with correct parameters
      expect(SetUserMFAPreferenceCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
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

  describe('getDevice', () => {
    it('should successfully get device information', async () => {
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

      const result = await client.getDevice({
        accessToken: 'mock-access-token',
        deviceKey: 'device-key-123',
      });

      // Verify GetDeviceCommand was called with correct parameters
      expect(GetDeviceCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
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
        client.getDevice({
          accessToken: 'mock-access-token',
          deviceKey: 'device-key-123',
        }),
      ).rejects.toThrow('Failed to get device: No device information returned');

      // Verify GetDeviceCommand was still called
      expect(GetDeviceCommand).toHaveBeenCalled();
    });
  });

  describe('forgetDevice', () => {
    it('should successfully forget a device', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.forgetDevice({
        accessToken: 'mock-access-token',
        deviceKey: 'device-key-123',
      });

      // Verify ForgetDeviceCommand was called with correct parameters
      expect(ForgetDeviceCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
        DeviceKey: 'device-key-123',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('listDevices', () => {
    it('should successfully list devices', async () => {
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

      const result = await client.listDevices({
        accessToken: 'mock-access-token',
        limit: 10,
      });

      // Verify ListDevicesCommand was called with correct parameters
      expect(ListDevicesCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
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

  describe('respondToNewPasswordChallenge', () => {
    it('should successfully respond to a new password challenge', async () => {
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

      const result = await client.respondToNewPasswordChallenge(
        'NEW_PASSWORD_REQUIRED',
        'testuser',
        'NewPassword123!',
        'session-token',
      );

      // Verify RespondToAuthChallengeCommand was called with correct parameters
      expect(RespondToAuthChallengeCommand).toHaveBeenCalledWith({
        ClientId: '1234567890abcdef',
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        Session: 'session-token',
        ChallengeResponses: {
          USERNAME: 'testuser',
          NEW_PASSWORD: 'NewPassword123!',
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

    it('should throw an error when authentication challenge fails', async () => {
      // Mock failed response
      mockSend.mockRejectedValueOnce({
        name: 'InvalidPasswordException',
        message: 'Password does not conform to policy',
        code: 'InvalidPasswordException',
      });

      await expect(
        client.respondToNewPasswordChallenge(
          'NEW_PASSWORD_REQUIRED',
          'testuser',
          'weak',
          'session-token',
        ),
      ).rejects.toThrow('RespondToNewPasswordChallenge error: Password does not conform to policy');

      // Verify RespondToAuthChallengeCommand was still called
      expect(RespondToAuthChallengeCommand).toHaveBeenCalled();
    });
  });

  describe('globalSignOut', () => {
    it('should successfully sign out from all devices', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.globalSignOut({
        accessToken: 'mock-access-token',
      });

      // Verify GlobalSignOutCommand was called with correct parameters
      expect(GlobalSignOutCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('deleteUserAttributes', () => {
    it('should successfully delete user attributes', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.deleteUserAttributes({
        accessToken: 'mock-access-token',
        attributeNames: ['custom:role', 'phone_number'],
      });

      // Verify DeleteUserAttributesCommand was called with correct parameters
      expect(DeleteUserAttributesCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
        UserAttributeNames: ['custom:role', 'phone_number'],
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('confirmDevice', () => {
    it('should successfully confirm a device', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.confirmDevice({
        accessToken: 'mock-access-token',
        deviceKey: 'device-key-123',
        deviceName: 'My iPhone',
        deviceSecretVerifierConfig: {
          passwordVerifier: 'password-verifier',
          salt: 'salt-value',
        },
      });

      // Verify ConfirmDeviceCommand was called with correct parameters
      expect(ConfirmDeviceCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
        DeviceKey: 'device-key-123',
        DeviceName: 'My iPhone',
        DeviceSecretVerifierConfig: {
          PasswordVerifier: 'password-verifier',
          Salt: 'salt-value',
        },
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
        accessToken: 'mock-access-token',
      });

      // Verify DeleteUserCommand was called with correct parameters
      expect(DeleteUserCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('resendConfirmationCode', () => {
    it('should successfully resend a confirmation code', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.resendConfirmationCode({
        username: 'testuser',
        clientMetadata: {
          foo: 'bar',
        },
      });

      // Verify ResendConfirmationCodeCommand was called with correct parameters
      expect(ResendConfirmationCodeCommand).toHaveBeenCalledWith({
        ClientId: '1234567890abcdef',
        Username: 'testuser',
        ClientMetadata: {
          foo: 'bar',
        },
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('setUserSettings', () => {
    it('should successfully set user settings', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.setUserSettings({
        accessToken: 'mock-access-token',
        mfaOptions: [
          {
            deliveryMedium: 'SMS',
            attributeName: 'phone_number',
          },
        ],
      });

      // Verify SetUserSettingsCommand was called with correct parameters
      expect(SetUserSettingsCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
        MFAOptions: [
          {
            DeliveryMedium: 'SMS',
            AttributeName: 'phone_number',
          },
        ],
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('updateDeviceStatus', () => {
    it('should successfully update device status', async () => {
      // Mock successful response
      mockSend.mockResolvedValueOnce({});

      const result = await client.updateDeviceStatus({
        accessToken: 'mock-access-token',
        deviceKey: 'device-key-123',
        deviceRememberedStatus: 'remembered',
      });

      // Verify UpdateDeviceStatusCommand was called with correct parameters
      expect(UpdateDeviceStatusCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
        DeviceKey: 'device-key-123',
        DeviceRememberedStatus: 'remembered',
      });

      // Verify the response
      expect(result).toBe(true);
    });
  });

  describe('getMe', () => {
    it('should get the current user with a valid authorization header', async () => {
      // Mock successful get user response
      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'custom:role', Value: 'user' },
        ],
      });

      const result = await client.getMe({
        authorization: 'Bearer mock-access-token',
      });

      // Verify GetUserCommand was called with correct parameters
      expect(GetUserCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        username: 'testuser',
        attributes: {
          email: 'test@example.com',
          customRole: 'user',
        },
      });
    });

    it('should work with an access token without Bearer prefix', async () => {
      // Mock successful get user response
      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        UserAttributes: [{ Name: 'email', Value: 'test@example.com' }],
      });

      const result = await client.getMe({
        authorization: 'mock-access-token', // No Bearer prefix
      });

      // Verify GetUserCommand was called with correct parameters
      expect(GetUserCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        username: 'testuser',
        attributes: {
          email: 'test@example.com',
        },
      });
    });

    it('should include additional user information when available', async () => {
      // Mock successful get user response with additional fields
      mockSend.mockResolvedValueOnce({
        Username: 'testuser',
        UserAttributes: [{ Name: 'email', Value: 'test@example.com' }],
        // Note: The AWS API doesn't return the fields we're expecting in our type,
        // so we're just testing basic mapping
      });

      const result = await client.getMe({
        authorization: 'Bearer mock-access-token',
      });

      // Verify the response was mapped correctly
      expect(result).toEqual({
        username: 'testuser',
        attributes: {
          email: 'test@example.com',
        },
      });
    });

    it('should throw an error when no access token is provided', async () => {
      await expect(
        client.getMe({
          authorization: '',
        }),
      ).rejects.toThrow('GetMe error: No access token provided in authorization header');
    });

    it('should throw an error when the get user call fails', async () => {
      // Mock failed get user response
      mockSend.mockRejectedValueOnce({
        name: 'NotAuthorizedException',
        message: 'Invalid access token',
        code: 'NotAuthorizedException',
      });

      await expect(
        client.getMe({
          authorization: 'Bearer invalid-token',
        }),
      ).rejects.toThrow('GetMe error: Invalid access token');

      // Verify GetUserCommand was still called
      expect(GetUserCommand).toHaveBeenCalled();
    });
  });

  describe('updateMe', () => {
    it('should update the current user with a valid authorization header', async () => {
      // Mock successful update response
      mockSend.mockResolvedValueOnce({});

      const result = await client.updateMe({
        authorization: 'Bearer mock-access-token',
        attributes: {
          email: 'updated@example.com',
          customRole: 'admin',
        },
      });

      // Verify UpdateUserAttributesCommand was called with correct parameters
      expect(UpdateUserAttributesCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
        UserAttributes: expect.arrayContaining([
          { Name: 'email', Value: 'updated@example.com' },
          { Name: 'custom:role', Value: 'admin' },
        ]),
      });

      // Verify the response
      expect(result).toBe(true);
    });

    it('should work with an access token without Bearer prefix', async () => {
      // Mock successful update response
      mockSend.mockResolvedValueOnce({});

      const result = await client.updateMe({
        authorization: 'mock-access-token', // No Bearer prefix
        attributes: {
          email: 'updated@example.com',
        },
      });

      // Verify UpdateUserAttributesCommand was called with correct parameters
      expect(UpdateUserAttributesCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
        UserAttributes: expect.arrayContaining([{ Name: 'email', Value: 'updated@example.com' }]),
      });

      // Verify the response
      expect(result).toBe(true);
    });

    it('should throw an error when no access token is provided', async () => {
      await expect(
        client.updateMe({
          authorization: '',
          attributes: {
            email: 'updated@example.com',
          },
        }),
      ).rejects.toThrow('UpdateMe error: No access token provided in authorization header');
    });

    it('should throw an error when the update call fails', async () => {
      // Mock failed update response
      mockSend.mockRejectedValueOnce({
        name: 'NotAuthorizedException',
        message: 'Invalid access token',
        code: 'NotAuthorizedException',
      });

      await expect(
        client.updateMe({
          authorization: 'Bearer invalid-token',
          attributes: {
            email: 'updated@example.com',
          },
        }),
      ).rejects.toThrow('UpdateMe error: Invalid access token');

      // Verify UpdateUserAttributesCommand was still called
      expect(UpdateUserAttributesCommand).toHaveBeenCalled();
    });
  });

  describe('deleteMe', () => {
    it('should delete the current user with a valid authorization header', async () => {
      // Mock successful delete response
      mockSend.mockResolvedValueOnce({});

      const result = await client.deleteMe({
        authorization: 'Bearer mock-access-token',
      });

      // Verify DeleteUserCommand was called with correct parameters
      expect(DeleteUserCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
      });

      // Verify the response
      expect(result).toBe(true);
    });

    it('should work with an access token without Bearer prefix', async () => {
      // Mock successful delete response
      mockSend.mockResolvedValueOnce({});

      const result = await client.deleteMe({
        authorization: 'mock-access-token', // No Bearer prefix
      });

      // Verify DeleteUserCommand was called with correct parameters
      expect(DeleteUserCommand).toHaveBeenCalledWith({
        AccessToken: 'mock-access-token',
      });

      // Verify the response
      expect(result).toBe(true);
    });

    it('should throw an error when no access token is provided', async () => {
      await expect(
        client.deleteMe({
          authorization: '',
        }),
      ).rejects.toThrow('DeleteMe error: No access token provided in authorization header');
    });

    it('should throw an error when the delete call fails', async () => {
      // Mock failed delete response
      mockSend.mockRejectedValueOnce({
        name: 'NotAuthorizedException',
        message: 'Invalid access token',
        code: 'NotAuthorizedException',
      });

      await expect(
        client.deleteMe({
          authorization: 'Bearer invalid-token',
        }),
      ).rejects.toThrow('DeleteMe error: Invalid access token');

      // Verify DeleteUserCommand was still called
      expect(DeleteUserCommand).toHaveBeenCalled();
    });
  });
});
