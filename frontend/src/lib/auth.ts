import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export async function login(email: string, password: string): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8000/api/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Login failed:', errorData);
      return false;
    }

    const data = await response.json();
    Cookies.set(ACCESS_TOKEN_KEY, data.access, { expires: 1 }); // Expires in 1 day
    Cookies.set(REFRESH_TOKEN_KEY, data.refresh, { expires: 7 }); // Expires in 7 days
    return true;
  } catch (error) {
    console.error('Network error or unexpected:', error);
    return false;
  }
}

export function isUserLoggedIn(): boolean {
  return Cookies.get(ACCESS_TOKEN_KEY) !== undefined;
}

export function getAccessToken(): string | undefined {
    return Cookies.get(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | undefined {
    return Cookies.get(REFRESH_TOKEN_KEY);
}

export function logout(): void {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
}

