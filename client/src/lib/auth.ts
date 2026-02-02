/**
 * Authentication utilities for PAIBot
 * Handles token storage, validation, and refresh
 */

// Storage keys
export const TOKEN_KEY = 'paibot_auth_token';
export const REFRESH_TOKEN_KEY = 'paibot_refresh_token';
export const USER_KEY = 'paibot_auth_user';

// API Base URL
export const getAuthApiUrl = () => {
  const isDevelopment = import.meta.env.DEV;
  const envUrl = import.meta.env.VITE_AUTH_API_URL;
  if (envUrl) return envUrl;
  return isDevelopment
    ? 'http://localhost:5164/api'
    : 'https://amgweb3webapp-it-eseqcmg7awggf6hr.southeastasia-01.azurewebsites.net/api';
};

// Parse JWT token
export function parseJWT(token: string): { user_id: string; role: string; exp: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload) return true;
  // Add 30 second buffer before actual expiration
  return Date.now() >= (payload.exp * 1000) - 30000;
}

// Check if token is about to expire (within 5 minutes)
export function isTokenExpiringSoon(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload) return true;
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() >= (payload.exp * 1000) - fiveMinutes;
}

// Get stored tokens
export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    user: localStorage.getItem(USER_KEY) ? JSON.parse(localStorage.getItem(USER_KEY)!) : null,
  };
}

// Store tokens
export function storeTokens(accessToken: string, refreshToken: string, user: any) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Clear tokens (logout)
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Refresh access token using refresh token
export async function refreshAccessToken(): Promise<{ success: boolean; accessToken?: string }> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY) ? JSON.parse(localStorage.getItem(USER_KEY)!) : null;

  if (!refreshToken || !user) {
    console.log('No refresh token or user found');
    return { success: false };
  }

  try {
    const apiUrl = getAuthApiUrl();
    console.log('Refreshing access token...');

    const response = await fetch(`${apiUrl}/AuthPrivy/AmgrefreshAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken: refreshToken,
        userId: user.userId,
      }),
    });

    const data = await response.json();
    console.log('Refresh token response:', data);

    if (!response.ok || !data.dbResponse?.isSuccess || !data.dbResponse?.data) {
      console.error('Token refresh failed:', data);
      return { success: false };
    }

    // Extract new tokens from response
    const { jwtToken, refereshToken: newRefreshToken } = data.dbResponse.data;

    // Update stored tokens
    localStorage.setItem(TOKEN_KEY, jwtToken);
    if (newRefreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    }

    console.log('Token refreshed successfully');
    return { success: true, accessToken: jwtToken };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { success: false };
  }
}

// Get valid access token (refresh if needed)
export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = localStorage.getItem(TOKEN_KEY);

  if (!accessToken) {
    return null;
  }

  // If token is not expired and not expiring soon, return it
  if (!isTokenExpired(accessToken) && !isTokenExpiringSoon(accessToken)) {
    return accessToken;
  }

  // If token is expired or expiring soon, try to refresh
  if (isTokenExpiringSoon(accessToken)) {
    const result = await refreshAccessToken();
    if (result.success && result.accessToken) {
      return result.accessToken;
    }
  }

  // If refresh failed and token is actually expired, return null
  if (isTokenExpired(accessToken)) {
    clearTokens();
    return null;
  }

  // Token not yet expired, return it
  return accessToken;
}

// Check authentication status
export async function checkAuth(): Promise<{ isAuthenticated: boolean; user: any | null }> {
  const token = await getValidAccessToken();

  if (!token) {
    return { isAuthenticated: false, user: null };
  }

  const user = localStorage.getItem(USER_KEY) ? JSON.parse(localStorage.getItem(USER_KEY)!) : null;
  return { isAuthenticated: true, user };
}
