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
  AuthFlowType,
  ChallengeNameType,
  MessageActionType,
  DeliveryMediumType,
  UserType,
  MFAOptionType,
  AdminDeleteUserAttributesCommand,
  AdminDisableProviderForUserCommand,
  AdminListUserAuthEventsCommand,
  AdminSetUserSettingsCommand,
  AdminUpdateAuthEventFeedbackCommand,
  AdminUpdateDeviceStatusCommand,
  FeedbackValueType,
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
  AdminConfirmSignUpParams,
  AdminAddUserToGroupParams,
  AdminRemoveUserFromGroupParams,
  ListGroupsParams,
  ListGroupsResponse,
  CreateGroupParams,
  DeleteGroupParams,
  GetGroupParams,
  UpdateGroupParams,
  ListUsersInGroupParams,
  ListUsersInGroupResponse,
  AdminListGroupsForUserParams,
  AdminListGroupsForUserResponse,
  AdminSetUserMFAPreferenceParams,
  AdminGetDeviceParams,
  AdminForgetDeviceParams,
  AdminListDevicesParams,
  AdminUserGlobalSignOutParams,
  AdminLinkProviderForUserParams,
  CognitoErrorInfo,
  CognitoClientOptions,
  GroupType,
  DeviceType,
  ListDevicesResponse,
  AdminDeleteUserAttributesParams,
  AdminDisableProviderForUserParams,
  AdminListUserAuthEventsParams,
  AdminListUserAuthEventsResponse,
  AdminSetUserSettingsParams,
  AdminUpdateAuthEventFeedbackParams,
  AdminUpdateDeviceStatusParams,
  AuthEventType,
} from '../types';

import {
  mapToAttributeList,
  mapAdminCreateUserResponse,
  mapAdminGetUserResponse,
  mapAuthResult,
  mapAttributes,
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

    if (!this.config.credentials) {
      throw new Error('Admin client requires credentials to be provided');
    }

    this.client =
      client ||
      new CognitoIdentityProviderClient({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.credentials.accessKeyId,
          secretAccessKey: this.config.credentials.secretAccessKey,
        },
      });
  }

  /**
   * Creates a new CognitoIdentityProviderClient
   * @param options - Client options containing region and credentials
   * @returns A new CognitoIdentityProviderClient instance
   */
  static createClient(options: CognitoClientOptions): CognitoIdentityProviderClient {
    if (!options.credentials) {
      throw new Error('Admin client requires credentials to be provided');
    }

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
  }

  /**
   * Gets user information as an admin
   * @param params - Parameters with username
   * @returns User information
   */
  async getUser(params: AdminGetUserParams): Promise<AdminGetUserResponse> {
    const { username } = params;

    const response = await this.client.send(
      new AdminGetUserCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
      }),
    );

    return mapAdminGetUserResponse(response);
  }

  /**
   * Updates user attributes as an admin
   * @param params - Parameters with username and attributes to update
   * @returns Success status
   */
  async updateUserAttributes(params: AdminUpdateUserAttributesParams): Promise<boolean> {
    const { username, attributes } = params;

    await this.client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        UserAttributes: mapToAttributeList(attributes),
      }),
    );

    return true;
  }

  /**
   * Disables a user as an admin
   * @param params - Parameters with username
   * @returns Success status
   */
  async disableUser(params: AdminDisableUserParams): Promise<boolean> {
    const { username } = params;

    await this.client.send(
      new AdminDisableUserCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
      }),
    );

    return true;
  }

  /**
   * Enables a user as an admin
   * @param params - Parameters with username
   * @returns Success status
   */
  async enableUser(params: AdminEnableUserParams): Promise<boolean> {
    const { username } = params;

    await this.client.send(
      new AdminEnableUserCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
      }),
    );

    return true;
  }

  /**
   * Deletes a user as an admin
   * @param params - Parameters with username
   * @returns Success status
   */
  async deleteUser(params: AdminDeleteUserParams): Promise<boolean> {
    const { username } = params;

    await this.client.send(
      new AdminDeleteUserCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
      }),
    );

    return true;
  }

  /**
   * Lists users in the user pool as an admin
   * @param params - List parameters with optional limit and pagination token
   * @returns List of users and pagination token
   */
  async listUsers(params: AdminListUsersParams = {}): Promise<AdminListUsersResponse> {
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
  }

  /**
   * Initiates authentication as an admin
   * @param params - Auth parameters with username and password
   * @returns Auth response which may include tokens or a challenge
   */
  async initiateAuth(params: AdminInitiateAuthParams): Promise<AdminInitiateAuthResponse> {
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
  }

  /**
   * Responds to an auth challenge as an admin
   * @param params - Challenge parameters
   * @returns Auth response which may include tokens or another challenge
   */
  async respondToAuthChallenge(
    params: AdminRespondToAuthChallengeParams,
  ): Promise<AdminRespondToAuthChallengeResponse> {
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
  }

  /**
   * Resets a user's password as an admin
   * @param params - Parameters with username
   * @returns Success status
   */
  async resetUserPassword(params: AdminResetUserPasswordParams): Promise<boolean> {
    const { username } = params;

    await this.client.send(
      new AdminResetUserPasswordCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
      }),
    );

    return true;
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
    await this.client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        Password: password,
        Permanent: permanent,
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
   * Confirms a user's registration as an admin
   * @param params - Parameters with username
   * @returns Success status
   */
  async adminConfirmSignUp(params: AdminConfirmSignUpParams): Promise<boolean> {
    const { username } = params;

    await this.client.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
      }),
    );

    return true;
  }

  /**
   * Adds a user to a group
   * @param params - Parameters with username and group name
   * @returns Success status
   */
  async adminAddUserToGroup(params: AdminAddUserToGroupParams): Promise<boolean> {
    const { username, groupName } = params;

    await this.client.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        GroupName: groupName,
      }),
    );

    return true;
  }

  /**
   * Removes a user from a group
   * @param params - Parameters with username and group name
   * @returns Success status
   */
  async adminRemoveUserFromGroup(params: AdminRemoveUserFromGroupParams): Promise<boolean> {
    const { username, groupName } = params;

    await this.client.send(
      new AdminRemoveUserFromGroupCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        GroupName: groupName,
      }),
    );

    return true;
  }

  /**
   * Lists groups in the user pool
   * @param params - Parameters with optional limit and pagination token
   * @returns List of groups and pagination token
   */
  async listGroups(params: ListGroupsParams = {}): Promise<ListGroupsResponse> {
    const { limit, nextToken } = params;

    const response = await this.client.send(
      new ListGroupsCommand({
        UserPoolId: this.config.userPoolId,
        Limit: limit,
        NextToken: nextToken,
      }),
    );

    const groups = (response.Groups || []).map((group) => ({
      groupName: group.GroupName || '',
      description: group.Description,
      userPoolId: group.UserPoolId || '',
      precedence: group.Precedence,
      roleArn: group.RoleArn,
      lastModifiedDate: group.LastModifiedDate ? new Date(group.LastModifiedDate) : undefined,
      creationDate: group.CreationDate ? new Date(group.CreationDate) : undefined,
    }));

    return {
      groups,
      nextToken: response.NextToken,
    };
  }

  /**
   * Creates a new group in the user pool
   * @param params - Parameters with group name and optional description, precedence, and role ARN
   * @returns The created group
   */
  async createGroup(params: CreateGroupParams): Promise<GroupType> {
    const { groupName, description, precedence, roleArn } = params;

    const response = await this.client.send(
      new CreateGroupCommand({
        UserPoolId: this.config.userPoolId,
        GroupName: groupName,
        Description: description,
        Precedence: precedence,
        RoleArn: roleArn,
      }),
    );

    if (!response.Group) {
      throw new Error('Failed to create group: No group information returned');
    }

    const group = response.Group;
    return {
      groupName: group.GroupName || '',
      description: group.Description,
      userPoolId: group.UserPoolId || '',
      precedence: group.Precedence,
      roleArn: group.RoleArn,
      lastModifiedDate: group.LastModifiedDate ? new Date(group.LastModifiedDate) : undefined,
      creationDate: group.CreationDate ? new Date(group.CreationDate) : undefined,
    };
  }

  /**
   * Gets information about a group
   * @param params - Parameters with group name
   * @returns Group information
   */
  async getGroup(params: GetGroupParams): Promise<GroupType> {
    const { groupName } = params;

    const response = await this.client.send(
      new GetGroupCommand({
        UserPoolId: this.config.userPoolId,
        GroupName: groupName,
      }),
    );

    if (!response.Group) {
      throw new Error('Failed to get group: No group information returned');
    }

    const group = response.Group;
    return {
      groupName: group.GroupName || '',
      description: group.Description,
      userPoolId: group.UserPoolId || '',
      precedence: group.Precedence,
      roleArn: group.RoleArn,
      lastModifiedDate: group.LastModifiedDate ? new Date(group.LastModifiedDate) : undefined,
      creationDate: group.CreationDate ? new Date(group.CreationDate) : undefined,
    };
  }

  /**
   * Updates a group in the user pool
   * @param params - Parameters with group name and optional description, precedence, and role ARN
   * @returns The updated group
   */
  async updateGroup(params: UpdateGroupParams): Promise<GroupType> {
    const { groupName, description, precedence, roleArn } = params;

    const response = await this.client.send(
      new UpdateGroupCommand({
        UserPoolId: this.config.userPoolId,
        GroupName: groupName,
        Description: description,
        Precedence: precedence,
        RoleArn: roleArn,
      }),
    );

    if (!response.Group) {
      throw new Error('Failed to update group: No group information returned');
    }

    const group = response.Group;
    return {
      groupName: group.GroupName || '',
      description: group.Description,
      userPoolId: group.UserPoolId || '',
      precedence: group.Precedence,
      roleArn: group.RoleArn,
      lastModifiedDate: group.LastModifiedDate ? new Date(group.LastModifiedDate) : undefined,
      creationDate: group.CreationDate ? new Date(group.CreationDate) : undefined,
    };
  }

  /**
   * Deletes a group from the user pool
   * @param params - Parameters with group name
   * @returns Success status
   */
  async deleteGroup(params: DeleteGroupParams): Promise<boolean> {
    const { groupName } = params;

    await this.client.send(
      new DeleteGroupCommand({
        UserPoolId: this.config.userPoolId,
        GroupName: groupName,
      }),
    );

    return true;
  }

  /**
   * Lists users in a specific group
   * @param params - Parameters with group name, optional limit and pagination token
   * @returns List of users and pagination token
   */
  async listUsersInGroup(params: ListUsersInGroupParams): Promise<ListUsersInGroupResponse> {
    const { groupName, limit, nextToken } = params;

    const response = await this.client.send(
      new ListUsersInGroupCommand({
        UserPoolId: this.config.userPoolId,
        GroupName: groupName,
        Limit: limit,
        NextToken: nextToken,
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
      nextToken: response.NextToken,
    };
  }

  /**
   * Lists the groups that a user belongs to
   * @param params - Parameters with username, optional limit and pagination token
   * @returns List of groups and pagination token
   */
  async adminListGroupsForUser(
    params: AdminListGroupsForUserParams,
  ): Promise<AdminListGroupsForUserResponse> {
    const { username, limit, nextToken } = params;

    const response = await this.client.send(
      new AdminListGroupsForUserCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        Limit: limit,
        NextToken: nextToken,
      }),
    );

    const groups = (response.Groups || []).map((group) => ({
      groupName: group.GroupName || '',
      description: group.Description,
      userPoolId: group.UserPoolId || '',
      precedence: group.Precedence,
      roleArn: group.RoleArn,
      lastModifiedDate: group.LastModifiedDate ? new Date(group.LastModifiedDate) : undefined,
      creationDate: group.CreationDate ? new Date(group.CreationDate) : undefined,
    }));

    return {
      groups,
      nextToken: response.NextToken,
    };
  }

  /**
   * Sets MFA preferences for a user
   * @param params - Parameters with username and MFA settings
   * @returns Success status
   */
  async adminSetUserMFAPreference(params: AdminSetUserMFAPreferenceParams): Promise<boolean> {
    const { username, smsMfaSettings, softwareTokenMfaSettings } = params;

    await this.client.send(
      new AdminSetUserMFAPreferenceCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
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
   * Links a user to a third-party identity provider
   * @param params - Parameters with username, provider name, attribute name, and attribute value
   * @returns Success status
   */
  async adminLinkProviderForUser(params: AdminLinkProviderForUserParams): Promise<boolean> {
    const { username, providerName, providerAttributeName, providerAttributeValue } = params;

    await this.client.send(
      new AdminLinkProviderForUserCommand({
        UserPoolId: this.config.userPoolId,
        DestinationUser: {
          ProviderName: 'Cognito',
          ProviderAttributeName: 'Username',
          ProviderAttributeValue: username,
        },
        SourceUser: {
          ProviderName: providerName,
          ProviderAttributeName: providerAttributeName,
          ProviderAttributeValue: providerAttributeValue,
        },
      }),
    );

    return true;
  }

  /**
   * Gets information about a user's device
   * @param params - Parameters with username and device key
   * @returns Device information
   */
  async adminGetDevice(params: AdminGetDeviceParams): Promise<DeviceType> {
    const { username, deviceKey } = params;

    const response = await this.client.send(
      new AdminGetDeviceCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
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
   * Forgets a user's device
   * @param params - Parameters with username and device key
   * @returns Success status
   */
  async adminForgetDevice(params: AdminForgetDeviceParams): Promise<boolean> {
    const { username, deviceKey } = params;

    await this.client.send(
      new AdminForgetDeviceCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        DeviceKey: deviceKey,
      }),
    );

    return true;
  }

  /**
   * Lists a user's devices
   * @param params - Parameters with username, optional limit and pagination token
   * @returns List of devices
   */
  async adminListDevices(params: AdminListDevicesParams): Promise<ListDevicesResponse> {
    const { username, limit, paginationToken } = params;

    const response = await this.client.send(
      new AdminListDevicesCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
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
   * Signs out a user from all devices
   * @param params - Parameters with username
   * @returns Success status
   */
  async adminUserGlobalSignOut(params: AdminUserGlobalSignOutParams): Promise<boolean> {
    const { username } = params;

    await this.client.send(
      new AdminUserGlobalSignOutCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
      }),
    );

    return true;
  }

  /**
   * Deletes user attributes as an admin
   * @param params - Parameters with username and attribute names to delete
   * @returns Success status
   */
  async adminDeleteUserAttributes(params: AdminDeleteUserAttributesParams): Promise<boolean> {
    const { username, attributeNames } = params;

    await this.client.send(
      new AdminDeleteUserAttributesCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        UserAttributeNames: attributeNames,
      }),
    );

    return true;
  }

  /**
   * Disables a provider for a user
   * @param params - Parameters with username and provider information
   * @returns Success status
   */
  async adminDisableProviderForUser(params: AdminDisableProviderForUserParams): Promise<boolean> {
    const { userProviderName, providerAttributeName, providerAttributeValue } = params;

    await this.client.send(
      new AdminDisableProviderForUserCommand({
        UserPoolId: this.config.userPoolId,
        User: {
          ProviderName: userProviderName,
          ProviderAttributeName: providerAttributeName,
          ProviderAttributeValue: providerAttributeValue,
        },
      }),
    );

    return true;
  }

  /**
   * Lists user auth events
   * @param params - Parameters with username and optional pagination
   * @returns List of auth events
   */
  async adminListUserAuthEvents(
    params: AdminListUserAuthEventsParams,
  ): Promise<AdminListUserAuthEventsResponse> {
    const { username, maxResults, nextToken } = params;

    const response = await this.client.send(
      new AdminListUserAuthEventsCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        MaxResults: maxResults,
        NextToken: nextToken,
      }),
    );

    const authEvents: AuthEventType[] = (response.AuthEvents || []).map((event) => ({
      eventId: event.EventId || '',
      eventType: event.EventType || '',
      creationDate: event.CreationDate ? new Date(event.CreationDate) : new Date(),
      eventResponse: event.EventResponse || '',
      eventRisk: event.EventRisk
        ? {
            riskDecision: event.EventRisk.RiskDecision || '',
            riskLevel: event.EventRisk.RiskLevel || '',
          }
        : undefined,
      challengeResponses: event.ChallengeResponses
        ? event.ChallengeResponses.map((cr) => ({
            challengeName: cr.ChallengeName || '',
            challengeResponse: cr.ChallengeResponse || '',
          }))
        : undefined,
      eventContextData: event.EventContextData
        ? {
            ipAddress: event.EventContextData.IpAddress || '',
            deviceName: event.EventContextData.DeviceName || '',
            timezone: event.EventContextData.Timezone || '',
            city: event.EventContextData.City || '',
            country: event.EventContextData.Country || '',
          }
        : undefined,
    }));

    return {
      authEvents,
      nextToken: response.NextToken,
    };
  }

  /**
   * Sets user settings as an admin
   * @param params - Parameters with username and MFA options
   * @returns Success status
   */
  async adminSetUserSettings(params: AdminSetUserSettingsParams): Promise<boolean> {
    const { username, mfaOptions } = params;

    await this.client.send(
      new AdminSetUserSettingsCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        MFAOptions: mfaOptions.map((option) => ({
          DeliveryMedium: option.deliveryMedium as DeliveryMediumType,
          AttributeName: option.attributeName,
        })),
      }),
    );

    return true;
  }

  /**
   * Updates auth event feedback as an admin
   * @param params - Parameters with username, event ID, and feedback value
   * @returns Success status
   */
  async adminUpdateAuthEventFeedback(params: AdminUpdateAuthEventFeedbackParams): Promise<boolean> {
    const { username, eventId, feedbackValue } = params;

    await this.client.send(
      new AdminUpdateAuthEventFeedbackCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        EventId: eventId,
        FeedbackValue: feedbackValue as FeedbackValueType,
      }),
    );

    return true;
  }

  /**
   * Updates device status as an admin
   * @param params - Parameters with username, device key, and device status
   * @returns Success status
   */
  async adminUpdateDeviceStatus(params: AdminUpdateDeviceStatusParams): Promise<boolean> {
    const { username, deviceKey, deviceRememberedStatus } = params;

    await this.client.send(
      new AdminUpdateDeviceStatusCommand({
        UserPoolId: this.config.userPoolId,
        Username: username,
        DeviceKey: deviceKey,
        DeviceRememberedStatus: deviceRememberedStatus,
      }),
    );

    return true;
  }
}
