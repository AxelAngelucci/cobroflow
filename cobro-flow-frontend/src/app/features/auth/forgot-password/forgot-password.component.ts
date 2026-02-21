import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthLeftPanelComponent } from '../components/auth-left-panel.component';

@Component({
  selector: 'app-forgot-password',
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
          <header class="flex flex-col items-center gap-4 mb-8 text-center">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <i-lucide name="key-round" [size]="32" class="text-gray-700" />
            </div>
            <h1 class="text-3xl font-bold text-gray-800">¿Olvidaste tu contraseña?</h1>
            <p class="text-gray-500">
              No te preocupes, te enviaremos instrucciones<br />
              para restablecerla
            </p>
          </header>

          <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-8">
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

            <button 
              type="submit" 
              class="w-full h-12 bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
              [disabled]="forgotForm.invalid"
            >
              <i-lucide name="mail" [size]="20" />
              Enviar instrucciones
            </button>

            <a routerLink="/auth/login" class="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 hover:underline">
              <i-lucide name="arrow-left" [size]="16" />
              Volver al inicio de sesión
            </a>
          </form>
        </div>
      </main>
    </div>
  `
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  protected forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  protected onSubmit() {
    if (this.forgotForm.valid) {
      console.log('Forgot password submitted:', this.forgotForm.value);
    }
  }
}
