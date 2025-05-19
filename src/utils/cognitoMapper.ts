import {
  AuthenticationResultType,
  AdminCreateUserResponse,
  AdminGetUserResponse,
  AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  AuthResponse,
  AdminCreateUserResponse as CustomAdminCreateUserResponse,
  AdminGetUserResponse as CustomAdminGetUserResponse,
} from '../types';

/**
 * Maps a Cognito AuthenticationResultType to our simplified AuthResponse
 * @param result - The Cognito authentication result
 * @returns A simplified AuthResponse
 */
export const mapAuthResult = (result: AuthenticationResultType): AuthResponse => {
  if (!result.AccessToken || !result.IdToken || !result.RefreshToken || !result.ExpiresIn) {
    throw new Error('Invalid authentication result from Cognito');
  }

  return {
    accessToken: result.AccessToken,
    idToken: result.IdToken,
    refreshToken: result.RefreshToken,
    expiresIn: result.ExpiresIn,
    tokenType: result.TokenType || 'Bearer',
  };
};

/**
 * Maps a list of Cognito AttributeType to a simple object
 * @param attributes - The array of Cognito attributes
 * @returns An object with attribute names as keys and their values
 */
export const mapAttributes = (attributes: AttributeType[] = []): Record<string, string> => {
  return attributes.reduce(
    (result, attr) => {
      if (attr.Name && attr.Value) {
        // Convert from format like 'custom:role' to 'customRole'
        let name = attr.Name;
        if (name.startsWith('custom:')) {
          const suffix = name.slice(7); // Remove 'custom:' prefix
          // Convert first character to uppercase
          const firstChar = suffix.charAt(0).toUpperCase();
          const rest = suffix.slice(1);
          name = `custom${firstChar}${rest}`;
        }

        // Convert from kebab-case or snake_case to camelCase
        const camelCaseName = name.replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase());
        result[camelCaseName] = attr.Value;
      }
      return result;
    },
    {} as Record<string, string>,
  );
};

/**
 * Maps a simple object to a list of Cognito AttributeType
 * @param attributes - The object with attribute names and values
 * @returns An array of Cognito AttributeType
 */
export const mapToAttributeList = (attributes: Record<string, string> = {}): AttributeType[] => {
  return Object.entries(attributes).map(([key, value]) => {
    // Convert from camelCase to format like 'custom:role' if it starts with 'custom'
    let name = key;
    if (key.startsWith('custom') && key !== 'custom' && key.length > 6) {
      const restOfKey = key.slice(6); // Remove 'custom' prefix
      // Convert first character to lowercase
      const firstChar = restOfKey.charAt(0).toLowerCase();
      const rest = restOfKey.slice(1);
      name = `custom:${firstChar}${rest}`;
    }

    return {
      Name: name,
      Value: value,
    };
  });
};

/**
 * Maps a Cognito AdminCreateUserResponse to our simplified format
 * @param result - The Cognito AdminCreateUserResponse
 * @returns A simplified AdminCreateUserResponse
 */
export const mapAdminCreateUserResponse = (
  result: AdminCreateUserResponse,
): CustomAdminCreateUserResponse => {
  if (!result.User) {
    throw new Error('Invalid AdminCreateUser response from Cognito');
  }

  const { User } = result;
  const attributes = mapAttributes(User.Attributes);

  return {
    userId: User.Username || '',
    userSub: attributes.sub || '',
    userCreateDate: User.UserCreateDate ? new Date(User.UserCreateDate) : new Date(),
    userLastModifiedDate: User.UserLastModifiedDate
      ? new Date(User.UserLastModifiedDate)
      : new Date(),
    enabled: User.Enabled || false,
    userStatus: User.UserStatus || '',
    temporaryPassword: attributes.password || undefined,
  };
};

/**
 * Maps a Cognito AdminGetUserResponse to our simplified format
 * @param result - The Cognito AdminGetUserResponse
 * @returns A simplified AdminGetUserResponse
 */
export const mapAdminGetUserResponse = (
  result: AdminGetUserResponse,
): CustomAdminGetUserResponse => {
  if (!result.Username) {
    throw new Error('Invalid AdminGetUser response from Cognito');
  }

  const attributes = mapAttributes(result.UserAttributes);
  const mfaOptions = result.MFAOptions?.map((opt) => ({
    deliveryMedium: opt.DeliveryMedium || '',
    attributeName: opt.AttributeName || '',
  }));

  return {
    username: result.Username,
    userCreateDate: result.UserCreateDate ? new Date(result.UserCreateDate) : new Date(),
    userLastModifiedDate: result.UserLastModifiedDate
      ? new Date(result.UserLastModifiedDate)
      : new Date(),
    enabled: result.Enabled || false,
    userStatus: result.UserStatus || '',
    userAttributes: attributes,
    mfaOptions,
    preferredMfaSetting: result.PreferredMfaSetting,
    userMfaSettingList: result.UserMFASettingList,
  };
};

/**
 * Formats error information from Cognito API errors
 * @param error - The error thrown by the AWS SDK
 * @returns An object with error details
 */
export const formatError = (error: unknown): { code: string; name: string; message: string } => {
  if (error instanceof Error) {
    const anyError = error as unknown as { code: string; name: string; message: string };
    return {
      code: anyError.code || 'UnknownError',
      name: error.name,
      message: error.message,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const obj = error as unknown as { code: string; name: string; message: string };
    return {
      code: obj.code || 'UnknownError',
      name: obj.name || 'UnknownError',
      message: obj.message || JSON.stringify(obj),
    };
  }

  return {
    code: 'UnknownError',
    name: 'UnknownError',
    message: String(error),
  };
};
