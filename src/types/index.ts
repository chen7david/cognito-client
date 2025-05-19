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
 * Authentication parameters for sign-in operations
 */
export type AuthParams = {
  username: string;
  password: string;
};

/**
 * Parameters for user registration
 */
export type RegisterUserParams = {
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
 * Response from user registration
 */
export type RegisterUserResponse = {
  userId: string;
  userSub: string;
  userConfirmed: boolean;
};

/**
 * Parameters for confirming user registration
 */
export type ConfirmRegistrationParams = {
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
export type ResetPasswordParams = {
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
 * Error info returned by the Cognito client
 */
export type CognitoErrorInfo = {
  code: string;
  name: string;
  message: string;
};
