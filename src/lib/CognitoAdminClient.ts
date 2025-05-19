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
  AuthFlowType,
  ChallengeNameType,
  MessageActionType,
  DeliveryMediumType,
  UserType,
  MFAOptionType,
} from '@aws-sdk/client-cognito-identity-provider';

import {
  CognitoAdminConfig,
  AdminCreateUserParams,
  AdminCreateUserResponse,
  AdminGetUserParams,
  AdminGetUserResponse,
  AdminUpdateUserAttributesParams,
  AdminDisableUserParams,
  AdminEnableUserParams,
  AdminDeleteUserParams,
  AdminListUsersParams,
  AdminListUsersResponse,
  AdminInitiateAuthParams,
  AdminInitiateAuthResponse,
  AdminRespondToAuthChallengeParams,
  AdminRespondToAuthChallengeResponse,
  AdminResetUserPasswordParams,
  CognitoErrorInfo,
  CognitoClientOptions,
} from '../types';

import {
  mapToAttributeList,
  mapAdminCreateUserResponse,
  mapAdminGetUserResponse,
  mapAuthResult,
  formatError,
} from '../utils/cognitoMapper';

/**
 * Client for Cognito admin operations that require AWS credentials
 */
export class CognitoAdminClient {
  private client: CognitoIdentityProviderClient;
  private config: CognitoAdminConfig;

  /**
   * Creates a new instance of CognitoAdminClient
   * @param config - Configuration including AWS credentials
   * @param client - Optional CognitoIdentityProviderClient instance. If not provided, a new client will be created
   */
  constructor(config: CognitoAdminConfig, client?: CognitoIdentityProviderClient) {
    this.config = config;
    this.client =
      client ||
      new CognitoIdentityProviderClient({
        region: config.region,
        credentials: {
          accessKeyId: config.credentials.accessKeyId,
          secretAccessKey: config.credentials.secretAccessKey,
        },
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
   * Creates a new user as an admin
   * @param params - Parameters for creating a user
   * @returns Information about the created user
   */
  async createUser(params: AdminCreateUserParams): Promise<AdminCreateUserResponse> {
    try {
      const {
        username,
        email,
        password,
        phone,
        temporaryPassword,
        messageAction,
        attributes = {},
      } = params;

      // Prepare user attributes
      const userAttributes = [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        ...(phone ? [{ Name: 'phone_number', Value: phone }] : []),
        ...mapToAttributeList(attributes),
      ];

      const command = new AdminCreateUserCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        TemporaryPassword: temporaryPassword,
        UserAttributes: userAttributes,
        MessageAction: messageAction as MessageActionType,
      });

      const response = await this.client.send(command);
      const result = mapAdminCreateUserResponse(response);

      // If password is provided, set the permanent password
      if (password) {
        await this.client.send(
          new AdminSetUserPasswordCommand({
            UserPoolId: this.config.userPoolId,
            Username: username,
            Password: password,
            Permanent: true,
          }),
        );
      }

      return result;
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`CreateUser error: ${formattedError.message}`);
    }
  }

  /**
   * Gets user information as an admin
   * @param params - Parameters with username
   * @returns User information
   */
  async getUser(params: AdminGetUserParams): Promise<AdminGetUserResponse> {
    try {
      const { username } = params;

      const response = await this.client.send(
        new AdminGetUserCommand({
          UserPoolId: this.config.userPoolId,
          Username: username,
        }),
      );

      return mapAdminGetUserResponse(response);
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`GetUser error: ${formattedError.message}`);
    }
  }

  /**
   * Updates user attributes as an admin
   * @param params - Parameters with username and attributes to update
   * @returns Success status
   */
  async updateUserAttributes(params: AdminUpdateUserAttributesParams): Promise<boolean> {
    try {
      const { username, attributes } = params;

      await this.client.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: this.config.userPoolId,
          Username: username,
          UserAttributes: mapToAttributeList(attributes),
        }),
      );

      return true;
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`UpdateUserAttributes error: ${formattedError.message}`);
    }
  }

  /**
   * Disables a user as an admin
   * @param params - Parameters with username
   * @returns Success status
   */
  async disableUser(params: AdminDisableUserParams): Promise<boolean> {
    try {
      const { username } = params;

      await this.client.send(
        new AdminDisableUserCommand({
          UserPoolId: this.config.userPoolId,
          Username: username,
        }),
      );

      return true;
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`DisableUser error: ${formattedError.message}`);
    }
  }

  /**
   * Enables a user as an admin
   * @param params - Parameters with username
   * @returns Success status
   */
  async enableUser(params: AdminEnableUserParams): Promise<boolean> {
    try {
      const { username } = params;

      await this.client.send(
        new AdminEnableUserCommand({
          UserPoolId: this.config.userPoolId,
          Username: username,
        }),
      );

      return true;
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`EnableUser error: ${formattedError.message}`);
    }
  }

  /**
   * Deletes a user as an admin
   * @param params - Parameters with username
   * @returns Success status
   */
  async deleteUser(params: AdminDeleteUserParams): Promise<boolean> {
    try {
      const { username } = params;

      await this.client.send(
        new AdminDeleteUserCommand({
          UserPoolId: this.config.userPoolId,
          Username: username,
        }),
      );

      return true;
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`DeleteUser error: ${formattedError.message}`);
    }
  }

  /**
   * Lists users in the user pool as an admin
   * @param params - List parameters with optional limit and pagination token
   * @returns List of users and pagination token
   */
  async listUsers(params: AdminListUsersParams = {}): Promise<AdminListUsersResponse> {
    try {
      const { limit, paginationToken, filter } = params;

      const response = await this.client.send(
        new ListUsersCommand({
          UserPoolId: this.config.userPoolId,
          Limit: limit,
          PaginationToken: paginationToken,
          Filter: filter,
        }),
      );

      const users = (response.Users || []).map((user: UserType) => {
        return mapAdminGetUserResponse({
          Username: user.Username,
          UserAttributes: user.Attributes,
          UserCreateDate: user.UserCreateDate,
          UserLastModifiedDate: user.UserLastModifiedDate,
          Enabled: user.Enabled,
          UserStatus: user.UserStatus,
          MFAOptions: user.MFAOptions?.map((opt: MFAOptionType) => ({
            DeliveryMedium: opt.DeliveryMedium as DeliveryMediumType,
            AttributeName: opt.AttributeName,
          })),
        });
      });

      return {
        users,
        paginationToken: response.PaginationToken,
      };
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`ListUsers error: ${formattedError.message}`);
    }
  }

  /**
   * Initiates authentication as an admin
   * @param params - Auth parameters with username and password
   * @returns Auth response which may include tokens or a challenge
   */
  async initiateAuth(params: AdminInitiateAuthParams): Promise<AdminInitiateAuthResponse> {
    try {
      const { username, password, clientMetadata } = params;

      const response = await this.client.send(
        new AdminInitiateAuthCommand({
          UserPoolId: this.config.userPoolId,
          ClientId: this.config.clientId,
          AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
          AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
          },
          ClientMetadata: clientMetadata,
        }),
      );

      const result: AdminInitiateAuthResponse = {
        challengeName: response.ChallengeName,
        session: response.Session,
        challengeParameters: response.ChallengeParameters,
      };

      if (response.AuthenticationResult) {
        result.authenticationResult = mapAuthResult(response.AuthenticationResult);
      }

      return result;
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`InitiateAuth error: ${formattedError.message}`);
    }
  }

  /**
   * Responds to an auth challenge as an admin
   * @param params - Challenge parameters
   * @returns Auth response which may include tokens or another challenge
   */
  async respondToAuthChallenge(
    params: AdminRespondToAuthChallengeParams,
  ): Promise<AdminRespondToAuthChallengeResponse> {
    try {
      const { challengeName, challengeResponses, session, clientMetadata } = params;

      const response = await this.client.send(
        new AdminRespondToAuthChallengeCommand({
          UserPoolId: this.config.userPoolId,
          ClientId: this.config.clientId,
          ChallengeName: challengeName as ChallengeNameType,
          ChallengeResponses: challengeResponses,
          Session: session,
          ClientMetadata: clientMetadata,
        }),
      );

      const result: AdminRespondToAuthChallengeResponse = {
        challengeName: response.ChallengeName,
        session: response.Session,
        challengeParameters: response.ChallengeParameters,
      };

      if (response.AuthenticationResult) {
        result.authenticationResult = mapAuthResult(response.AuthenticationResult);
      }

      return result;
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`RespondToAuthChallenge error: ${formattedError.message}`);
    }
  }

  /**
   * Resets a user's password as an admin
   * @param params - Parameters with username
   * @returns Success status
   */
  async resetUserPassword(params: AdminResetUserPasswordParams): Promise<boolean> {
    try {
      const { username } = params;

      await this.client.send(
        new AdminResetUserPasswordCommand({
          UserPoolId: this.config.userPoolId,
          Username: username,
        }),
      );

      return true;
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`ResetUserPassword error: ${formattedError.message}`);
    }
  }

  /**
   * Sets a user's password as an admin
   * @param username - The username
   * @param password - The new password
   * @param permanent - Whether this is a permanent password
   * @returns Success status
   */
  async setUserPassword(
    username: string,
    password: string,
    permanent: boolean = true,
  ): Promise<boolean> {
    try {
      await this.client.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: this.config.userPoolId,
          Username: username,
          Password: password,
          Permanent: permanent,
        }),
      );

      return true;
    } catch (error) {
      const formattedError = formatError(error);
      throw new Error(`SetUserPassword error: ${formattedError.message}`);
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
