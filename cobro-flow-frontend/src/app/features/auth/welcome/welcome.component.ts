import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-welcome',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slide-up {
      from { 
        opacity: 0; 
        transform: translateY(16px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }

    @keyframes check-scale {
      0% { transform: scale(0); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    @keyframes step-appear {
      from { 
        opacity: 0; 
        transform: translateX(-12px); 
      }
      to { 
        opacity: 1; 
        transform: translateX(0); 
      }
    }

    .animate-fade-in {
      animation: fade-in 0.8s ease-out forwards;
    }

    .animate-slide-up {
      opacity: 0;
      animation: slide-up 0.8s ease-out forwards;
    }

    .animate-check {
      animation: check-scale 0.6s ease-out 0.3s forwards;
      transform: scale(0);
    }

    .animate-step {
      opacity: 0;
      animation: step-appear 0.6s ease-out forwards;
    }

    .delay-100 { animation-delay: 0.1s; }
    .delay-200 { animation-delay: 0.2s; }
    .delay-300 { animation-delay: 0.3s; }
    .delay-400 { animation-delay: 0.4s; }
    .delay-500 { animation-delay: 0.5s; }
  `],
  template: `
    <div class="h-screen w-full bg-white flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="shrink-0 border-b border-gray-100">
        <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 bg-[#0F172A] rounded-lg flex items-center justify-center">
              <i-lucide name="zap" [size]="14" class="text-white" />
            </div>
            <span class="text-sm font-semibold text-gray-900">CobroFlow</span>
          </div>
          <button 
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            (click)="goToDashboard()"
          >
            Ir al dashboard →
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 flex items-center justify-center px-6 py-8">
        <div class="w-full max-w-5xl">
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <!-- Left: Message -->
            <div class="text-center lg:text-left">
              <!-- Success Icon -->
              <div class="animate-fade-in mb-6 flex justify-center lg:justify-start">
                <div class="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-full">
                  <div class="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center animate-check">
                    <i-lucide name="check" [size]="20" class="text-white" strokeWidth="3" />
                  </div>
                </div>
              </div>

              <!-- Title -->
              <h1 class="animate-slide-up delay-200 text-3xl lg:text-4xl font-semibold text-gray-900 tracking-tight mb-3">
                Todo listo
              </h1>

              <!-- Subtitle -->
              <p class="animate-slide-up delay-300 text-base text-gray-500 mb-8">
                Tu cuenta está configurada. Comienza a automatizar tus cobranzas en minutos.
              </p>

              <!-- CTA Button -->
              <div class="animate-slide-up delay-400 mb-8 lg:mb-0">
                <button 
                  type="button"
                  class="inline-flex items-center gap-2 h-11 px-5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                  (click)="goToDashboard()"
                >
                  Comenzar
                  <i-lucide name="arrow-right" [size]="16" />
                </button>
              </div>

              <!-- Stats -->
              <div class="animate-slide-up delay-500 hidden lg:flex items-center gap-8 pt-8 border-t border-gray-100">
                @for (stat of stats; track stat.label) {
                  <div>
                    <p class="text-2xl font-semibold text-gray-900">{{ stat.value }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">{{ stat.label }}</p>
                  </div>
                }
              </div>
            </div>

            <!-- Right: Steps -->
            <div class="animate-slide-up delay-400">
              <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Próximos pasos</p>
              
              <div class="space-y-3">
                @for (step of steps; track step.id; let i = $index) {
                  @if (visibleSteps() > i) {
                    <div 
                      class="animate-step flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-white"
                      [style.animation-delay.ms]="i * 150"
                    >
                      <div 
                        class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-gray-100 text-gray-400"
                      >
                        <span class="text-xs font-medium">{{ i + 1 }}</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900">{{ step.title }}</p>
                        <p class="text-xs text-gray-500 mt-0.5">{{ step.description }}</p>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="shrink-0 border-t border-gray-100">
        <div class="max-w-6xl mx-auto px-6 py-4">
          <div class="flex items-center justify-between text-xs text-gray-400">
            <p>¿Necesitas ayuda? <a href="#" class="text-gray-600 hover:text-gray-900 transition-colors">Contactar soporte</a></p>
            <div class="flex items-center gap-5">
              <a href="#" class="hover:text-gray-600 transition-colors">Docs</a>
              <a href="#" class="hover:text-gray-600 transition-colors">API</a>
              <a href="#" class="hover:text-gray-600 transition-colors">Changelog</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class WelcomeComponent implements OnInit {
  private router = inject(Router);

  protected visibleSteps = signal(0);

  protected steps = [
    {
      id: 1,
      title: 'Crea tu primera campaña',
      description: 'Configura mensajes automáticos de cobranza'
    },
    {
      id: 2,
      title: 'Importa tu cartera de clientes',
      description: 'Sube un archivo Excel o conecta tu sistema'
    },
    {
      id: 3,
      title: 'Activa las notificaciones',
      description: 'Recibe alertas de pagos y vencimientos'
    }
  ];

  protected stats = [
    { value: '+15,000', label: 'Empresas activas' },
    { value: '94%', label: 'Tasa de recuperación' },
    { value: '2.5x', label: 'Más eficiente' }
  ];

  ngOnInit() {
    this.revealSteps();
  }

  private revealSteps() {
    // Start revealing steps after initial animations
    setTimeout(() => {
      this.visibleSteps.set(1);
      
      setTimeout(() => {
        this.visibleSteps.set(2);
        
        setTimeout(() => {
          this.visibleSteps.set(3);
        }, 600);
      }, 600);
    }, 800);
  }

  protected goToDashboard() {
    console.log('Navigating to dashboard...');
  }
}
