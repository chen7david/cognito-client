/**
 * Basic configuration for all Cognito clients
 */
export type CognitoConfig = {
  region: string;
  userPoolId: string;
  clientId: string;
};

/**
 * AWS credentials for admin operations
 */
export type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
};

/**
 * Cognito admin client configuration
 */
export type CognitoAdminConfig = CognitoConfig & {
  credentials: AwsCredentials;
};

/**
 * Options for creating a CognitoIdentityProviderClient
 */
export type CognitoClientOptions = {
  region: string;
  credentials?: AwsCredentials;
};

/**
 * Authentication parameters for sign-in operations
 */
export type AuthParams = {
  username: string;
  password: string;
};

/**
 * Parameters for user sign-up
 */
export type SignUpParams = {
  username: string;
  password: string;
  email: string;
  phone?: string;
  attributes?: Record<string, string>;
};

/**
 * Response from authentication operations
 */
export type AuthResponse = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
};

/**
 * Response from user sign-up
 */
export type SignUpResponse = {
  userId: string;
  userSub: string;
  userConfirmed: boolean;
};

/**
 * Parameters for confirming user registration
 */
export type ConfirmSignUpParams = {
  username: string;
  confirmationCode: string;
};

/**
 * Parameters for requesting a password reset
 */
export type ForgotPasswordParams = {
  username: string;
};

/**
 * Parameters for completing a password reset
 */
export type ConfirmForgotPasswordParams = {
  username: string;
  confirmationCode: string;
  newPassword: string;
};

/**
 * Parameters for refreshing tokens
 */
export type RefreshTokenParams = {
  refreshToken: string;
};

/**
 * Parameters for changing a user's password
 */
export type ChangePasswordParams = {
  accessToken: string;
  oldPassword: string;
  newPassword: string;
};

/**
 * Parameters for getting user attributes
 */
export type GetUserAttributesParams = {
  accessToken: string;
};

/**
 * Response for getting user attributes
 */
export type GetUserAttributesResponse = {
  userAttributes: Record<string, string>;
};

/**
 * Parameters for updating user attributes
 */
export type UpdateUserAttributesParams = {
  accessToken: string;
  attributes: Record<string, string>;
};

/**
 * Parameters for verifying a user attribute
 */
export type VerifyAttributeParams = {
  accessToken: string;
  attributeName: string;
  code: string;
};

/**
 * Parameters for getting MFA options
 */
export type GetMFAOptionsParams = {
  accessToken: string;
};

/**
 * Response for getting MFA options
 */
export type MFAOption = {
  deliveryMedium: string;
  attributeName: string;
};

/**
 * Parameters for associating a software token for MFA
 */
export type AssociateSoftwareTokenParams = {
  accessToken: string;
};

/**
 * Response for associating a software token
 */
export type AssociateSoftwareTokenResponse = {
  secretCode: string;
  session?: string;
};

/**
 * Parameters for verifying a software token
 */
export type VerifySoftwareTokenParams = {
  accessToken: string;
  userCode: string;
  friendlyDeviceName?: string;
  session?: string;
};

/**
 * Parameters for setting MFA preferences
 */
export type SetUserMFAPreferenceParams = {
  accessToken: string;
  smsMfaSettings?: {
    enabled: boolean;
    preferred: boolean;
  };
  softwareTokenMfaSettings?: {
    enabled: boolean;
    preferred: boolean;
  };
};

/**
 * Parameters for getting a device
 */
export type GetDeviceParams = {
  accessToken: string;
  deviceKey: string;
};

/**
 * Device information
 */
export type DeviceType = {
  deviceKey: string;
  deviceAttributes: Record<string, string>;
  deviceCreateDate: Date;
  deviceLastModifiedDate: Date;
  deviceLastAuthenticatedDate?: Date;
};

/**
 * Parameters for forgetting a device
 */
export type ForgetDeviceParams = {
  accessToken: string;
  deviceKey: string;
};

/**
 * Parameters for listing devices
 */
export type ListDevicesParams = {
  accessToken: string;
  limit?: number;
  paginationToken?: string;
};

/**
 * Response for listing devices
 */
export type ListDevicesResponse = {
  devices: DeviceType[];
  paginationToken?: string;
};

/**
 * Parameters for global sign out
 */
export type GlobalSignOutParams = {
  accessToken: string;
};

/**
 * Parameters for admin creating a user
 */
export type AdminCreateUserParams = {
  username: string;
  password?: string;
  email: string;
  phone?: string;
  temporaryPassword?: string;
  messageAction?: 'RESEND' | 'SUPPRESS';
  attributes?: Record<string, string>;
};

/**
 * Response from admin creating a user
 */
export type AdminCreateUserResponse = {
  userId: string;
  userSub: string;
  userCreateDate: Date;
  userLastModifiedDate: Date;
  enabled: boolean;
  userStatus: string;
  temporaryPassword?: string;
};

/**
 * Parameters for admin confirming sign up
 */
export type AdminConfirmSignUpParams = {
  username: string;
};

/**
 * Parameters for admin resetting a user's password
 */
export type AdminResetUserPasswordParams = {
  username: string;
};

/**
 * Parameters for admin getting a user
 */
export type AdminGetUserParams = {
  username: string;
};

/**
 * User attribute from Cognito
 */
export type UserAttribute = {
  name: string;
  value: string;
};

/**
 * Response from admin getting a user
 */
export type AdminGetUserResponse = {
  username: string;
  userCreateDate: Date;
  userLastModifiedDate: Date;
  enabled: boolean;
  userStatus: string;
  userAttributes: Record<string, string>;
  mfaOptions?: Array<{
    deliveryMedium: string;
    attributeName: string;
  }>;
  preferredMfaSetting?: string;
  userMfaSettingList?: string[];
};

/**
 * Parameters for admin updating user attributes
 */
export type AdminUpdateUserAttributesParams = {
  username: string;
  attributes: Record<string, string>;
};

/**
 * Parameters for admin disabling a user
 */
export type AdminDisableUserParams = {
  username: string;
};

/**
 * Parameters for admin enabling a user
 */
export type AdminEnableUserParams = {
  username: string;
};

/**
 * Parameters for admin deleting a user
 */
export type AdminDeleteUserParams = {
  username: string;
};

/**
 * Parameters for admin listing users
 */
export type AdminListUsersParams = {
  limit?: number;
  paginationToken?: string;
  filter?: string;
};

/**
 * Response from admin listing users
 */
export type AdminListUsersResponse = {
  users: AdminGetUserResponse[];
  paginationToken?: string;
};

/**
 * Parameters for admin initiating auth
 */
export type AdminInitiateAuthParams = {
  username: string;
  password: string;
  clientMetadata?: Record<string, string>;
};

/**
 * Response from admin initiating auth
 */
export type AdminInitiateAuthResponse = {
  challengeName?: string;
  session?: string;
  challengeParameters?: Record<string, string>;
  authenticationResult?: AuthResponse;
};

/**
 * Parameters for admin responding to an auth challenge
 */
export type AdminRespondToAuthChallengeParams = {
  challengeName: string;
  challengeResponses: Record<string, string>;
  session?: string;
  clientMetadata?: Record<string, string>;
};

/**
 * Response from admin responding to an auth challenge
 */
export type AdminRespondToAuthChallengeResponse = {
  challengeName?: string;
  session?: string;
  challengeParameters?: Record<string, string>;
  authenticationResult?: AuthResponse;
};

/**
 * Parameters for adding user to group
 */
export type AdminAddUserToGroupParams = {
  username: string;
  groupName: string;
};

/**
 * Parameters for removing user from group
 */
export type AdminRemoveUserFromGroupParams = {
  username: string;
  groupName: string;
};

/**
 * Parameters for listing groups
 */
export type ListGroupsParams = {
  limit?: number;
  nextToken?: string;
};

/**
 * Group information
 */
export type GroupType = {
  groupName: string;
  description?: string;
  userPoolId: string;
  precedence?: number;
  roleArn?: string;
  lastModifiedDate?: Date;
  creationDate?: Date;
};

/**
 * Response for listing groups
 */
export type ListGroupsResponse = {
  groups: GroupType[];
  nextToken?: string;
};

/**
 * Parameters for creating a group
 */
export type CreateGroupParams = {
  groupName: string;
  description?: string;
  precedence?: number;
  roleArn?: string;
};

/**
 * Parameters for getting a group
 */
export type GetGroupParams = {
  groupName: string;
};

/**
 * Parameters for updating a group
 */
export type UpdateGroupParams = {
  groupName: string;
  description?: string;
  precedence?: number;
  roleArn?: string;
};

/**
 * Parameters for deleting a group
 */
export type DeleteGroupParams = {
  groupName: string;
};

/**
 * Parameters for listing users in a group
 */
export type ListUsersInGroupParams = {
  groupName: string;
  limit?: number;
  nextToken?: string;
};

/**
 * Response for listing users in a group
 */
export type ListUsersInGroupResponse = {
  users: AdminGetUserResponse[];
  nextToken?: string;
};

/**
 * Parameters for listing groups for a user
 */
export type AdminListGroupsForUserParams = {
  username: string;
  limit?: number;
  nextToken?: string;
};

/**
 * Response for listing groups for a user
 */
export type AdminListGroupsForUserResponse = {
  groups: GroupType[];
  nextToken?: string;
};

/**
 * Parameters for setting MFA preferences
 */
export type AdminSetUserMFAPreferenceParams = {
  username: string;
  smsMfaSettings?: {
    enabled: boolean;
    preferred: boolean;
  };
  softwareTokenMfaSettings?: {
    enabled: boolean;
    preferred: boolean;
  };
};

/**
 * Parameters for admin getting a device
 */
export type AdminGetDeviceParams = {
  username: string;
  deviceKey: string;
};

/**
 * Parameters for admin forgetting a device
 */
export type AdminForgetDeviceParams = {
  username: string;
  deviceKey: string;
};

/**
 * Parameters for admin listing devices
 */
export type AdminListDevicesParams = {
  username: string;
  limit?: number;
  paginationToken?: string;
};

/**
 * Parameters for admin user global sign out
 */
export type AdminUserGlobalSignOutParams = {
  username: string;
};

/**
 * Parameters for linking provider for user
 */
export type AdminLinkProviderForUserParams = {
  username: string;
  providerName: string;
  providerAttributeName: string;
  providerAttributeValue: string;
};

/**
 * Error info returned by the Cognito client
 */
export type CognitoErrorInfo = {
  code: string;
  name: string;
  message: string;
};

/**
 * Parameters for deleting user attributes
 */
export type DeleteUserAttributesParams = {
  accessToken: string;
  attributeNames: string[];
};

/**
 * Parameters for confirming a device
 */
export type ConfirmDeviceParams = {
  accessToken: string;
  deviceKey: string;
  deviceName?: string;
  deviceSecretVerifierConfig?: {
    passwordVerifier: string;
    salt: string;
  };
};

/**
 * Parameters for deleting a user
 */
export type DeleteUserParams = {
  accessToken: string;
};

/**
 * Parameters for resending a confirmation code
 */
export type ResendConfirmationCodeParams = {
  username: string;
  clientMetadata?: Record<string, string>;
};

/**
 * Parameters for setting user settings
 */
export type SetUserSettingsParams = {
  accessToken: string;
  mfaOptions: Array<{
    deliveryMedium: string;
    attributeName: string;
  }>;
};

/**
 * Parameters for updating device status
 */
export type UpdateDeviceStatusParams = {
  accessToken: string;
  deviceKey: string;
  deviceRememberedStatus: 'remembered' | 'not_remembered';
};

/**
 * Parameters for admin delete user attributes
 */
export type AdminDeleteUserAttributesParams = {
  username: string;
  attributeNames: string[];
};

/**
 * Parameters for admin disable provider for user
 */
export type AdminDisableProviderForUserParams = {
  username: string;
  userProviderName: string;
  providerAttributeName: string;
  providerAttributeValue: string;
};

/**
 * Parameters for admin list user auth events
 */
export type AdminListUserAuthEventsParams = {
  username: string;
  maxResults?: number;
  nextToken?: string;
};

/**
 * Auth event type
 */
export type AuthEventType = {
  eventId: string;
  eventType: string;
  creationDate: Date;
  eventResponse: string;
  eventRisk?: {
    riskDecision: string;
    riskLevel: string;
  };
  challengeResponses?: Array<{
    challengeName: string;
    challengeResponse: string;
  }>;
  eventContextData?: {
    ipAddress: string;
    deviceName: string;
    timezone: string;
    city: string;
    country: string;
  };
};

/**
 * Response for admin list user auth events
 */
export type AdminListUserAuthEventsResponse = {
  authEvents: AuthEventType[];
  nextToken?: string;
};

/**
 * Parameters for admin set user settings
 */
export type AdminSetUserSettingsParams = {
  username: string;
  mfaOptions: Array<{
    deliveryMedium: string;
    attributeName: string;
  }>;
};

/**
 * Parameters for admin update auth event feedback
 */
export type AdminUpdateAuthEventFeedbackParams = {
  username: string;
  eventId: string;
  feedbackValue: string;
};

/**
 * Parameters for admin update device status
 */
export type AdminUpdateDeviceStatusParams = {
  username: string;
  deviceKey: string;
  deviceRememberedStatus: 'remembered' | 'not_remembered';
};
