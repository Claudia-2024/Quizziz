import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// Simple API base selection; you can switch to Angular environments later
const API_BASE = (globalThis as any).API_BASE_URL || 'http://localhost:3000';

export interface AdminLoginResponse {
  message?: string;
  token: string;
  admin?: { adminId?: number; email?: string; role?: string };
  expiresIn?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private tokenKey = 'admin_token';
  private adminKey = 'admin_profile';

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get admin(): any | null {
    const raw = localStorage.getItem(this.adminKey);
    return raw ? JSON.parse(raw) : null;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  async login(email: string, password: string): Promise<void> {
    const url = `${API_BASE}/admin/login`;
    const res = await this.http
      .post<AdminLoginResponse>(url, { email, password })
      .toPromise();
    if (!res || !res.token) throw new Error('Login failed');
    localStorage.setItem(this.tokenKey, res.token);
    if (res.admin) localStorage.setItem(this.adminKey, JSON.stringify(res.admin));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.adminKey);
    this.router.navigate(['/login']);
  }
}
