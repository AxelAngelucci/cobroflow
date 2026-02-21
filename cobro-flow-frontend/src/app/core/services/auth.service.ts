import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, tap, catchError, switchMap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  User,
  ApiError
} from '../models/auth.models';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = `${environment.apiUrl}/auth`;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Reactive state
  private currentUserSignal = signal<User | null>(this.getStoredUser());
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Public computed signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    // Check token validity on service init (only in browser)
    if (this.isBrowser && this.getToken()) {
      this.loadCurrentUser();
    }
  }

  /**
   * Register a new user with organization
   */
  register(data: RegisterRequest): Observable<User> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<User>(`${this.apiUrl}/register`, data).pipe(
      tap(() => {
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Login user and store token
   */
  login(email: string, password: string, rememberMe = false): Observable<LoginResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    const request: LoginRequest = { email, password };

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        this.storeToken(response.access_token, rememberMe);
      }),
      switchMap((loginResponse) =>
        this.getCurrentUser().pipe(map(() => loginResponse))
      ),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        this.currentUserSignal.set(user);
        this.storeUser(user);
        this.isLoadingSignal.set(false);
      }),
      catchError((error) => this.handleError(error))
    );
  }

  /**
   * Logout user and clear storage
   */
  logout(): void {
    this.clearStorage();
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Development only: Login with mock user
   * This bypasses the API and sets a mock user for testing
   */
  devLogin(): void {
    if (!this.isBrowser) return;
    
    const mockUser: User = {
      id: 'dev-user-123',
      email: 'dev@cobroflow.com',
      full_name: 'Usuario Desarrollo',
      organization_id: 'org-dev-123',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString()
    };

    // Store mock token and user
    sessionStorage.setItem(TOKEN_KEY, 'dev-mock-token');
    this.storeUser(mockUser);
    this.currentUserSignal.set(mockUser);
  }

  /**
   * Update user data in the store
   */
  updateUserData(userData: Partial<User>): void {
    const currentUser = this.currentUserSignal();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      this.currentUserSignal.set(updatedUser);
      this.storeUser(updatedUser);
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }

  // Private methods
  private loadCurrentUser(): void {
    this.getCurrentUser().subscribe({
      error: () => {
        // Token invalid, clear storage
        this.clearStorage();
      }
    });
  }

  private storeToken(token: string, rememberMe: boolean): void {
    if (!this.isBrowser) return;
    
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  }

  private storeUser(user: User): void {
    if (!this.isBrowser) return;
    
    const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
    storage.setItem(USER_KEY, JSON.stringify(user));
  }

  private getStoredUser(): User | null {
    if (!this.isBrowser) return null;
    
    const userJson = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  private clearStorage(): void {
    if (!this.isBrowser) return;
    
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.isLoadingSignal.set(false);
    
    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error) {
      const apiError = error.error as ApiError;
      
      if (typeof apiError.detail === 'string') {
        // Map common error messages to Spanish
        errorMessage = this.translateError(apiError.detail);
      } else if (Array.isArray(apiError.detail)) {
        // Validation errors
        errorMessage = apiError.detail.map(e => e.msg).join(', ');
      }
    } else if (error.status === 0) {
      errorMessage = 'No se pudo conectar con el servidor';
    }

    this.errorSignal.set(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private translateError(message: string): string {
    const translations: Record<string, string> = {
      'Email already registered': 'Este email ya está registrado',
      'Incorrect email or password': 'Email o contraseña incorrectos',
      'Could not validate credentials': 'Sesión expirada, por favor inicia sesión nuevamente',
      'Not authenticated': 'No estás autenticado'
    };
    return translations[message] || message;
  }
}
