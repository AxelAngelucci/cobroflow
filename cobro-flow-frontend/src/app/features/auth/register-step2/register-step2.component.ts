import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthLeftPanelComponent } from '../components/auth-left-panel.component';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterStateService } from '../../../core/services/register-state.service';
import { 
  RegisterRequest, 
  INDUSTRY_MAP, 
  COMPANY_SIZE_MAP, 
  MONTHLY_VOLUME_MAP 
} from '../../../core/models/auth.models';

@Component({
  selector: 'app-register-step2',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    AuthLeftPanelComponent
  ],
  template: `
    <div class="flex min-h-screen w-full">
      <app-auth-left-panel
        title="¡Último paso!"
        description="Cuéntanos sobre tu empresa para personalizar tu experiencia"
        [stats]="benefits"
        [showProgress]="true"
        [currentStep]="2"
        [totalSteps]="2"
        [showIcon]="true"
        icon="building-2"
        [hideHeader]="true"
      />
      
      <main class="flex-1 lg:w-[30vw] min-h-screen flex justify-center items-center p-8 lg:p-16 bg-white">
        <div class="w-full max-w-md">
          <header class="mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Información de la Empresa</h1>
            <p class="text-gray-500">Paso 2 de 2: Datos corporativos</p>
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

          <form [formGroup]="companyForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
            <div class="flex flex-col gap-5">
              <!-- Company Name -->
              <div class="flex flex-col gap-2">
                <label for="companyName" class="text-sm font-semibold text-gray-800">Nombre de la empresa *</label>
                <input
                  type="text"
                  id="companyName"
                  formControlName="companyName"
                  class="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="Acme S.A."
                  autocomplete="organization"
                />
              </div>

              <!-- Tax ID -->
              <div class="flex flex-col gap-2">
                <label for="taxId" class="text-sm font-semibold text-gray-800">CUIT / RUT / RFC *</label>
                <input
                  type="text"
                  id="taxId"
                  formControlName="taxId"
                  class="w-full h-12 px-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  placeholder="20-12345678-9"
                />
              </div>

              <!-- Industry -->
              <div class="flex flex-col gap-2">
                <label for="industry" class="text-sm font-semibold text-gray-800">Industria *</label>
                <div class="relative">
                  <select 
                    id="industry" 
                    formControlName="industry" 
                    class="w-full h-12 px-4 pr-10 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none appearance-none cursor-pointer transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  >
                    <option value="" disabled class="text-gray-400">Selecciona tu industria</option>
                    <option value="finanzas">Servicios Financieros</option>
                    <option value="retail">Retail / Comercio</option>
                    <option value="telecomunicaciones">Telecomunicaciones</option>
                    <option value="servicios">Servicios Profesionales</option>
                    <option value="salud">Salud</option>
                    <option value="educacion">Educación</option>
                    <option value="inmobiliaria">Inmobiliaria</option>
                    <option value="manufactura">Manufactura</option>
                    <option value="tecnologia">Tecnología</option>
                    <option value="otro">Otro</option>
                  </select>
                  <i-lucide name="chevron-down" [size]="20" class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                </div>
              </div>

              <!-- Company Size -->
              <div class="flex flex-col gap-2">
                <label for="companySize" class="text-sm font-semibold text-gray-800">Tamaño de empresa *</label>
                <div class="relative">
                  <select 
                    id="companySize" 
                    formControlName="companySize" 
                    class="w-full h-12 px-4 pr-10 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none appearance-none cursor-pointer transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  >
                    <option value="" disabled class="text-gray-400">Selecciona el tamaño</option>
                    <option value="1-10">1-10 empleados</option>
                    <option value="11-50">11-50 empleados</option>
                    <option value="51-200">51-200 empleados</option>
                    <option value="201-500">201-500 empleados</option>
                    <option value="500+">Más de 500 empleados</option>
                  </select>
                  <i-lucide name="chevron-down" [size]="20" class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                </div>
              </div>

              <!-- Monthly Volume -->
              <div class="flex flex-col gap-2">
                <label for="monthlyVolume" class="text-sm font-semibold text-gray-800">Volumen mensual de cobranzas estimado *</label>
                <div class="relative">
                  <select 
                    id="monthlyVolume" 
                    formControlName="monthlyVolume" 
                    class="w-full h-12 px-4 pr-10 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 outline-none appearance-none cursor-pointer transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  >
                    <option value="" disabled class="text-gray-400">Ej: $500,000 - $1,000,000</option>
                    <option value="0-100k">Menos de $100,000</option>
                    <option value="100k-500k">$100,000 - $500,000</option>
                    <option value="500k-1m">$500,000 - $1,000,000</option>
                    <option value="1m-5m">$1,000,000 - $5,000,000</option>
                    <option value="5m+">Más de $5,000,000</option>
                  </select>
                  <i-lucide name="chevron-down" [size]="20" class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                </div>
              </div>
            </div>

            <!-- Submit -->
            <button 
              type="submit" 
              class="w-full h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
              [disabled]="companyForm.invalid || authService.isLoading()"
            >
              @if (authService.isLoading()) {
                <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Creando cuenta...</span>
              } @else {
                <i-lucide name="check" [size]="20" />
                <span>Crear Cuenta</span>
              }
            </button>

            <!-- Back -->
            <button 
              type="button" 
              class="w-full h-12 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
              (click)="goBack()"
              [disabled]="authService.isLoading()"
            >
              <i-lucide name="arrow-left" [size]="20" />
              Volver
            </button>
          </form>
        </div>
      </main>
    </div>
  `
})
export class RegisterStep2Component implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private registerState = inject(RegisterStateService);
  protected authService = inject(AuthService);

  protected benefits = [
    { icon: 'gauge', value: 'Dashboard personalizado', label: 'Métricas relevantes para tu industria' },
    { icon: 'bot', value: 'Campañas inteligentes', label: 'IA optimizada para tu tipo de negocio' },
    { icon: 'headset', value: 'Soporte dedicado', label: 'Asistencia personalizada en tu setup' }
  ];

  protected companyForm = this.fb.nonNullable.group({
    companyName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
    taxId: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(20)]],
    industry: ['', [Validators.required]],
    companySize: ['', [Validators.required]],
    monthlyVolume: ['', [Validators.required]]
  });

  ngOnInit() {
    // Redirect to step 1 if no data
    if (!this.registerState.hasStep1Data()) {
      this.router.navigate(['/auth/registro']);
    }
  }

  protected onSubmit() {
    if (this.companyForm.valid) {
      const step1Data = this.registerState.step1Data();
      
      if (!step1Data) {
        this.router.navigate(['/auth/registro']);
        return;
      }

      const { companyName, taxId, industry, companySize, monthlyVolume } = this.companyForm.getRawValue();

      const registerRequest: RegisterRequest = {
        full_name: step1Data.fullName,
        email: step1Data.email,
        phone: step1Data.phone,
        password: step1Data.password,
        company_name: companyName,
        cuit: taxId,
        industry_type: INDUSTRY_MAP[industry] || 'other',
        company_size: COMPANY_SIZE_MAP[companySize] || 'small',
        monthly_collection_volume: MONTHLY_VOLUME_MAP[monthlyVolume] || 100000
      };

      this.authService.register(registerRequest).subscribe({
        next: () => {
          // Clear registration state
          this.registerState.clearData();
          // Navigate to welcome page
          this.router.navigate(['/auth/bienvenida']);
        }
      });
    }
  }

  protected goBack() {
    this.router.navigate(['/auth/registro']);
  }
}
