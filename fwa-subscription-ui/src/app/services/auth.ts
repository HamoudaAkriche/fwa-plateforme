import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { getApiBaseUrl } from './api-base';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private static readonly ROLE_KEY = 'role';

  private apiUrl = `${getApiBaseUrl()}/auth`;

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<{token: string; role: string}>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(res => {
          localStorage.setItem('token', res.token);
          localStorage.setItem(AuthService.ROLE_KEY, res.role ?? 'AGENT');
        }),
        catchError(err => {
          console.error('AuthService.login error:', err);
          const message = err?.error?.message ?? err?.message ?? 'Invalid credentials';
          return throwError(() => new Error(message));
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem(AuthService.ROLE_KEY);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRole(): string {
    return localStorage.getItem(AuthService.ROLE_KEY) ?? 'AGENT';
  }

  isSuperAdmin(): boolean {
    return this.getRole() === 'SUPER_ADMIN';
  }
}