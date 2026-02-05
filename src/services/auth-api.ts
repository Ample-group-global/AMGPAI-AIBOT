import { getConfig } from '@/config';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  role?: string;
}

interface SendOtpResponse {
  success: boolean;
  error?: string;
}

interface VerifyOtpResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

interface GetMeResponse {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

interface LogoutResponse {
  success: boolean;
  error?: string;
}

class AuthApiService {
  private get baseUrl(): string {
    return getConfig().authApiUrl;
  }

  async sendOtp(email: string): Promise<SendOtpResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/AuthPrivy/SendPrivyOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }

      const data = await response.json();
      if (data.isSuccess && data.data?.success) {
        return { success: true };
      }
      return { success: false, error: data.errorMessage || 'Failed to send OTP' };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        return { success: false, error: 'Network error - please check if the API server is running' };
      }
      return { success: false, error: errorMsg };
    }
  }

  async verifyOtp(email: string, code: string): Promise<VerifyOtpResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/AuthPrivy/AuthenticatePrivyOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok || !data.dbResponse?.isSuccess || !data.dbResponse?.data) {
        const errorMsg = data.dbResponse?.errorMessage || data.message || 'Authentication failed';
        return { success: false, error: errorMsg };
      }

      const { userId } = data.dbResponse.data;
      return {
        success: true,
        user: {
          id: userId,
          email: email,
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Authentication failed' };
    }
  }

  async getMe(): Promise<GetMeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/AuthPrivy/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        return { success: false, error: 'Not authenticated' };
      }

      const data = await response.json();
      if (data.user) {
        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            username: data.user.username,
            role: data.user.role,
          },
        };
      }
      return { success: false, error: 'No user data' };
    } catch {
      return { success: false, error: 'Failed to check authentication' };
    }
  }

  async logout(): Promise<LogoutResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/AuthPrivy/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        return { success: false, error: 'Logout failed' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Logout failed' };
    }
  }

  async refreshToken(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/AuthPrivy/AmgrefreshAccessToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        return { success: false, error: 'Token refresh failed' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Token refresh failed' };
    }
  }
}

export const authApi = new AuthApiService();
