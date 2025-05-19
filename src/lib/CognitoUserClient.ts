import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  RespondToAuthChallengeCommand,
  ChangePasswordCommand,
  AuthFlowType,
  ChallengeNameType,
} from '@aws-sdk/client-cognito-identity-provider';

import {
  CognitoConfig,
  AuthParams,
  AuthResponse,
  RegisterUserParams,
  RegisterUserResponse,
  ConfirmRegistrationParams,
  ForgotPasswordParams,
  ResetPasswordParams,
  RefreshTokenParams,
  ChangePasswordParams,
  CognitoErrorInfo,
} from '../types';

import { mapAuthResult, mapToAttributeList, formatError } from '../utils/cognitoMapper';

/**
 * Client for Cognito user operations that don't require admin privileges
 */
export class CognitoUserClient {
  private client: CognitoIdentityProviderClient;
  private config: CognitoConfig;

  /**
   * Creates a new instance of CognitoUserClient
   * @param config - Configuration containing region, user pool ID, and client ID
   */
  constructor(config: CognitoConfig) {
    this.config = config;
    this.client = new CognitoIdentityProviderClient({
      region: config.region,
    });
  }

  /**
   * Authenticates a user with username and password
   * @param params - Authentication parameters containing username and password
   * @returns Authentication result with tokens
   */
  async signIn(params: AuthParams): Promise<AuthResponse> {
    try {
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
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`SignIn error: ${formattedError.message}`);
    }
  }

  /**
   * Registers a new user in Cognito
   * @param params - Registration parameters
   * @returns Registration result
   */
  async registerUser(params: RegisterUserParams): Promise<RegisterUserResponse> {
    try {
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
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`RegisterUser error: ${formattedError.message}`);
    }
  }

  /**
   * Confirms a user registration with confirmation code
   * @param params - Confirmation parameters
   * @returns Success status
   */
  async confirmRegistration(params: ConfirmRegistrationParams): Promise<boolean> {
    try {
      const { username, confirmationCode } = params;

      await this.client.send(
        new ConfirmSignUpCommand({
          ClientId: this.config.clientId,
          Username: username,
          ConfirmationCode: confirmationCode,
        }),
      );

      return true;
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`ConfirmRegistration error: ${formattedError.message}`);
    }
  }

  /**
   * Initiates the forgot password flow
   * @param params - Parameters with username
   * @returns Success status
   */
  async forgotPassword(params: ForgotPasswordParams): Promise<boolean> {
    try {
      const { username } = params;

      await this.client.send(
        new ForgotPasswordCommand({
          ClientId: this.config.clientId,
          Username: username,
        }),
      );

      return true;
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`ForgotPassword error: ${formattedError.message}`);
    }
  }

  /**
   * Completes the password reset process
   * @param params - Reset parameters with confirmation code and new password
   * @returns Success status
   */
  async resetPassword(params: ResetPasswordParams): Promise<boolean> {
    try {
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
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`ResetPassword error: ${formattedError.message}`);
    }
  }

  /**
   * Refreshes the authentication tokens using a refresh token
   * @param params - Parameters with refresh token
   * @returns New authentication tokens
   */
  async refreshToken(params: RefreshTokenParams): Promise<AuthResponse> {
    try {
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
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`RefreshToken error: ${formattedError.message}`);
    }
  }

  /**
   * Changes the user's password
   * @param params - Change password parameters
   * @returns Success status
   */
  async changePassword(params: ChangePasswordParams): Promise<boolean> {
    try {
      const { accessToken, oldPassword, newPassword } = params;

      await this.client.send(
        new ChangePasswordCommand({
          AccessToken: accessToken,
          PreviousPassword: oldPassword,
          ProposedPassword: newPassword,
        }),
      );

      return true;
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`ChangePassword error: ${formattedError.message}`);
    }
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
    try {
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
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`RespondToNewPasswordChallenge error: ${formattedError.message}`);
    }
  }

  /**
   * Gets error information from an Error object
   * @param error - The error object
   * @returns Formatted error information
   */
  getErrorInfo(error: unknown): CognitoErrorInfo {
    return formatError(error);
  }
}
