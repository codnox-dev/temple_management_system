// JWT Authentication Service for Frontend
// Handles secure token management without exposing secret keys

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface UserInfo {
  sub: string;
  user_id?: string;
  role?: string;
  role_id?: number;
  permissions?: string[];
}

class JWTAuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize token from session storage (not localStorage for security)
    this.loadTokenFromSession();
  }

  /**
   * Get initial token from backend for app initialization
   */
  async getInitialToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.getApiBaseUrl()}/api/auth/get-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for refresh token
      });

      if (!response.ok) {
        throw new Error('Failed to get initial token');
      }

      const tokenData: TokenResponse = await response.json();
      this.setTokens(tokenData);
      return true;
    } catch (error) {
      console.error('Failed to get initial token:', error);
      return false;
    }
  }

  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<boolean> {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${this.getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include', // Include cookies
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(errorData.detail || 'Login failed');
      }

      const tokenData: TokenResponse = await response.json();
      this.setTokens(tokenData);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout and clear tokens
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint to clear refresh token cookie
      await fetch(`${this.getApiBaseUrl()}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Get current access token (handles automatic refresh)
   */
  async getAccessToken(): Promise<string | null> {
    // Check if token is expired or expiring soon (within 1 minute)
    if (this.tokenExpiry && this.tokenExpiry.getTime() - Date.now() < 60000) {
      await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null && this.tokenExpiry !== null && this.tokenExpiry > new Date();
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const token = await this.getAccessToken();
      if (!token) return null;

      const response = await fetch(`${this.getApiBaseUrl()}/api/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      const response = await fetch(`${this.getApiBaseUrl()}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send refresh token cookie
      });

      if (!response.ok) {
        // Refresh token is invalid, clear tokens and redirect to login
        this.clearTokens();
        throw new Error('Refresh token invalid');
      }

      const tokenData: TokenResponse = await response.json();
      this.setTokens(tokenData);
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Set tokens and manage expiry
   */
  private setTokens(tokenData: TokenResponse): void {
    this.accessToken = tokenData.access_token;
    this.tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
    
    // Store in session storage (not localStorage for security)
    sessionStorage.setItem('access_token', this.accessToken);
    sessionStorage.setItem('token_expiry', this.tokenExpiry.toISOString());

    // Set up automatic refresh timer (refresh 1 minute before expiry)
    this.setRefreshTimer(tokenData.expires_in - 60);
  }

  /**
   * Clear all tokens
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    // Clear session storage
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('token_expiry');

    // Clear refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Load token from session storage on init
   */
  private loadTokenFromSession(): void {
    const token = sessionStorage.getItem('access_token');
    const expiry = sessionStorage.getItem('token_expiry');

    if (token && expiry) {
      const expiryDate = new Date(expiry);
      if (expiryDate > new Date()) {
        this.accessToken = token;
        this.tokenExpiry = expiryDate;
        
        // Set refresh timer
        const secondsUntilRefresh = Math.max(0, (expiryDate.getTime() - Date.now()) / 1000 - 60);
        this.setRefreshTimer(secondsUntilRefresh);
      } else {
        // Token expired, clear it
        this.clearTokens();
      }
    }
  }

  /**
   * Set timer for automatic token refresh
   */
  private setRefreshTimer(seconds: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (seconds > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshAccessToken().catch(error => {
          console.error('Automatic token refresh failed:', error);
        });
      }, seconds * 1000);
    }
  }

  /**
   * Get API base URL from environment
   */
  private getApiBaseUrl(): string {
    // Use the environment variable, fallback to a default for local dev
    // return import.meta.env.VITE_API_BASE_URL || 'https://temple-management-system-3p4x.onrender.com';
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  }
}

// Export singleton instance
export const jwtAuth = new JWTAuthService();
export default jwtAuth;