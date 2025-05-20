/**
 * Extracts an access token from an authorization header
 * @param authHeader - The authorization header, typically in format "Bearer token"
 * @returns The extracted access token, or an empty string if not found
 */
export function extractAccessToken(authHeader: string): string {
  if (!authHeader) return '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return authHeader;
}
