import { CognitoUserClient, CognitoAdminClient } from '../src';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

// Configuration values - replace with your own values
const REGION = 'us-east-1';
const USER_POOL_ID = 'us-east-1_abcdefghi';
const CLIENT_ID = '1a2b3c4d5e6f7g8h9i0j';
const ACCESS_KEY = 'AKIA...';
const SECRET_KEY = 'abc123...';

/**
 * Example of CognitoUserClient usage
 */
async function userClientExample(): Promise<void> {
  console.log('=== User Client Example ===');

  try {
    // Create a shared CognitoIdentityProviderClient
    const cognitoProvider = new CognitoIdentityProviderClient({
      region: REGION,
    });

    // Create the user client with the provider
    const userClient = new CognitoUserClient(
      {
        region: REGION,
        userPoolId: USER_POOL_ID,
        clientId: CLIENT_ID,
      },
      cognitoProvider,
    );

    // 1. Register a new user
    console.log('1. Registering a new user...');
    const signUpResult = await userClient.signUp({
      username: 'testuser',
      password: 'Password123!',
      email: 'test@example.com',
      attributes: {
        name: 'Test User',
        customAttribute: 'custom value',
      },
    });
    console.log('User registration result:', signUpResult);

    // 2. Confirm user registration (normally this would be done via email code)
    console.log('2. Confirming user registration...');
    // In a real app, you would get this code from the user's email
    const confirmationCode = '123456';
    try {
      const confirmResult = await userClient.confirmSignUp({
        username: 'testuser',
        confirmationCode,
      });
      console.log('User confirmation result:', confirmResult);
    } catch (error) {
      console.log('User confirmation may require actual code from email');
      // In a real application, you would handle this properly
    }

    // 3. Sign in the user
    console.log('3. Signing in the user...');
    try {
      const authResult = await userClient.signIn({
        username: 'testuser',
        password: 'Password123!',
      });
      console.log('Sign in result:', {
        accessToken: `${authResult.accessToken.substring(0, 10)}...`,
        idToken: `${authResult.idToken.substring(0, 10)}...`,
        refreshToken: `${authResult.refreshToken.substring(0, 10)}...`,
        expiresIn: authResult.expiresIn,
      });

      // 4. Get user attributes
      console.log('4. Getting user attributes...');
      const userAttributes = await userClient.getUserAttributes({
        accessToken: authResult.accessToken,
      });
      console.log('User attributes:', userAttributes);

      // 5. Update user attributes
      console.log('5. Updating user attributes...');
      const updateResult = await userClient.updateUserAttributes({
        accessToken: authResult.accessToken,
        attributes: {
          name: 'Updated Name',
          customData: 'updated value',
        },
      });
      console.log('Update result:', updateResult);

      // 6. Change password
      console.log('6. Changing password...');
      try {
        const changePasswordResult = await userClient.changePassword({
          accessToken: authResult.accessToken,
          oldPassword: 'Password123!',
          newPassword: 'NewPassword123!',
        });
        console.log('Change password result:', changePasswordResult);
      } catch (error) {
        console.log('Change password failed - this is expected in the sample');
      }

      // 7. Sign out
      console.log('7. Signing out...');
      const signOutResult = await userClient.globalSignOut({
        accessToken: authResult.accessToken,
      });
      console.log('Sign out result:', signOutResult);
    } catch (error) {
      console.log('Authentication operations failed - this may be expected in the sample');
    }

    // 8. Forgot password flow
    console.log('8. Initiating forgot password flow...');
    try {
      const forgotResult = await userClient.forgotPassword({
        username: 'testuser',
      });
      console.log('Forgot password initiated:', forgotResult);

      // 9. Confirm forgot password (would normally happen after user gets code)
      console.log('9. Confirming password reset...');
      // In a real app, you would get this code from the user's email
      const resetCode = '654321';
      const confirmForgotResult = await userClient.confirmForgotPassword({
        username: 'testuser',
        confirmationCode: resetCode,
        newPassword: 'ResetPassword123!',
      });
      console.log('Confirm forgot password result:', confirmForgotResult);
    } catch (error) {
      console.log('Password reset operations - this may require actual email verification');
    }
  } catch (error) {
    console.error('User client example error:', error);
  }
}

/**
 * Example of CognitoAdminClient usage
 */
async function adminClientExample(): Promise<void> {
  console.log('\n=== Admin Client Example ===');

  try {
    // Create a shared CognitoIdentityProviderClient with admin credentials
    const cognitoProvider = new CognitoIdentityProviderClient({
      region: REGION,
      credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
      },
    });

    // Create the admin client with the provider
    const adminClient = new CognitoAdminClient(
      {
        region: REGION,
        userPoolId: USER_POOL_ID,
        clientId: CLIENT_ID,
        credentials: {
          accessKeyId: ACCESS_KEY,
          secretAccessKey: SECRET_KEY,
        },
      },
      cognitoProvider,
    );

    // 1. Create a user as admin
    console.log('1. Creating a user as admin...');
    const username = `adminuser-${Math.floor(Math.random() * 1000)}`;
    try {
      const createResult = await adminClient.createUser({
        username,
        email: `${username}@example.com`,
        password: 'AdminPassword123!',
        attributes: {
          name: 'Admin Created User',
          customRole: 'tester',
        },
      });
      console.log('User creation result:', createResult);

      // 2. Get user details
      console.log('2. Getting user details...');
      const userDetails = await adminClient.getUser({
        username,
      });
      console.log('User details:', {
        username: userDetails.username,
        status: userDetails.userStatus,
        enabled: userDetails.enabled,
        created: userDetails.userCreateDate,
        // Show a few sample attributes
        email: userDetails.userAttributes.email,
        name: userDetails.userAttributes.name,
      });

      // 3. Update user attributes
      console.log('3. Updating user attributes...');
      const updateResult = await adminClient.updateUserAttributes({
        username,
        attributes: {
          name: 'Updated Admin User',
          customRole: 'admin',
        },
      });
      console.log('Update result:', updateResult);

      // 4. Create a user group (if it doesn't exist)
      console.log('4. Creating a user group...');
      const groupName = 'Testers';
      try {
        const createGroupResult = await adminClient.createGroup({
          groupName,
          description: 'Group for testers',
        });
        console.log('Group creation result:', {
          name: createGroupResult.groupName,
          description: createGroupResult.description,
        });
      } catch (error) {
        console.log('Group may already exist');
      }

      // 5. Add user to group
      console.log('5. Adding user to group...');
      const addToGroupResult = await adminClient.adminAddUserToGroup({
        username,
        groupName,
      });
      console.log('Add to group result:', addToGroupResult);

      // 6. List groups for user
      console.log('6. Listing groups for user...');
      const userGroups = await adminClient.adminListGroupsForUser({
        username,
      });
      console.log(
        'User groups:',
        userGroups.groups.map((g) => g.groupName),
      );

      // 7. List users in group
      console.log('7. Listing users in group...');
      const usersInGroup = await adminClient.listUsersInGroup({
        groupName,
      });
      console.log(
        'Users in group:',
        usersInGroup.users.map((u) => u.username),
      );

      // 8. Reset user password
      console.log('8. Resetting user password...');
      const resetResult = await adminClient.resetUserPassword({
        username,
      });
      console.log('Reset password result:', resetResult);

      // 9. Disable user
      console.log('9. Disabling user...');
      const disableResult = await adminClient.disableUser({
        username,
      });
      console.log('Disable user result:', disableResult);

      // 10. Enable user
      console.log('10. Enabling user...');
      const enableResult = await adminClient.enableUser({
        username,
      });
      console.log('Enable user result:', enableResult);

      // 11. Admin confirm sign up
      console.log('11. Confirming user sign up as admin...');
      const confirmResult = await adminClient.adminConfirmSignUp({
        username,
      });
      console.log('Confirm sign up result:', confirmResult);

      // 12. List all users (with limit)
      console.log('12. Listing users in user pool...');
      const usersList = await adminClient.listUsers({
        limit: 5,
      });
      console.log(
        'Users list:',
        usersList.users.map((u) => u.username),
      );

      // 13. Sign out user from all devices
      console.log('13. Signing out user from all devices...');
      const signOutResult = await adminClient.adminUserGlobalSignOut({
        username,
      });
      console.log('Sign out result:', signOutResult);

      // 14. Delete user
      console.log('14. Deleting user...');
      const deleteResult = await adminClient.deleteUser({
        username,
      });
      console.log('Delete user result:', deleteResult);
    } catch (error) {
      console.log('Admin operations may require actual AWS credentials to work');
      console.error('Admin operation error:', error);
    }
  } catch (error) {
    console.error('Admin client example error:', error);
  }
}

/**
 * Run the examples
 */
async function runExamples(): Promise<void> {
  // Run the user client example
  await userClientExample();

  // Run the admin client example
  await adminClientExample();
}

runExamples().catch((error) => {
  console.error('Example failed:', error);
});
