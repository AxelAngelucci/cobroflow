import { Component, ChangeDetectionStrategy, signal, inject, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthLeftPanelComponent } from '../components/auth-left-panel.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    AuthLeftPanelComponent
  ],
  template: `
    <div class="flex min-h-screen w-full">
      <app-auth-left-panel />
      
      <main class="flex-1 lg:w-[30vw] min-h-screen flex justify-center items-center p-8 lg:p-16 bg-white">
        <div class="w-full max-w-md">
          <header class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Iniciar Sesión</h1>
            <p class="text-gray-500">Ingresa a tu cuenta de CobroFlow</p>
          </header>

          <!-- Error Alert -->
          @if (authService.error()) {
            <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <i-lucide name="info" [size]="20" class="text-red-500 flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <p class="text-sm text-red-700">{{ authService.error() }}</p>
              </div>
              <button type="button" (click)="authService.clearError()" class="text-red-500 hover:text-red-700">
                <i-lucide name="x" [size]="16" />
              </button>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
            <div class="flex flex-col gap-5">
              <!-- Email -->
              <div class="flex flex-col gap-2">
                <label for="email" class="text-sm font-semibold text-gray-800">Email *</label>
                <input
                  type="email"
                  id="email"
                  formControlName="email"
                  class="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="tu&#64;empresa.com"
                  autocomplete="email"
                />
              </div>

              <!-- Password -->
              <div class="flex flex-col gap-2">
                <label for="password" class="text-sm font-semibold text-gray-800">Contraseña *</label>
                <div class="relative">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    id="password"
                    formControlName="password"
                    class="w-full h-12 px-4 pr-12 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                    placeholder="••••••••"
                    autocomplete="current-password"
                  />
                  <button
                    type="button"
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    (click)="togglePassword()"
                    [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  >
                    <i-lucide [name]="showPassword() ? 'eye' : 'eye-off'" [size]="20" />
                  </button>
                </div>
              </div>

              <!-- Remember & Forgot -->
              <div class="flex justify-between items-center">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" formControlName="rememberMe" class="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                  <span class="text-sm text-gray-500">Recordarme</span>
                </label>
                <a routerLink="/auth/recuperar-contrasena" class="text-sm font-medium text-emerald-600 hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <!-- Submit -->
            <button 
              type="submit" 
              class="w-full h-12 bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              [disabled]="loginForm.invalid || authService.isLoading()"
            >
              @if (authService.isLoading()) {
                <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Iniciando sesión...</span>
              } @else {
                <span>Iniciar Sesión</span>
              }
            </button>

            <!-- Divider -->
            <div class="flex items-center gap-4">
              <div class="flex-1 h-px bg-gray-200"></div>
              <span class="text-sm text-gray-400">o</span>
              <div class="flex-1 h-px bg-gray-200"></div>
            </div>

            <!-- Google -->
            <button type="button" class="w-full h-12 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors">
              <i-lucide name="mail" [size]="20" />
              Continuar con Google
            </button>

            <!-- Signup link -->
            <p class="text-center text-sm text-gray-500">
              ¿No tienes cuenta?
              <a routerLink="/auth/registro" class="font-semibold text-emerald-600 hover:underline ml-1">Regístrate gratis</a>
            </p>

            <!-- DEV ONLY: Skip login button -->
            <button 
              type="button" 
              (click)="skipLogin()"
              class="w-full h-10 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium rounded-lg transition-colors border border-amber-300"
            >
              🔧 Ir al Dashboard (Dev Mode)
            </button>
          </form>
        </div>
      </main>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  protected authService = inject(AuthService);

  protected showPassword = signal(false);

  protected loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  protected togglePassword() {
    this.showPassword.update(v => !v);
  }

  protected onSubmit() {
    if (this.loginForm.valid) {
      const { email, password, rememberMe } = this.loginForm.getRawValue();
      
      this.authService.login(email, password, rememberMe).subscribe({
        next: () => {
          // Navigate to dashboard after successful login
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          // Error is already handled by the service, just stop loading
          // The error message will be displayed via authService.error()
        }
      });
    }
  }

  // Temporary method for development - skip login with mock user
  protected skipLogin(): void {
    this.authService.devLogin();
    this.router.navigate(['/dashboard']);
  }
}
