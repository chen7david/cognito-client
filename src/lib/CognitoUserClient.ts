import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  RespondToAuthChallengeCommand,
  ChangePasswordCommand,
  GetUserCommand,
  UpdateUserAttributesCommand,
  VerifyUserAttributeCommand,
  GetUserAttributeVerificationCodeCommand,
  GlobalSignOutCommand,
  AuthFlowType,
  ChallengeNameType,
  GetDeviceCommand,
  ForgetDeviceCommand,
  ListDevicesCommand,
  AssociateSoftwareTokenCommand,
  VerifySoftwareTokenCommand,
  SetUserMFAPreferenceCommand,
  DeleteUserAttributesCommand,
  ConfirmDeviceCommand,
  DeleteUserCommand,
  ResendConfirmationCodeCommand,
  SetUserSettingsCommand,
  UpdateDeviceStatusCommand,
  DeliveryMediumType,
} from '@aws-sdk/client-cognito-identity-provider';

import {
  CognitoConfig,
  AuthParams,
  AuthResponse,
  SignUpParams,
  SignUpResponse,
  ConfirmSignUpParams,
  ForgotPasswordParams,
  ConfirmForgotPasswordParams,
  RefreshTokenParams,
  ChangePasswordParams,
  GetUserAttributesParams,
  GetUserAttributesResponse,
  UpdateUserAttributesParams,
  VerifyAttributeParams,
  GetMFAOptionsParams,
  MFAOption,
  AssociateSoftwareTokenParams,
  AssociateSoftwareTokenResponse,
  VerifySoftwareTokenParams,
  SetUserMFAPreferenceParams,
  GetDeviceParams,
  DeviceType,
  ForgetDeviceParams,
  ListDevicesParams,
  ListDevicesResponse,
  GlobalSignOutParams,
  CognitoErrorInfo,
  CognitoClientOptions,
  DeleteUserAttributesParams,
  ConfirmDeviceParams,
  DeleteUserParams,
  ResendConfirmationCodeParams,
  SetUserSettingsParams,
  UpdateDeviceStatusParams,
  GetMeParams,
  GetMeResponse,
  UpdateMeParams,
  DeleteMeParams,
} from '../types';

import { mapAuthResult, mapToAttributeList, mapAttributes } from '../utils/cognitoMapper';

import { extractAccessToken } from '../utils/tokenUtils';

/**
 * Client for Cognito user operations that don't require admin privileges
 */
export class CognitoUserClient {
  private client: CognitoIdentityProviderClient;
  private config: CognitoConfig;

  /**
   * Creates a new instance of CognitoUserClient
   * @param config - Configuration containing region, user pool ID, and client ID
   * @param client - Optional CognitoIdentityProviderClient instance. If not provided, a new client will be created
   */
  constructor(config: CognitoConfig, client?: CognitoIdentityProviderClient) {
    this.config = config;

    this.client =
      client ||
      new CognitoIdentityProviderClient({
        region: this.config.region,
      });
  }

  /**
   * Creates a new CognitoIdentityProviderClient
   * @param options - Client options containing region and optional credentials
   * @returns A new CognitoIdentityProviderClient instance
   */
  static createClient(options: CognitoClientOptions): CognitoIdentityProviderClient {
    return new CognitoIdentityProviderClient({
      region: options.region,
      credentials: options.credentials,
    });
  }

  /**
   * Authenticates a user with username and password
   * @param params - Authentication parameters containing username and password
   * @returns Authentication result with tokens
   */
  async signIn(params: AuthParams): Promise<AuthResponse> {
    const { username, password } = params;

    const response = await this.client.send(
      new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: this.config.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      }),
    );

    if (!response.AuthenticationResult) {
      throw new Error('Authentication failed: No authentication result returned');
    }

    return mapAuthResult(response.AuthenticationResult);
  }

  /**
   * Registers a new user in Cognito
   * @param params - Registration parameters
   * @returns Registration result
   */
  async signUp(params: SignUpParams): Promise<SignUpResponse> {
    const { username, password, email, phone, attributes = {} } = params;

    // Prepare user attributes
    const userAttributes = [
      { Name: 'email', Value: email },
      ...(phone ? [{ Name: 'phone_number', Value: phone }] : []),
      ...mapToAttributeList(attributes),
    ];

    const response = await this.client.send(
      new SignUpCommand({
        ClientId: this.config.clientId,
        Username: username,
        Password: password,
        UserAttributes: userAttributes,
      }),
    );

    return {
      userId: username,
      userSub: response.UserSub || '',
      userConfirmed: response.UserConfirmed || false,
    };
  }

  /**
   * Confirms a user registration with confirmation code
   * @param params - Confirmation parameters
   * @returns Success status
   */
  async confirmSignUp(params: ConfirmSignUpParams): Promise<boolean> {
    const { username, confirmationCode } = params;

    await this.client.send(
      new ConfirmSignUpCommand({
        ClientId: this.config.clientId,
        Username: username,
        ConfirmationCode: confirmationCode,
      }),
    );

    return true;
  }

  /**
   * Initiates the forgot password flow
   * @param params - Parameters with username
   * @returns Success status
   */
  async forgotPassword(params: ForgotPasswordParams): Promise<boolean> {
    const { username } = params;

    await this.client.send(
      new ForgotPasswordCommand({
        ClientId: this.config.clientId,
        Username: username,
      }),
    );

    return true;
  }

  /**
   * Completes the password reset process
   * @param params - Reset parameters with confirmation code and new password
   * @returns Success status
   */
  async confirmForgotPassword(params: ConfirmForgotPasswordParams): Promise<boolean> {
    const { username, confirmationCode, newPassword } = params;

    await this.client.send(
      new ConfirmForgotPasswordCommand({
        ClientId: this.config.clientId,
        Username: username,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
      }),
    );

    return true;
  }

  /**
   * Refreshes the authentication tokens using a refresh token
   * @param params - Parameters with refresh token
   * @returns New authentication tokens
   */
  async refreshToken(params: RefreshTokenParams): Promise<AuthResponse> {
    const { refreshToken } = params;

    const response = await this.client.send(
      new InitiateAuthCommand({
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        ClientId: this.config.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      }),
    );

    if (!response.AuthenticationResult) {
      throw new Error('Failed to refresh token: No authentication result returned');
    }

    // Preserve the original refresh token as AWS doesn't return a new one
    const authResult = mapAuthResult({
      ...response.AuthenticationResult,
      RefreshToken: refreshToken,
    });

    return authResult;
  }

  /**
   * Changes the user's password
   * @param params - Change password parameters
   * @returns Success status
   */
  async changePassword(params: ChangePasswordParams): Promise<boolean> {
    const { accessToken, oldPassword, newPassword } = params;

    await this.client.send(
      new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
      }),
    );

    return true;
  }

  /**
   * Gets the current user's attributes
   * @param params - Parameters with access token
   * @returns User attributes
   */
  async getUserAttributes(params: GetUserAttributesParams): Promise<GetUserAttributesResponse> {
    const { accessToken } = params;

    const response = await this.client.send(
      new GetUserCommand({
        AccessToken: accessToken,
      }),
    );

    if (!response.UserAttributes) {
      throw new Error('Failed to get user attributes: No attributes returned');
    }

    return {
      userAttributes: mapAttributes(response.UserAttributes),
    };
  }

  /**
   * Updates the current user's attributes
   * @param params - Parameters with access token and attributes to update
   * @returns Success status
   */
  async updateUserAttributes(params: UpdateUserAttributesParams): Promise<boolean> {
    const { accessToken, attributes } = params;

    await this.client.send(
      new UpdateUserAttributesCommand({
        AccessToken: accessToken,
        UserAttributes: mapToAttributeList(attributes),
      }),
    );

    return true;
  }

  /**
   * Sends a verification code to verify a user attribute
   * @param params - Parameters with access token and attribute name
   * @returns Success status
   */
  async getAttributeVerificationCode(accessToken: string, attributeName: string): Promise<boolean> {
    await this.client.send(
      new GetUserAttributeVerificationCodeCommand({
        AccessToken: accessToken,
        AttributeName: attributeName,
      }),
    );

    return true;
  }

  /**
   * Verifies a user attribute with a verification code
   * @param params - Parameters with access token, attribute name, and verification code
   * @returns Success status
   */
  async verifyUserAttribute(params: VerifyAttributeParams): Promise<boolean> {
    const { accessToken, attributeName, code } = params;

    await this.client.send(
      new VerifyUserAttributeCommand({
        AccessToken: accessToken,
        AttributeName: attributeName,
        Code: code,
      }),
    );

    return true;
  }

  /**
   * Gets MFA options for a user
   * @param params - Parameters with access token
   * @returns MFA options
   */
  async getMFAOptions(params: GetMFAOptionsParams): Promise<MFAOption[]> {
    const { accessToken } = params;

    const response = await this.client.send(
      new GetUserCommand({
        AccessToken: accessToken,
      }),
    );

    if (!response.MFAOptions) {
      return [];
    }

    return response.MFAOptions.map((option) => ({
      deliveryMedium: option.DeliveryMedium || '',
      attributeName: option.AttributeName || '',
    }));
  }

  /**
   * Associates a software token for MFA
   * @param params - Parameters with access token
   * @returns Software token secret code
   */
  async associateSoftwareToken(
    params: AssociateSoftwareTokenParams,
  ): Promise<AssociateSoftwareTokenResponse> {
    const { accessToken } = params;

    const response = await this.client.send(
      new AssociateSoftwareTokenCommand({
        AccessToken: accessToken,
      }),
    );

    if (!response.SecretCode) {
      throw new Error('Failed to associate software token: No secret code returned');
    }

    return {
      secretCode: response.SecretCode,
      session: response.Session,
    };
  }

  /**
   * Verifies a software token for MFA
   * @param params - Parameters with access token and user code
   * @returns Success status
   */
  async verifySoftwareToken(params: VerifySoftwareTokenParams): Promise<boolean> {
    const { accessToken, userCode, friendlyDeviceName, session } = params;

    await this.client.send(
      new VerifySoftwareTokenCommand({
        AccessToken: accessToken,
        UserCode: userCode,
        FriendlyDeviceName: friendlyDeviceName,
        Session: session,
      }),
    );

    return true;
  }

  /**
   * Sets MFA preferences for a user
   * @param params - Parameters with access token and MFA settings
   * @returns Success status
   */
  async setUserMFAPreference(params: SetUserMFAPreferenceParams): Promise<boolean> {
    const { accessToken, smsMfaSettings, softwareTokenMfaSettings } = params;

    await this.client.send(
      new SetUserMFAPreferenceCommand({
        AccessToken: accessToken,
        SMSMfaSettings: smsMfaSettings
          ? {
              Enabled: smsMfaSettings.enabled,
              PreferredMfa: smsMfaSettings.preferred,
            }
          : undefined,
        SoftwareTokenMfaSettings: softwareTokenMfaSettings
          ? {
              Enabled: softwareTokenMfaSettings.enabled,
              PreferredMfa: softwareTokenMfaSettings.preferred,
            }
          : undefined,
      }),
    );

    return true;
  }

  /**
   * Gets information about a device
   * @param params - Parameters with access token and device key
   * @returns Device information
   */
  async getDevice(params: GetDeviceParams): Promise<DeviceType> {
    const { accessToken, deviceKey } = params;

    const response = await this.client.send(
      new GetDeviceCommand({
        AccessToken: accessToken,
        DeviceKey: deviceKey,
      }),
    );

    if (!response.Device) {
      throw new Error('Failed to get device: No device information returned');
    }

    const device = response.Device;
    return {
      deviceKey: device.DeviceKey || '',
      deviceAttributes: mapAttributes(device.DeviceAttributes),
      deviceCreateDate: device.DeviceCreateDate ? new Date(device.DeviceCreateDate) : new Date(),
      deviceLastModifiedDate: device.DeviceLastModifiedDate
        ? new Date(device.DeviceLastModifiedDate)
        : new Date(),
      deviceLastAuthenticatedDate: device.DeviceLastAuthenticatedDate
        ? new Date(device.DeviceLastAuthenticatedDate)
        : undefined,
    };
  }

  /**
   * Forgets a device
   * @param params - Parameters with access token and device key
   * @returns Success status
   */
  async forgetDevice(params: ForgetDeviceParams): Promise<boolean> {
    const { accessToken, deviceKey } = params;

    await this.client.send(
      new ForgetDeviceCommand({
        AccessToken: accessToken,
        DeviceKey: deviceKey,
      }),
    );

    return true;
  }

  /**
   * Lists remembered devices
   * @param params - Parameters with access token, optional limit and pagination token
   * @returns List of devices
   */
  async listDevices(params: ListDevicesParams): Promise<ListDevicesResponse> {
    const { accessToken, limit, paginationToken } = params;

    const response = await this.client.send(
      new ListDevicesCommand({
        AccessToken: accessToken,
        Limit: limit,
        PaginationToken: paginationToken,
      }),
    );

    const devices = (response.Devices || []).map((device) => ({
      deviceKey: device.DeviceKey || '',
      deviceAttributes: mapAttributes(device.DeviceAttributes),
      deviceCreateDate: device.DeviceCreateDate ? new Date(device.DeviceCreateDate) : new Date(),
      deviceLastModifiedDate: device.DeviceLastModifiedDate
        ? new Date(device.DeviceLastModifiedDate)
        : new Date(),
      deviceLastAuthenticatedDate: device.DeviceLastAuthenticatedDate
        ? new Date(device.DeviceLastAuthenticatedDate)
        : undefined,
    }));

    return {
      devices,
      paginationToken: response.PaginationToken,
    };
  }

  /**
   * Signs out from all devices
   * @param params - Parameters with access token
   * @returns Success status
   */
  async globalSignOut(params: GlobalSignOutParams): Promise<boolean> {
    const { accessToken } = params;

    await this.client.send(
      new GlobalSignOutCommand({
        AccessToken: accessToken,
      }),
    );

    return true;
  }

  /**
   * Responds to a new password required challenge
   * @param challengeName - The name of the challenge
   * @param username - The username of the user
   * @param newPassword - The new password
   * @param session - The session from the challenge
   * @returns Authentication result with tokens
   */
  async respondToNewPasswordChallenge(
    challengeName: string,
    username: string,
    newPassword: string,
    session: string,
  ): Promise<AuthResponse> {
    const response = await this.client.send(
      new RespondToAuthChallengeCommand({
        ClientId: this.config.clientId,
        ChallengeName: challengeName as ChallengeNameType,
        Session: session,
        ChallengeResponses: {
          USERNAME: username,
          NEW_PASSWORD: newPassword,
        },
      }),
    );

    if (!response.AuthenticationResult) {
      throw new Error('Authentication challenge failed: No authentication result returned');
    }

    return mapAuthResult(response.AuthenticationResult);
  }

  /**
   * Deletes attributes from the current user
   * @param params - Parameters with access token and attribute names to delete
   * @returns Success status
   */
  async deleteUserAttributes(params: DeleteUserAttributesParams): Promise<boolean> {
    const { accessToken, attributeNames } = params;

    await this.client.send(
      new DeleteUserAttributesCommand({
        AccessToken: accessToken,
        UserAttributeNames: attributeNames,
      }),
    );

    return true;
  }

  /**
   * Confirms a device for the current user
   * @param params - Parameters with access token, device key, and optional device configuration
   * @returns Success status
   */
  async confirmDevice(params: ConfirmDeviceParams): Promise<boolean> {
    const { accessToken, deviceKey, deviceName, deviceSecretVerifierConfig } = params;

    await this.client.send(
      new ConfirmDeviceCommand({
        AccessToken: accessToken,
        DeviceKey: deviceKey,
        DeviceName: deviceName,
        DeviceSecretVerifierConfig: deviceSecretVerifierConfig
          ? {
              PasswordVerifier: deviceSecretVerifierConfig.passwordVerifier,
              Salt: deviceSecretVerifierConfig.salt,
            }
          : undefined,
      }),
    );

    return true;
  }

  /**
   * Deletes the current user
   * @param params - Parameters with access token
   * @returns Success status
   */
  async deleteUser(params: DeleteUserParams): Promise<boolean> {
    const { accessToken } = params;

    await this.client.send(
      new DeleteUserCommand({
        AccessToken: accessToken,
      }),
    );

    return true;
  }

  /**
   * Resends a confirmation code to confirm user registration
   * @param params - Parameters with username
   * @returns Success status
   */
  async resendConfirmationCode(params: ResendConfirmationCodeParams): Promise<boolean> {
    const { username, clientMetadata } = params;

    await this.client.send(
      new ResendConfirmationCodeCommand({
        ClientId: this.config.clientId,
        Username: username,
        ClientMetadata: clientMetadata,
      }),
    );

    return true;
  }

  /**
   * Sets user settings like MFA options
   * @param params - Parameters with access token and MFA options
   * @returns Success status
   */
  async setUserSettings(params: SetUserSettingsParams): Promise<boolean> {
    const { accessToken, mfaOptions } = params;

    await this.client.send(
      new SetUserSettingsCommand({
        AccessToken: accessToken,
        MFAOptions: mfaOptions.map((option) => ({
          DeliveryMedium: option.deliveryMedium as DeliveryMediumType,
          AttributeName: option.attributeName,
        })),
      }),
    );

    return true;
  }

  /**
   * Updates the status of a device
   * @param params - Parameters with access token, device key, and device status
   * @returns Success status
   */
  async updateDeviceStatus(params: UpdateDeviceStatusParams): Promise<boolean> {
    const { accessToken, deviceKey, deviceRememberedStatus } = params;

    await this.client.send(
      new UpdateDeviceStatusCommand({
        AccessToken: accessToken,
        DeviceKey: deviceKey,
        DeviceRememberedStatus: deviceRememberedStatus,
      }),
    );

    return true;
  }

  /**
   * Gets error information from an Error object
   * @param error - The error object
   * @returns The original error - no longer mapped
   */
  getErrorInfo(error: unknown): CognitoErrorInfo {
    if (error instanceof Error) {
      return {
        code: 'UnknownError',
        name: error.name,
        message: error.message,
      };
    }
    return {
      code: 'UnknownError',
      name: 'Error',
      message: String(error),
    };
  }

  /**
   * Gets the current authenticated user by providing an authorization header with a Bearer token
   * @param params - Parameters with authorization header containing the access token
   * @returns Current user info including username and user attributes
   */
  async getMe(params: GetMeParams): Promise<GetMeResponse> {
    const { authorization } = params;
    const accessToken = extractAccessToken(authorization);

    if (!accessToken) {
      throw new Error('No access token provided in authorization header');
    }

    const response = await this.client.send(
      new GetUserCommand({
        AccessToken: accessToken,
      }),
    );

    if (!response.Username || !response.UserAttributes) {
      throw new Error('Failed to get user: Invalid response from Cognito');
    }

    return {
      username: response.Username,
      attributes: mapAttributes(response.UserAttributes),
    };
  }

  /**
   * Updates the current authenticated user by providing an authorization header with a Bearer token
   * @param params - Parameters with authorization header containing the access token and attributes to update
   * @returns Success status
   */
  async updateMe(params: UpdateMeParams): Promise<boolean> {
    const { authorization, attributes } = params;
    const accessToken = extractAccessToken(authorization);

    if (!accessToken) {
      throw new Error('No access token provided in authorization header');
    }

    await this.client.send(
      new UpdateUserAttributesCommand({
        AccessToken: accessToken,
        UserAttributes: mapToAttributeList(attributes),
      }),
    );

    return true;
  }

  /**
   * Deletes the current authenticated user by providing an authorization header with a Bearer token
   * @param params - Parameters with authorization header containing the access token
   * @returns Success status
   */
  async deleteMe(params: DeleteMeParams): Promise<boolean> {
    const { authorization } = params;
    const accessToken = extractAccessToken(authorization);

    if (!accessToken) {
      throw new Error('No access token provided in authorization header');
    }

    await this.client.send(
      new DeleteUserCommand({
        AccessToken: accessToken,
      }),
    );

    return true;
  }
}
