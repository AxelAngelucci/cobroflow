import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthLeftPanelComponent } from '../components/auth-left-panel.component';
import { RegisterStateService } from '../../../core/services/register-state.service';

@Component({
  selector: 'app-register-step1',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    AuthLeftPanelComponent
  ],
  template: `
    <div class="flex min-h-screen w-full">
      <app-auth-left-panel
        title="¡Comienza tu viaje!"
        description="Únete a miles de empresas que ya automatizan su gestión de cobranzas"
        [stats]="stats"
        [showProgress]="true"
        [currentStep]="1"
        [totalSteps]="2"
        [showIcon]="true"
        icon="rocket"
        [hideHeader]="true"
      />
      
      <main class="flex-1 lg:w-[30vw] min-h-screen flex justify-center items-center p-8 lg:p-16 bg-white">
        <div class="w-full max-w-md">
          <header class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Crear Cuenta</h1>
            <p class="text-gray-500">Paso 1 de 2: Información personal</p>
          </header>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
            <div class="flex flex-col gap-5">
              <!-- Full Name -->
              <div class="flex flex-col gap-2">
                <label for="fullName" class="text-sm font-semibold text-gray-800">Nombre completo *</label>
                <input
                  type="text"
                  id="fullName"
                  formControlName="fullName"
                  class="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="Juan Pérez"
                  autocomplete="name"
                />
              </div>

              <!-- Email -->
              <div class="flex flex-col gap-2">
                <label for="email" class="text-sm font-semibold text-gray-800">Email corporativo *</label>
                <input
                  type="email"
                  id="email"
                  formControlName="email"
                  class="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="juan&#64;tuempresa.com"
                  autocomplete="email"
                />
              </div>

              <!-- Phone -->
              <div class="flex flex-col gap-2">
                <label for="phone" class="text-sm font-semibold text-gray-800">Teléfono *</label>
                <input
                  type="tel"
                  id="phone"
                  formControlName="phone"
                  class="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="+54 11 1234-5678"
                  autocomplete="tel"
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
                    placeholder="Mínimo 8 caracteres"
                    autocomplete="new-password"
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
                <span class="text-xs text-gray-500">Debe incluir mayúsculas, minúsculas y números</span>
              </div>

              <!-- Terms -->
              <label class="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" formControlName="acceptTerms" class="w-5 h-5 mt-0.5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                <span class="text-sm text-gray-500 leading-snug">
                  Acepto los <a routerLink="/auth/terms" class="text-emerald-600 font-medium hover:underline">Términos y Condiciones</a> y la 
                  <a routerLink="/auth/privacy" class="text-emerald-600 font-medium hover:underline">Política de Privacidad</a>
                </span>
              </label>
            </div>

            <!-- Submit -->
            <button 
              type="submit" 
              class="w-full h-12 bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              [disabled]="registerForm.invalid"
            >
              Continuar
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

            <!-- Login link -->
            <p class="text-center text-sm text-gray-500">
              ¿Ya tienes cuenta?
              <a routerLink="/auth/login" class="font-semibold text-emerald-600 hover:underline ml-1">Inicia sesión</a>
            </p>
          </form>
        </div>
      </main>
    </div>
  `
})
export class RegisterStep1Component {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private registerState = inject(RegisterStateService);

  protected showPassword = signal(false);

  protected stats = [
    { icon: 'zap', value: '5 minutos', label: 'Tiempo promedio de configuración' },
    { icon: 'shield-check', value: '100% seguro', label: 'Encriptación bancaria de tus datos' },
    { icon: 'gift', value: '30 días gratis', label: 'Prueba todas las funciones premium' }
  ];

  protected registerForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    acceptTerms: [false, [Validators.requiredTrue]]
  });

  protected togglePassword() {
    this.showPassword.update(v => !v);
  }

  protected onSubmit() {
    if (this.registerForm.valid) {
      const { fullName, email, phone, password } = this.registerForm.getRawValue();
      
      // Store step 1 data for step 2
      this.registerState.setStep1Data({
        fullName,
        email,
        phone,
        password
      });
      
      this.router.navigate(['/auth/registro/empresa']);
    }
  }
}
